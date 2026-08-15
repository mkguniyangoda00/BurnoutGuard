import axios from 'axios';
import { Env } from '../config/env';
import { LlmConversationMessage } from './LlmService';

/**
 * Thin client for the ml-service TensorFlow chat engine (chat_engine.py).
 * Kept separate from LlmService rather than a branch inside it, since it
 * talks to a different service (ML_SERVICE_URL, not the hosted LLM API)
 * and exists purely for the engine comparison in the evaluation chapter —
 * see ChatService.sendMessage for routing between engines.
 */
export class TensorFlowChatService {
  private timeoutMs = 10000;

  async getChatReply(
    history: LlmConversationMessage[],
    contextSummary: string
  ): Promise<string | null> {
    if (history.length === 0) return null;

    try {
      const response = await axios.post(
        `${Env.ML_SERVICE_URL}/chat`,
        { history, contextSummary },
        { timeout: this.timeoutMs }
      );
      return response.data?.reply ?? null;
    } catch (err: any) {
      console.error(
        '[TensorFlowChatService] Chat call failed:',
        err.response?.status,
        err.response?.data?.error ?? err.message
      );
      return null;
    }
  }
}