import client from './client';

export interface ChatMessage {
  chatId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  relatedPredictionId: string | null;
  createdBy: string;
  createdDateTime: string;
  modifiedBy: string;
  modifiedDate: string;
}

export interface ChatSendResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  messages: ChatMessage[];
}

export const chatService = {
  getHistory: async () => {
    const res = await client.get('/chat');
    return res.data.messages as ChatMessage[];
  },

  sendMessage: async (message: string) => {
    const res = await client.post('/chat', { message });
    return res.data as ChatSendResponse;
  },
};
