export type SurveyQuestionType = 'Scale' | 'Boolean' | 'Text';

export interface SurveyQuestion {
  questionId: string;
  questionText: string;
  category: string;
  type: SurveyQuestionType;
  scaleMax: number | null;
  displayOrder: number;
  isActive: boolean;
  createdBy: string;
  createdDateTime: Date;
  modifiedBy: string;
  modifiedDate: Date;
}