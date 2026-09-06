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
import { computeDimensionBreakdown, DimensionScore } from '../utils/BurnoutDimensions';
import { getAlertThresholdValue, ALERT_THRESHOLD_DEFAULTS } from '../utils/AlertThresholds';

const auditLogService = new AuditLogService(new AuditLogRepository());

export class PredictionService {
  private static readonly PREDICTION_WINDOW_DAYS = 14;
  
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

  private deferPostPredictionWork(
    userId: string,
    saved: Prediction & { shapExplanations: ShapExplanation[] },
    actor: Awaited<ReturnType<PredictionService['getActor']>>
  ): void {
    setImmediate(() => {
      void this.runPostPredictionWork(userId, saved, actor).catch((err) => {
        console.error(
          `[PredictionService] Post-prediction work failed for prediction ${saved.predictionId}:`,
          err
        );
      });
    });
  }

  private async runPostPredictionWork(
    userId: string,
    saved: Prediction & { shapExplanations: ShapExplanation[] },
    actor: Awaited<ReturnType<PredictionService['getActor']>>
  ): Promise<void> {
    const sideEffects = [
      this.recommendationService.generateFromPrediction(
        userId,
        saved.predictionId,
        saved.shapExplanations as unknown as ShapExplanation[],
        saved.riskLevel
      ),
      this.alertService.evaluateAndNotify(userId, {
        predictionId: saved.predictionId,
        riskScore: saved.riskScore,
        riskLevel: saved.riskLevel as any,
        previousRiskScore: saved.previousRiskScore,
        scoreChange: saved.scoreChange,
      }),
      this.checkInRepo.findLastSeven(userId).then((recentCheckIns) =>
        this.alertService.checkPoorSleepPattern(userId, recentCheckIns)
      ),
      auditLogService.log({
        ...actor,
        action: 'PREDICTION_CREATE',
        entityType: 'Prediction',
        entityId: saved.predictionId,
        details: `Risk level ${saved.riskLevel}, score ${(saved.riskScore * 100).toFixed(0)}%`,
        result: 'Success',
      }),
    ];

    const results = await Promise.allSettled(sideEffects);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `[PredictionService] Post-prediction task ${index + 1} failed for prediction ${saved.predictionId}:`,
          result.reason
        );
      }
    });
  }

  /**
   * Searches for the smallest feasible change across mutable features that
   * moves the predicted risk level down at least one band, rather than
   * jumping straight to a fixed target value. Reports validity (did it
   * actually flip the risk band), proximity (normalized size of the
   * change), and sparsity (how many features were touched) — standard
   * counterfactual-recourse evaluation metrics.
   */
  async getCounterfactual(userId: string) {
    const latest = await this.predictionRepo.findLatestByUser(userId);
    if (!latest) return null;

    const checkIns = await this.checkInRepo.findByUserId(userId, PredictionService.PREDICTION_WINDOW_DAYS);
    const developerProfile = await prisma.developerProfile.findUnique({ where: { userId } });
    const { features } = aggregateCheckIns(checkIns, developerProfile?.workModel);
    // Mutable feature bounds — same "actionable" set as before, now with a
    // step size and valid range instead of a single fixed target, so the
    // search can find the smallest change rather than the largest.
    const MUTABLE_FEATURES: Record<string, { min: number; max: number; step: number; higherIsBetter: boolean; immutable?: boolean }> = {
      sleepHours: { min: 4, max: 9, step: 0.5, higherIsBetter: true },
      sleepQuality: { min: 1, max: 5, step: 1, higherIsBetter: true },
      overtimeHours: { min: 0, max: 8, step: 1, higherIsBetter: false },
      workHours: { min: 6, max: 12, step: 0.5, higherIsBetter: false },
      stressLevel: { min: 1, max: 10, step: 1, higherIsBetter: false },
      breaksTaken: { min: 0, max: 8, step: 1, higherIsBetter: true },
      meetingsCount: { min: 0, max: 10, step: 1, higherIsBetter: false },
      contextSwitchingFrequency: { min: 1, max: 5, step: 1, higherIsBetter: false },
      workModeEncoded: { min: 1, max: 3, step: 1, higherIsBetter: false, immutable: true },
    };

    const RISK_ORDER = ['Low', 'Moderate', 'High', 'Critical'];
    const currentRiskIndex = RISK_ORDER.indexOf(latest.riskLevel);

    const topDrivers = (latest.shapExplanations ?? [])
      .filter((s: any) => s.direction === 'IncreasesRisk' && MUTABLE_FEATURES[s.featureName] && !MUTABLE_FEATURES[s.featureName].immutable)
      .sort((a: any, b: any) => b.shapValue - a.shapValue)
      .slice(0, 3); // consider up to 3 candidate features for the search

    if (topDrivers.length === 0) return null;

    // Try single-feature changes first (sparsest), then pairs, stopping at
    // the first combination that flips the risk band — this naturally
    // prefers smaller, simpler recourse over larger ones (sparsity-first
    // search order).
    const candidateSets: string[][] = [
      ...topDrivers.map((d: any) => [d.featureName]),
      ...(topDrivers.length >= 2 ? [[topDrivers[0].featureName, topDrivers[1].featureName]] : []),
    ];

    let best: {
      modifications: Record<string, number>;
      simulated: { riskScore: number; riskLevel: string };
      proximity: number;
      sparsity: number;
    } | null = null;

    for (const featureSet of candidateSets) {
      const bounds = featureSet.map((f) => MUTABLE_FEATURES[f]);
      const currentValues = featureSet.map((f) => features[f] ?? 0);

      // Walk each feature toward its "better" direction in step increments,
      // testing after each step, up to a small number of steps (keeps the
      // search cheap and favors small changes — proximity-preferring).
      const MAX_STEPS = 6;
      for (let step = 1; step <= MAX_STEPS; step++) {
        const modifications: Record<string, number> = {};
        featureSet.forEach((f, i) => {
          const bound = bounds[i];
          const direction = bound.higherIsBetter ? 1 : -1;
          const candidate = currentValues[i] + direction * bound.step * step;
          modifications[f] = Math.max(bound.min, Math.min(bound.max, candidate));
        });

        const simulated = await this.mlService.getWhatIf(userId, features, modifications);
        const simulatedIndex = RISK_ORDER.indexOf(simulated.riskLevel);
        const validity = simulatedIndex < currentRiskIndex;

        if (validity) {
          const proximity = featureSet.reduce((sum, f, i) => {
            const bound = bounds[i];
            const range = bound.max - bound.min || 1;
            return sum + Math.abs(modifications[f] - currentValues[i]) / range;
          }, 0) / featureSet.length;

          const candidate = {
            modifications,
            simulated,
            proximity,
            sparsity: featureSet.length,
          };

          // Prefer sparser, and among equal sparsity, closer (lower proximity).
          if (
            !best ||
            candidate.sparsity < best.sparsity ||
            (candidate.sparsity === best.sparsity && candidate.proximity < best.proximity)
          ) {
            best = candidate;
          }
          break; // found the smallest valid change for this feature set — stop stepping further
        }
      }
      if (best && best.sparsity === 1) break; // a single-feature valid recourse is already optimal enough to stop
    }

    if (!best) {
      // No feasible recourse found within the search bounds — report this
      // explicitly rather than falling back to a misleadingly "large" jump.
      return {
        currentRiskLevel: latest.riskLevel,
        currentRiskScore: latest.riskScore,
        simulatedRiskLevel: latest.riskLevel,
        simulatedRiskScore: latest.riskScore,
        changedFactors: [],
        validity: false,
        proximity: null,
        sparsity: 0,
        feasibility: 'No feasible recourse found within constraints',
      };
    }

    const changedFactors = Object.entries(best.modifications).map(([featureName, to]) => ({
      featureName,
      from: features[featureName],
      to,
    }));

    return {
      currentRiskLevel: latest.riskLevel,
      currentRiskScore: latest.riskScore,
      simulatedRiskLevel: best.simulated.riskLevel,
      simulatedRiskScore: best.simulated.riskScore,
      changedFactors,
      validity: true,
      proximity: parseFloat(best.proximity.toFixed(3)),
      sparsity: best.sparsity,
      feasibility: 'Feasible',
    };
  }

  async createPrediction(userId: string) {
    console.log(`[PredictionService] Starting prediction generation for user ${userId}.`);
    const [checkIns, developerProfile] = await Promise.all([
      this.checkInRepo.findByUserId(userId, PredictionService.PREDICTION_WINDOW_DAYS),
      prisma.developerProfile.findUnique({
        where: { userId },
      }),
    ]);
    console.log(`[PredictionService] Loaded ${checkIns.length} recent check-in(s) for user ${userId}.`);
    const { features, dataCompletenessScore } = aggregateCheckIns(checkIns, developerProfile?.workModel);
    console.log(`[PredictionService] Aggregated feature vector for user ${userId}:`, features);

    console.log(`[PredictionService] Calling ML service for user ${userId}.`);
    const mlResult = await this.mlService.getPrediction(userId, features);
    console.log(`[PredictionService] ML response for user ${userId}:`, mlResult);

    const previous = await this.predictionRepo.findLatestByUser(userId);
    const previousRiskScore = previous ? previous.riskScore : undefined;
    const scoreChange = previousRiskScore !== undefined
      ? mlResult.riskScore - previousRiskScore
      : undefined;

    const worseningThreshold = await getAlertThresholdValue(
      'worseningTrendThreshold',
      ALERT_THRESHOLD_DEFAULTS.worseningTrendThreshold.value
    );

    let trendDirection = 'Stable';
    if (scoreChange !== undefined) {
      if (scoreChange < -worseningThreshold) trendDirection = 'Improving';
      else if (scoreChange > worseningThreshold) trendDirection = 'Worsening';
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

    const checkInsUsed = checkIns.length;
    
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
          dataCompletenessScore, // NEW
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

    const actor = await this.getActor(userId);
    this.deferPostPredictionWork(userId, saved, actor);

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
     const checkIns = await this.checkInRepo.findByUserId(userId, PredictionService.PREDICTION_WINDOW_DAYS);
  
    // const baseline = aggregateCheckIns(checkIns);
    const developerProfile = await prisma.developerProfile.findUnique({
      where: { userId },
    });
    const { features } = aggregateCheckIns(checkIns, developerProfile?.workModel);
    const result = await this.mlService.getWhatIf(userId, features, modifications);

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

  async getDimensionBreakdown(predictionId: string, userId: string): Promise<DimensionScore[]> {
    const prediction = await this.getById(predictionId, userId); // reuses existing ownership check
    const shapRows = (prediction as any).shapExplanations ?? [];
    return computeDimensionBreakdown(
      shapRows.map((s: any) => ({ featureName: s.featureName, shapValue: s.shapValue }))
    );
  }
}
