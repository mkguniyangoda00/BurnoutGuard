import prisma from '../config/db';
import { ChatMessage } from '../models/ChatMessage';

export class ChatRepository {
  async create(data: {
    userId: string;
    role: string;
    content: string;
    relatedPredictionId?: string | null;
    createdBy: string;
    modifiedBy: string;
  }): Promise<ChatMessage> {
    return prisma.chatMessage.create({
      data: {
        ...data,
        relatedPredictionId: data.relatedPredictionId ?? null,
      },
    }) as unknown as ChatMessage;
  }

  async findByUserId(userId: string): Promise<ChatMessage[]> {
    return prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdDateTime: 'asc' },
    }) as unknown as ChatMessage[];
  }
}
