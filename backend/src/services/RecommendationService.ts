import { RecommendationRepository } from '../repositories/RecommendationRepository';
import { ShapExplanation } from '../models/ShapExplanation';
import { Recommendation } from '../models/Recommendation';

interface RecommendationTemplate {
  title: string;
  description: string;
  category: string;
  priority: number;
}

const FEATURE_MAP: Record<string, RecommendationTemplate> = {
  sleepQuality: {
    title: 'Improve your sleep routine',
    description:
      'Your sleep quality is the number one driver of your burnout risk. Set a consistent 10:30 PM sleep time and avoid screens 45 minutes before bed.',
    category: 'Sleep',
    priority: 1,
  },
  sleepHours: {
    title: 'Improve your sleep routine',
    description:
      'Your sleep quality is the number one driver of your burnout risk. Set a consistent 10:30 PM sleep time and avoid screens 45 minutes before bed.',
    category: 'Sleep',
    priority: 1,
  },
  workHours: {
    title: 'Cap your workday at 8.5 hours',
    description:
      'High daily working hours is a major burnout driver. Set a calendar hard-stop at 6:30 PM and discuss sprint scope with your manager if pressure is the cause.',
    category: 'WorkBoundary',
    priority: 1,
  },
  exerciseDone: {
    title: 'Add 20-minute walks on work days',
    description:
      'Low physical activity increases burnout risk. A short walk during lunch lowers stress hormones. Start with 3 days this week, no gym required.',
    category: 'Exercise',
    priority: 2,
  },
  stressLevel: {
    title: 'Schedule daily micro-breaks',
    description:
      'Sustained high stress without recovery amplifies burnout risk. Try 5-minute breaks every 90 minutes of focused work.',
    category: 'Social',
    priority: 2,
  },
  screenTimeHours: {
    title: 'Reduce screen time after 9 PM',
    description:
      'High screen time disrupts sleep quality and melatonin production. Enable Night Shift mode and aim for a 10 PM screen cutoff.',
    category: 'ScreenTime',
    priority: 3,
  },
  workloadRating: {
    title: 'Request workload rebalancing',
    description:
      'Your workload and mood scores indicate unsustainable pressure. Consider discussing task distribution with your team lead.',
    category: 'Social',
    priority: 2,
  },
  moodScore: {
    title: 'Request workload rebalancing',
    description:
      'Your workload and mood scores indicate unsustainable pressure. Consider discussing task distribution with your team lead.',
    category: 'Social',
    priority: 2,
  },
};

export class RecommendationService {
  constructor(private recRepo: RecommendationRepository) {}

  async generateFromPrediction(
    userId: string,
    predictionId: string,
    shapRows: ShapExplanation[]
  ): Promise<Recommendation[]> {
    const riskDrivers = shapRows
      .filter((s) => s.direction === 'IncreasesRisk')
      .sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))
      .slice(0, 3);

    const dismissedTitles = await this.recRepo.findDismissedTitles(userId);

    const toCreate = riskDrivers
      .map((s) => FEATURE_MAP[s.featureName])
      .filter((t): t is RecommendationTemplate => !!t)
      .filter((t) => !dismissedTitles.includes(t.title))
      // Deduplicate by title
      .filter((t, i, arr) => arr.findIndex((x) => x.title === t.title) === i)
      .map((t) => ({
        predictionId,
        userId,
        category: t.category,
        title: t.title,
        description: t.description,
        priority: t.priority,
        createdBy: userId,
        modifiedBy: userId,
      }));

    if (toCreate.length > 0) {
      await this.recRepo.createMany(toCreate);
    }

    return this.recRepo.findActiveByUser(userId);
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
