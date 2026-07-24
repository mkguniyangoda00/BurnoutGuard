import { RecommendationRepository } from '../repositories/RecommendationRepository';
import { Recommendation } from '../models/Recommendation';
import { ShapExplanation } from '../models/ShapExplanation';
import { UserRepository } from '../repositories/UserRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogService } from './AuditLogService';

const auditLogService = new AuditLogService(new AuditLogRepository());

export class RecommendationService {
  constructor(
    private recRepo: RecommendationRepository,
    private userRepo: UserRepository
  ) { }

  private async getActor(userId: string) {
    const actor = await this.userRepo.findById(userId);
    return {
      actorId: userId,
      actorEmail: actor?.email ?? 'unknown',
      actorRole: actor?.role ?? 'Unknown',
    };
  }

  /**
   * Maps SHAP feature names to intervention recommendations. Multiple
   * feature keys can share the same title (e.g. urgentTasksCount and
   * bugFixingLoad both map to "Rebalance your task load") — the
   * de-duplication step below ensures only one recommendation with that
   * title gets created per prediction, even if several of its underlying
   * risk factors are present.
   */
  private readonly recommendationMap: Record<
  string,
      {
        title: string;
        description: string;
        category: string;
        priority: number;
      }
    > = {
    sleepHours: {
      title: 'Improve your sleep routine',
      description:
        'Your sleep hours are the biggest driver of your burnout risk right now. Try setting a consistent 10:30 PM bedtime and avoid screens 45 minutes before sleep. Even gaining one extra hour significantly reduces your predicted risk score.',
      category: 'Sleep',
      priority: 1,
    },
    sleepQuality: {
      title: 'Improve your sleep routine',
      description:
        'Your sleep quality is the biggest driver of your burnout risk right now. Try setting a consistent 10:30 PM bedtime and avoid screens 45 minutes before sleep. Even gaining one extra hour significantly reduces your predicted risk score.',
      category: 'Sleep',
      priority: 1,
    },

    workHours: {
      title: 'Cap your workday at 8.5 hours',
      description:
        'Averaging high daily working hours is a significant burnout driver. Set a hard-stop calendar reminder at 6:30 PM and discuss sprint scope with your team lead if delivery pressure is the cause.',
      category: 'WorkBoundary',
      priority: 1,
    },

    stressLevel: {
      title: 'Practice daily stress-relief habits',
      description:
        'Your stress level is elevated. Try a short breathing exercise (4s in, 4s hold, 4s out) for 2 minutes during stressful moments, and build in short recovery windows between demanding tasks.',
      category: 'Social',
      priority: 2,
    },

    breaksTaken: {
      title: 'Take micro-breaks throughout the day',
      description:
        'You are taking very few breaks during work hours. Try a 5-minute break every 90 minutes of focused work — sustained work without recovery periods makes burnout significantly more likely.',
      category: 'WorkBoundary',
      priority: 2,
    },

    workloadRating: {
      title: 'Request manager support about your workload',
      description:
        'Your workload rating suggests unsustainable pressure. A 20-minute conversation with your team lead about task distribution or timelines could meaningfully reduce your risk score.',
      category: 'Social',
      priority: 2,
    },
    sprintPressureRating: {
      title: 'Request manager support about your workload',
      description:
        'Your workload rating suggests unsustainable pressure. A 20-minute conversation with your team lead about task distribution or timelines could meaningfully reduce your risk score.',
      category: 'Social',
      priority: 2,
    },

    meetingsCount: {
      title: 'Reduce meeting overload',
      description:
        'You are attending a high number of meetings, leaving little uninterrupted work time. Try consolidating status updates into fewer, shorter meetings, and declining meetings without a clear agenda.',
      category: 'WorkBoundary',
      priority: 2,
    },

    contextSwitchingFrequency: {
      title: 'Use focus blocks to reduce context switching',
      description:
        'Frequent context switching between tasks is taxing your mental bandwidth. Try blocking 90-minute focus windows on your calendar, muting non-urgent notifications during that time.',
      category: 'WorkBoundary',
      priority: 2,
    },

    urgentTasksCount: {
      title: 'Rebalance your task load',
      description:
        'A high volume of urgent, unplanned tasks is disrupting your ability to plan your day. Discuss with your manager whether some urgent work can be redistributed or deprioritized.',
      category: 'Workload',
      priority: 2,
    },
    bugFixingLoad: {
      title: 'Rebalance your task load',
      description:
        'A high volume of urgent, unplanned tasks is disrupting your ability to plan your day. Discuss with your manager whether some urgent work can be redistributed or deprioritized.',
      category: 'Workload',
      priority: 2,
    },

    overtimeHours: {
      title: 'Reduce late-night and on-call work',
      description:
        'Frequent overtime or on-call work is eating into your recovery time. Where possible, try to establish clearer boundaries around after-hours availability with your team.',
      category: 'WorkBoundary',
      priority: 1,
    },
    isOnCallToday: {
      title: 'Reduce late-night and on-call work',
      description:
        'Frequent overtime or on-call work is eating into your recovery time. Where possible, try to establish clearer boundaries around after-hours availability with your team.',
      category: 'WorkBoundary',
      priority: 1,
    },

    screenTimeHours: {
      title: 'Reduce screen time after 9 PM',
      description:
        'High screen time disrupts your sleep quality and melatonin production. Enable Night Shift mode and aim for a 10 PM screen cutoff as a starting point.',
      category: 'ScreenTime',
      priority: 3,
    },

    exerciseLevel: {
      title: 'Add a 20-minute walk on work days',
      description:
        'Low physical activity is amplifying your burnout risk. A short walk during lunch breaks reduces stress hormones significantly. Start with three days this week — no gym required.',
      category: 'Exercise',
      priority: 2,
    },

    moodScore: {
      title: 'Track and protect your mood',
      description:
        'Your mood score is lower than your baseline. Consider scheduling one enjoyable activity per day — even 15 minutes of something you enjoy creates a measurable buffer against burnout.',
      category: 'Social',
      priority: 3,
    },

    energyLevel: {
      title: 'Prioritise energy recovery',
      description:
        'Low energy levels are contributing to your burnout risk. Review your sleep schedule, hydration, and ensure you are taking proper lunch breaks away from your screen.',
      category: 'Sleep',
      priority: 2,
    },
  };

  /**
   * Generates recommendations from a prediction's SHAP explanations.
   * For High/Critical risk, generates a 7-day sequenced recovery plan
   * (priority 1-7 = day order). For Low/Moderate risk, generates a flat
   * list of up to 3 recommendations as before.
   */
  async generateFromPrediction(
    userId: string,
    predictionId: string,
    shapRows: ShapExplanation[],
    riskLevel: string
  ): Promise<void> {
    console.log(
      `[RecommendationService] Generating recommendations for prediction ${predictionId}, user ${userId}, riskLevel=${riskLevel}.`
    );

    const isRecoveryPlan = riskLevel === 'High' || riskLevel === 'Critical';
    const maxRecommendations = isRecoveryPlan ? 7 : 3;

    // Widen the SHAP pool so there's enough candidate features to fill a
    // full 7-day plan even if some don't have a mapped recommendation.
    const riskIncreasing = shapRows
      .filter((s) => s.direction === 'IncreasesRisk')
      .sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))
      .slice(0, 12);

    console.log(
      `[RecommendationService] Found ${riskIncreasing.length} risk-increasing SHAP feature(s) for prediction ${predictionId}.`
    );

    const dismissedTitles = await this.recRepo.findDismissedTitles(userId);

    const toCreate: {
      predictionId: string;
      userId: string;
      category: string;
      title: string;
      description: string;
      priority: number;
      createdBy: string;
      modifiedBy: string;
    }[] = [];

    for (const shap of riskIncreasing) {
      if (toCreate.length >= maxRecommendations) break;

      const rec = this.recommendationMap[shap.featureName];
      if (!rec) continue;
      if (dismissedTitles.includes(rec.title)) continue;
      if (toCreate.find((r) => r.title === rec.title)) continue;

      toCreate.push({
        predictionId,
        userId,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        // For a 7-day plan, priority becomes sequential day order (1-7).
        // For a flat list, keep the recommendation's own base priority.
        priority: isRecoveryPlan ? toCreate.length + 1 : rec.priority,
        createdBy: userId,
        modifiedBy: userId,
      });
    }

    if (toCreate.length > 0) {
      console.log(
        `[RecommendationService] Creating ${toCreate.length} recommendation(s) for prediction ${predictionId}` +
        (isRecoveryPlan ? ' as a 7-day recovery plan.' : '.')
      );
      await this.recRepo.createMany(toCreate);
    } else {
      console.log(
        `[RecommendationService] No recommendations generated for prediction ${predictionId}.`
      );
    }
  }

  async getActive(userId: string): Promise<Recommendation[]> {
    return this.recRepo.findActiveByUser(userId);
  }

  async getAll(userId: string): Promise<Recommendation[]> {
    return this.recRepo.findAllByUser(userId);
  }

  async getByPrediction(predictionId: string, userId: string): Promise<Recommendation[]> {
    return this.recRepo.findByPredictionId(predictionId, userId);
  }

  async complete(recId: string, userId: string): Promise<Recommendation> {
    const rec = await this.recRepo.markComplete(recId, userId);
    const actor = await this.getActor(userId);
    void auditLogService.log({
      ...actor,
      action: 'RECOMMENDATION_COMPLETE',
      entityType: 'Recommendation',
      entityId: recId,
      result: 'Success',
    }).catch((err) => {
      console.error('[AuditLog] Failed to queue recommendation complete log:', err.message);
    });
    return rec;
  }

  async dismiss(recId: string, userId: string): Promise<Recommendation> {
    const rec = await this.recRepo.dismiss(recId, userId);
    const actor = await this.getActor(userId);
    void auditLogService.log({
      ...actor,
      action: 'RECOMMENDATION_DISMISS',
      entityType: 'Recommendation',
      entityId: recId,
      result: 'Success',
    }).catch((err) => {
      console.error('[AuditLog] Failed to queue recommendation dismiss log:', err.message);
    });
    return rec;
  }
}