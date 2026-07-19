import { PredictionRepository } from '../repositories/PredictionRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { MlService } from './MlService';
import { RecommendationService } from './RecommendationService';
import { Prediction } from '../models/Prediction';
import { ShapExplanation } from '../models/ShapExplanation';
import { AlertService } from './AlertService';
import { aggregateCheckIns } from '../utils/FeatureAggregator';
import prisma from '../config/db';
import { UserRepository } from '../repositories/UserRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogService } from './AuditLogService';

const auditLogService = new AuditLogService(new AuditLogRepository());

export class PredictionService {
  constructor(
    private predictionRepo: PredictionRepository,
    private mlService: MlService,
    private recommendationService: RecommendationService,
    private alertService: AlertService,
    private checkInRepo: CheckInRepository,
    private userRepo: UserRepository
  ) {}

  private async getActor(userId: string) {
    const actor = await this.userRepo.findById(userId);
    return {
      actorId: userId,
      actorEmail: actor?.email ?? 'unknown',
      actorRole: actor?.role ?? 'Unknown',
    };
  }

  async createPrediction(userId: string) {
    console.log(`[PredictionService] Starting prediction generation for user ${userId}.`);
    const checkIns = await this.checkInRepo.findByUserId(userId);
    console.log(`[PredictionService] Loaded ${checkIns.length} available check-in(s) for user ${userId}.`);
    const features = aggregateCheckIns(checkIns);
    console.log(`[PredictionService] Aggregated feature vector for user ${userId}:`, features);

    console.log(`[PredictionService] Calling ML service for user ${userId}.`);
    const mlResult = await this.mlService.getPrediction(userId, features);
    console.log(`[PredictionService] ML response for user ${userId}:`, mlResult);

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

    console.log(
      `[PredictionService] Saving prediction for user ${userId} with ${shapRows.length} SHAP row(s).`
    );

    let saved;
    try {
      saved = await this.predictionRepo.createWithShap(
        {
          userId,
          riskScore: mlResult.riskScore,
          riskLevel: mlResult.riskLevel,
          modelVersion: mlResult.modelVersion,
          checkInsUsed,
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
      console.log(
        `[PredictionService] Prediction saved for user ${userId} with predictionId ${saved.predictionId}.`
      );
    } catch (err) {
      console.error(`[PredictionService] Prediction save failed for user ${userId}:`, err);
      throw err;
    }

    console.log(`[PredictionService] Generating recommendations for prediction ${saved.predictionId}.`);
    await this.recommendationService.generateFromPrediction(
      userId,
      saved.predictionId,
      saved.shapExplanations as unknown as ShapExplanation[]
    );
    console.log(`[PredictionService] Recommendation generation finished for prediction ${saved.predictionId}.`);

    console.log(`[PredictionService] Checking whether alert is needed for prediction ${saved.predictionId}.`);
    await this.alertService.createIfHighRisk(
      userId,
      saved.predictionId,
      saved.riskLevel as any
    );
    console.log(`[PredictionService] Alert check finished for prediction ${saved.predictionId}.`);

    const actor = await this.getActor(userId);
    void auditLogService.log({
      ...actor,
      action: 'PREDICTION_CREATE',
      entityType: 'Prediction',
      entityId: saved.predictionId,
      details: `Risk level ${saved.riskLevel}, score ${(saved.riskScore * 100).toFixed(0)}%`,
      result: 'Success',
    }).catch((err) => {
      console.error('[AuditLog] Failed to queue prediction create log:', err.message);
    });

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
    const checkIns = await this.checkInRepo.findByUserId(userId);
    const baseline = aggregateCheckIns(checkIns);
    const result = await this.mlService.getWhatIf(userId, baseline, modifications);

    const actor = await this.getActor(userId);
    void auditLogService.log({
      ...actor,
      action: 'WHAT_IF',
      entityType: 'Prediction',
      details: 'Ran what-if simulation',
      result: 'Success',
    }).catch((err) => {
      console.error('[AuditLog] Failed to queue what-if log:', err.message);
    });

    return result;
  }
}