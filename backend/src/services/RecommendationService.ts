import { RecommendationRepository } from '../repositories/RecommendationRepository';
import { Recommendation } from '../models/Recommendation';
import { ShapExplanation } from '../models/ShapExplanation';

export class RecommendationService {
  constructor(private recRepo: RecommendationRepository) { }

  async generateFromPrediction(
    userId: string,
    predictionId: string,
    shapRows: ShapExplanation[]
  ): Promise<void> {
    // Get top risk-increasing features sorted by impact
    const riskIncreasing = shapRows
      .filter((s) => s.direction === 'IncreasesRisk')
      .sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))
      .slice(0, 3);

    const dismissedTitles = await this.recRepo.findDismissedTitles(userId);

    const recommendationMap: Record<
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
        title: 'Schedule daily micro-breaks',
        description:
          'Your stress level is elevated. Try taking a 5-minute break every 90 minutes of focused work. Sustained high stress without recovery periods makes burnout significantly more likely.',
        category: 'Social',
        priority: 2,
      },

      workloadRating: {
        title: 'Request a workload review with your manager',
        description:
          'Your workload rating suggests unsustainable pressure. A 20-minute conversation with your team lead about task distribution could meaningfully reduce your risk score.',
        category: 'Social',
        priority: 2,
      },

      screenTimeHours: {
        title: 'Reduce screen time after 9 PM',
        description:
          'High screen time disrupts your sleep quality and melatonin production. Enable Night Shift mode and aim for a 10 PM screen cutoff as a starting point.',
        category: 'ScreenTime',
        priority: 3,
      },

      exerciseDone: {
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
      const rec = recommendationMap[shap.featureName];
      if (!rec) continue;
      if (dismissedTitles.includes(rec.title)) continue;

      // Avoid duplicate titles in the same batch
      if (toCreate.find((r) => r.title === rec.title)) continue;

      toCreate.push({
        predictionId,
        userId,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        createdBy: userId,
        modifiedBy: userId,
      });
    }

    if (toCreate.length > 0) {
      await this.recRepo.createMany(toCreate);
    }
  }

  async getActive(userId: string): Promise<Recommendation[]> {
    return this.recRepo.findActiveByUser(userId);
  }

  async getAll(userId: string): Promise<Recommendation[]> {
    return this.recRepo.findAllByUser(userId);
  }

  async complete(recId: string, userId: string): Promise<Recommendation> {
    return this.recRepo.markComplete(recId, userId);
  }

  async dismiss(recId: string, userId: string): Promise<Recommendation> {
    return this.recRepo.dismiss(recId, userId);
  }
}