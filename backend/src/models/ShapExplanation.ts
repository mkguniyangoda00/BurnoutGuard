export type ShapDirection = 'IncreasesRisk' | 'DecreasesRisk';

export interface ShapExplanation {
  shapId: string;
  predictionId: string;
  featureName: string;
  shapValue: number;
  featureValue: number;
  importanceRank: number;
  direction: ShapDirection;
  plainLanguageText: string | null;
  createdBy: string;
  createdDateTime: Date;
  modifiedBy: string;
  modifiedDate: Date;
}
