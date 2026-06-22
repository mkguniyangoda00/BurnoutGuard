export type RecommendationCategory =
  | 'Sleep'
  | 'Exercise'
  | 'WorkBoundary'
  | 'Social'
  | 'ScreenTime';

export interface Recommendation {
  recId: string;
  predictionId: string;
  userId: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  priority: number;
  isCompleted: boolean;
  completedAt: Date | null;
  isDismissed: boolean;
  dismissedAt: Date | null;
  effectivenessScore: number | null;
  createdBy: string;
  createdDateTime: Date;
  modifiedBy: string;
  modifiedDate: Date;
}
