import axios from 'axios';
import { Env } from '../config/env';

/**
 * LlmService — thin wrapper around an external LLM API (Anthropic Messages API).
 *
 * CONFIDENTIALITY RULES (do not weaken these):
 * - Never pass userId, email, fullName, company, or freeform notes/journal text.
 * - Only pass de-identified aggregate signals (riskLevel, riskScore, top SHAP
 *   feature *names*, dimension breakdown) plus the user's own chat messages.
 * - Never log the raw request/response bodies (may contain the user's own
 *   typed message, which could include sensitive personal disclosures).
 */

export interface LlmChatContext {
  riskLevel: string | null;
  riskScore: number | null;
  topFactors: string[]; // plain-language, already stripped of raw values
  dimensionBreakdown?: { dimension: string; score: number }[];
}

/** A single turn in the conversation, in chronological order. */
export interface LlmConversationMessage {
  role: 'user' | 'assistant';
  content: string;
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
  private providerDisabledReason: string | null = null;

  private isConfigured(): boolean {
    return !!Env.LLM_API_KEY && !this.providerDisabledReason;
  }

  /**
   * Takes the full recent conversation (already capped by the caller — see
   * ChatService.MAX_HISTORY_MESSAGES) plus sanitized aggregate context, and
   * returns the assistant's next reply. The context summary is attached to
   * the most recent user turn only, since that reflects the developer's
   * current state most accurately; earlier turns are passed through as-is
   * so the model can follow the conversation naturally, like a normal
   * multi-turn chat rather than a single stateless Q&A.
   */
  async getChatReply(
    history: LlmConversationMessage[],
    context: LlmChatContext
  ): Promise<string | null> {
    if (!this.isConfigured()) {
      if (this.providerDisabledReason) {
        console.warn(`[LlmService] LLM provider disabled — ${this.providerDisabledReason}. Falling back to canned replies.`);
      } else {
        console.warn('[LlmService] LLM_API_KEY not set — falling back to canned replies.');
      }
      return null;
    }

    if (history.length === 0) {
      return null;
    }

    const contextSummary = this.buildSanitizedContextSummary(context);

    const messages = history.map((turn, idx) => {
      const isLastUserTurn = idx === history.length - 1 && turn.role === 'user';
      if (isLastUserTurn) {
        return {
          role: turn.role,
          content: `User context (anonymized, aggregate only): ${contextSummary}\n\nUser message: ${turn.content}`,
        };
      }
      return { role: turn.role, content: turn.content };
    });

    try {
      const response = await axios.post(
        Env.LLM_API_URL,
        {
          model: Env.LLM_MODEL,
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages,
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
      const errorMessage = err.response?.data?.error?.message ?? err.response?.data?.message ?? err.message ?? '';
      const statusCode = err.response?.status;

      if (
        statusCode === 400 &&
        /credit balance is too low|out of credits|billing/i.test(String(errorMessage))
      ) {
        this.providerDisabledReason = 'Anthropic credit balance is too low';
        console.warn('[LlmService] Anthropic credit balance is too low — switching to canned replies.');
        return null;
      }

      console.error('[LlmService] LLM call failed:', statusCode, err.response?.data ?? err.message);
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