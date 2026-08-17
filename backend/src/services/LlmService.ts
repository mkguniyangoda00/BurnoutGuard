import axios from 'axios';
import { Env } from '../config/env';

export interface LlmChatContext {
  riskLevel: string | null;
  riskScore: number | null;
  topFactors: string[];
  dimensionBreakdown?: { dimension: string; score: number }[];
}

export interface LlmConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are BurnoutGuard's supportive wellbeing assistant.
Be warm, natural, and conversational. Respond like a thoughtful teammate who can explain things clearly without sounding scripted.

Safety and privacy rules:
- Never ask for or repeat personal identifiers such as name, email, or company.
- Do not provide medical or psychiatric diagnoses.
- If the user mentions self-harm or feeling unsafe, respond with empathy and encourage immediate support from local emergency services, a crisis line, or a trusted person.
- Use the provided anonymous context only as background awareness. Do not mention that it is anonymized context unless the user asks.
- Avoid repeating the same phrasing across replies. Vary length naturally based on the user's message.`;

export class LlmService {
  private timeoutMs = 8000;
  private providerDisabledReason: string | null = null;
  private startupLogged = false;

  private isConfigured(): boolean {
    return !!Env.LLM_API_KEY && !this.providerDisabledReason;
  }

  logStartupStatus(): void {
    if (this.startupLogged) return;
    this.startupLogged = true;

    if (Env.LLM_API_KEY && !this.providerDisabledReason) {
      console.log(`[LlmService] LLM path active using model ${Env.LLM_MODEL} at ${Env.LLM_API_URL}.`);
    } else if (!Env.LLM_API_KEY) {
      console.warn('[LlmService] LLM path is disabled because LLM_API_KEY is missing. Chat will fall back to rules when CHATBOT_ENGINE=llm.');
    } else {
      console.warn(`[LlmService] LLM path is temporarily disabled: ${this.providerDisabledReason}. Chat will fall back to rules until the provider recovers.`);
    }
  }

  async getChatReply(
    history: LlmConversationMessage[],
    context: LlmChatContext
  ): Promise<string | null> {
    this.logStartupStatus();

    if (!this.isConfigured()) {
      if (this.providerDisabledReason) {
        console.warn(`[LlmService] LLM provider disabled - ${this.providerDisabledReason}. Falling back to rules.`);
      } else {
        console.warn('[LlmService] LLM_API_KEY not set - falling back to rules.');
      }
      return null;
    }

    if (history.length === 0) {
      return null;
    }

    const contextSummary = this.buildSanitizedContextSummary(context);
    const system = `${SYSTEM_PROMPT}\n\nBackground context for this conversation:\n${contextSummary}`;

    const payload = {
      model: Env.LLM_MODEL,
      max_tokens: 700,
      system,
      messages: history.map((turn) => ({ role: turn.role, content: turn.content })),
    };

    const firstAttempt = await this.callProvider(payload);
    if (firstAttempt) return firstAttempt;
    if (this.providerDisabledReason) return null;

    return await this.callProvider(payload, true);
  }

  private async callProvider(
    payload: {
      model: string;
      max_tokens: number;
      system: string;
      messages: LlmConversationMessage[];
    },
    isRetry = false
  ): Promise<string | null> {
    try {
      const response = await axios.post(Env.LLM_API_URL, payload, {
        headers: {
          'x-api-key': Env.LLM_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: this.timeoutMs,
      });

      const content = response.data?.content;
      const text = Array.isArray(content)
        ? content.find((c: any) => c.type === 'text')?.text
        : undefined;

      return text ?? null;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message ?? err.response?.data?.message ?? err.message ?? '';
      const statusCode = err.response?.status;

      if (
        statusCode === 400 &&
        /credit balance is too low|out of credits|billing/i.test(String(errorMessage))
      ) {
        this.providerDisabledReason = 'Anthropic credit balance is too low';
        console.warn('[LlmService] Anthropic credit balance is too low - switching to rules.');
        return null;
      }

      if (!isRetry) {
        console.warn('[LlmService] LLM call failed on first attempt - retrying once before falling back to rules.');
        return null;
      }

      console.error('[LlmService] LLM call failed after retry - falling back to rules:', statusCode, errorMessage);
      return null;
    }
  }

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
