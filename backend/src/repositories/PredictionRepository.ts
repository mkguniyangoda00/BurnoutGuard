import prisma from '../config/db';
import { Prediction } from '../models/Prediction';
import { ShapExplanation } from '../models/ShapExplanation';

export class PredictionRepository {
  async createWithShap(
    predictionData: {
      userId: string;
      riskScore: number;
      riskLevel: string;
      modelVersion: string;
      checkInsUsed: number;
      predictionDate: Date;
      trendDirection: string;
      previousRiskScore?: number;
      scoreChange?: number;
      dataCompletenessScore?: number;
      createdBy: string;
      modifiedBy: string;
    },
    shapRows: {
      featureName: string;
      shapValue: number;
      featureValue: number;
      importanceRank: number;
      direction: string;
      plainLanguageText?: string;
    }[]
  ): Promise<Prediction & { shapExplanations: ShapExplanation[] }> {
    return prisma.$transaction(async (tx: any) => {
      const prediction = await tx.burnoutPrediction.create({
        data: predictionData as any,
      });

      await tx.shapExplanation.createMany({
        data: shapRows.map((s) => ({
          ...s,
          predictionId: prediction.predictionId,
          createdBy: predictionData.createdBy,
          modifiedBy: predictionData.modifiedBy,
        })) as any[],
      });

      const full = await tx.burnoutPrediction.findUnique({
        where: { predictionId: prediction.predictionId },
        include: {
          shapExplanations: { orderBy: { importanceRank: 'asc' } },
        },
      });

      return full as unknown as Prediction & { shapExplanations: ShapExplanation[] };
    });
  }

  async findLatestByUser(
    userId: string
  ): Promise<(Prediction & { shapExplanations: ShapExplanation[] }) | null> {
    return prisma.burnoutPrediction.findFirst({
      where: { userId, isLatest: true },
      include: { shapExplanations: { orderBy: { importanceRank: 'asc' } } },
    }) as unknown as (Prediction & { shapExplanations: ShapExplanation[] }) | null;
  }

  async findAllByUser(userId: string): Promise<Prediction[]> {
    return prisma.burnoutPrediction.findMany({
      where: { userId },
      orderBy: { predictionDate: 'desc' },
    }) as unknown as Prediction[];
  }

  async findById(
    predictionId: string
  ): Promise<(Prediction & { shapExplanations: ShapExplanation[] }) | null> {
    return prisma.burnoutPrediction.findUnique({
      where: { predictionId },
      include: { shapExplanations: { orderBy: { importanceRank: 'asc' } } },
    }) as unknown as (Prediction & { shapExplanations: ShapExplanation[] }) | null;
  }

  async markPreviousAsNotLatest(userId: string): Promise<void> {
    // Scoped to isLatest: true so this only ever touches the single
    // currently-latest row. Without that filter this updated every
    // historical prediction for the user on every single new prediction —
    // a write whose cost (and lock scope) grew with that user's prediction
    // history instead of staying O(1), which compounded into serialized,
    // increasingly slow writes under concurrent load against the same user.
    await prisma.burnoutPrediction.updateMany({
      where: { userId, isLatest: true },
      data: { isLatest: false },
    });
  }
}
