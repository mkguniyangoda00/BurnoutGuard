import { TrendDirection } from './Prediction';

export interface WellnessReport {
  reportId: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  avgStress: number;
  avgSleep: number;
  avgMood: number;
  avgWorkHours: number;
  totalCheckIns: number;
  exerciseDays: number;
  overallTrend: TrendDirection;
  riskScoreAtEndOfWeek: number | null;
  insightSummary: string | null;
  createdBy: string;
  createdDateTime: Date;
  modifiedBy: string;
  modifiedDate: Date;
}
