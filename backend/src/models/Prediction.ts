export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type TrendDirection = 'Improving' | 'Stable' | 'Worsening';

export interface Prediction {
  predictionId: string;
  userId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  modelVersion: string;
  checkInsUsed: number;
  predictionDate: Date;
  isLatest: boolean;
  trendDirection: TrendDirection;
  previousRiskScore: number | null;
  scoreChange: number | null;
  createdBy: string;
  createdDateTime: Date;
  modifiedBy: string;
  modifiedDate: Date;
}
