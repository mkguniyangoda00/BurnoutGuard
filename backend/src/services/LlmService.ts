import axios from 'axios';
import { Env } from '../config/env';

/**
 * LlmService — thin wrapper around an external LLM API (Anthropic Messages API).
 *
 * CONFIDENTIALITY RULES (do not weaken these):
 * - Never pass userId, email, fullName, company, or freeform notes/journal text.
 * - Only pass de-identified aggregate signals (riskLevel, riskScore, top SHAP
 *   feature *names*, dimension breakdown) plus the user's own chat message.
 * - Never log the raw request/response bodies (may contain the user's own
 *   typed message, which could include sensitive personal disclosures).
 */

export interface LlmChatContext {
  riskLevel: string | null;
  riskScore: number | null;
  topFactors: string[]; // plain-language, already stripped of raw values
  dimensionBreakdown?: { dimension: string; score: number }[];
}

const SYSTEM_PROMPT = `You are BurnoutGuard's supportive wellbeing assistant.
You help developers understand their burnout risk and recommendations.
Rules:
- Never ask for or repeat back personal identifiers (name, email, company).
- Do not provide medical or psychiatric diagnoses.
- If the user expresses thoughts of self-harm, gently encourage them to
  contact a crisis line or trusted person and do not attempt to counsel them yourself.
- Keep responses concise (under 120 words) and supportive.`;

export class LlmService {
  private timeoutMs = 8000;

  private isConfigured(): boolean {
    return !!Env.LLM_API_KEY;
  }

  async getChatReply(userMessage: string, context: LlmChatContext): Promise<string | null> {
    if (!this.isConfigured()) {
      console.warn('[LlmService] LLM_API_KEY not set — falling back to canned replies.');
      return null;
    }

    const contextSummary = this.buildSanitizedContextSummary(context);

    try {
      const response = await axios.post(
        Env.LLM_API_URL,
        {
          model: Env.LLM_MODEL,
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `User context (anonymized, aggregate only): ${contextSummary}\n\nUser message: ${userMessage}`,
            },
          ],
        },
        {
          headers: {
            'x-api-key': Env.LLM_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          timeout: this.timeoutMs,
        }
      );

      const content = response.data?.content;
      const text = Array.isArray(content)
        ? content.find((c: any) => c.type === 'text')?.text
        : undefined;

      return text ?? null;
    } catch (err: any) {
      // Do NOT log err.config/data — could echo back the user message.
      console.error('[LlmService] LLM call failed:', err.response?.status, err.response?.data ?? err.message);
      return null;
    }
  }

  /** Builds a strictly de-identified, aggregate-only context string. */
  private buildSanitizedContextSummary(context: LlmChatContext): string {
    const parts: string[] = [];
    if (context.riskLevel) parts.push(`riskLevel=${context.riskLevel}`);
    if (context.riskScore !== null && context.riskScore !== undefined) {
      parts.push(`riskScore=${(context.riskScore * 100).toFixed(0)}%`);
    }
    if (context.topFactors.length > 0) {
      parts.push(`topFactors=[${context.topFactors.join('; ')}]`);
    }
    if (context.dimensionBreakdown?.length) {
      const dims = context.dimensionBreakdown.map((d) => `${d.dimension}:${d.score.toFixed(2)}`).join(', ');
      parts.push(`dimensions=[${dims}]`);
    }
    return parts.length > 0 ? parts.join(', ') : 'no prediction data available yet';
  }
}