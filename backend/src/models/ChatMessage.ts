export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  chatId: string;
  userId: string;
  role: ChatRole;
  content: string;
  relatedPredictionId: string | null;
  createdBy: string;
  createdDateTime: Date;
  modifiedBy: string;
  modifiedDate: Date;
}
