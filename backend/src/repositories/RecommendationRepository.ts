import prisma from '../config/db';
import { Recommendation } from '../models/Recommendation';

export class RecommendationRepository {
  async createMany(
    recommendations: {
      predictionId: string;
      userId: string;
      category: string;
      title: string;
      description: string;
      priority: number;
      createdBy: string;
      modifiedBy: string;
    }[]
  ): Promise<void> {
    await prisma.recommendation.createMany({ data: recommendations as any[] });
  }

  async findActiveByUser(userId: string): Promise<Recommendation[]> {
    return prisma.recommendation.findMany({
      where: { userId, isDismissed: false, isCompleted: false },
      orderBy: { priority: 'asc' },
    }) as unknown as Recommendation[];
  }

  async findAllByUser(userId: string): Promise<Recommendation[]> {
    return prisma.recommendation.findMany({
      where: { userId },
      orderBy: { priority: 'asc' },
    }) as unknown as Recommendation[];
  }

  async markComplete(recId: string, userId: string): Promise<Recommendation> {
    return prisma.recommendation.update({
      where: { recId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        modifiedBy: userId,
      },
    }) as unknown as Recommendation;
  }

  async dismiss(recId: string, userId: string): Promise<Recommendation> {
    return prisma.recommendation.update({
      where: { recId },
      data: {
        isDismissed: true,
        dismissedAt: new Date(),
        modifiedBy: userId,
      },
    }) as unknown as Recommendation;
  }

  async findDismissedTitles(userId: string): Promise<string[]> {
    const dismissed = await prisma.recommendation.findMany({
      where: { userId, isDismissed: true },
      select: { title: true },
    });
    return dismissed.map((r: { title: string }) => r.title);
  }

  async findByPredictionId(predictionId: string, userId: string): Promise<Recommendation[]> {
    return prisma.recommendation.findMany({
      where: { predictionId, userId },
      orderBy: { priority: 'asc' },
    }) as unknown as Recommendation[];
  }
}
