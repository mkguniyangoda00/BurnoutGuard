import { PredictionRepository } from '../repositories/PredictionRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { MlService } from './MlService';
import { RecommendationService } from './RecommendationService';
import { Prediction } from '../models/Prediction';
import { ShapExplanation } from '../models/ShapExplanation';
import { AlertService } from './AlertService';
import { aggregateCheckIns } from '../utils/FeatureAggregator';
import prisma from '../config/db';

export class PredictionService {
  constructor(
    private predictionRepo: PredictionRepository,
    private mlService: MlService,
    private recommendationService: RecommendationService,
    private alertService: AlertService,
    private checkInRepo: CheckInRepository
  ) {}

  async createPrediction(userId: string) {
    const checkIns = await this.checkInRepo.findLastSeven(userId);
    const features = aggregateCheckIns(checkIns);

    const mlResult = await this.mlService.getPrediction(userId, features);

    const previous = await this.predictionRepo.findLatestByUser(userId);
    const previousRiskScore = previous ? previous.riskScore : undefined;
    const scoreChange = previousRiskScore !== undefined
      ? mlResult.riskScore - previousRiskScore
      : undefined;

    let trendDirection = 'Stable';
    if (scoreChange !== undefined) {
      if (scoreChange < -0.05) trendDirection = 'Improving';
      else if (scoreChange > 0.05) trendDirection = 'Worsening';
    }

    await this.predictionRepo.markPreviousAsNotLatest(userId);

    const shapRows = mlResult.shapValues.map((s) => ({
      ...s,
      plainLanguageText:
        s.plainLanguageText ??
        (s.direction === 'IncreasesRisk'
          ? `${s.featureName} is increasing your risk by ${s.shapValue.toFixed(2)} points`
          : `${s.featureName} is helping reduce your risk by ${Math.abs(s.shapValue).toFixed(2)} points`),
    }));

    const checkInsUsed = await prisma.dailyCheckIn.count({
      where: { userId },
    });

    const saved = await this.predictionRepo.createWithShap(
      {
        userId,
        riskScore: mlResult.riskScore,
        riskLevel: mlResult.riskLevel,
        modelVersion: mlResult.modelVersion,
        checkInsUsed: checkInsUsed || 1,
        predictionDate: new Date(),
        isLatest: true,
        trendDirection,
        previousRiskScore,
        scoreChange,
        createdBy: userId,
        modifiedBy: userId,
      } as any,
      shapRows
    );

    await this.recommendationService.generateFromPrediction(
      userId,
      saved.predictionId,
      saved.shapExplanations as unknown as ShapExplanation[]
    );

    await this.alertService.createIfHighRisk(
      userId,
      saved.predictionId,
      saved.riskLevel as any
    );

    return saved;
  }

  async getLatest(userId: string) {
    return this.predictionRepo.findLatestByUser(userId);
  }

  async getHistory(userId: string): Promise<Prediction[]> {
    return this.predictionRepo.findAllByUser(userId);
  }

  async getById(predictionId: string, userId: string) {
    const prediction = await this.predictionRepo.findById(predictionId);
    if (!prediction) {
      const err: any = new Error('Prediction not found');
      err.statusCode = 404;
      throw err;
    }
    if ((prediction as any).userId !== userId) {
      const err: any = new Error('Forbidden');
      err.statusCode = 403;
      throw err;
    }
    return prediction;
  }

  async runWhatIf(userId: string, modifications: Record<string, number>) {
    const checkIns = await this.checkInRepo.findLastSeven(userId);
    const baseline = aggregateCheckIns(checkIns);
    return this.mlService.getWhatIf(userId, baseline, modifications);
  }
}