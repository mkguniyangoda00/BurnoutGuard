import { FEATURE_COLUMNS } from './FeatureAggregator';

export type BurnoutDimension = 'Exhaustion' | 'Cynicism' | 'ReducedEfficacy';

export const BURNOUT_DIMENSION_LABELS: Record<BurnoutDimension, string> = {
  Exhaustion: 'Exhaustion',
  Cynicism: 'Cynicism / Mental Distance',
  ReducedEfficacy: 'Reduced Professional Efficacy',
};

/**
 * Maps each of FeatureAggregator.FEATURE_COLUMNS (37 features) to one of the
 * three WHO/ICD-11 burnout dimensions. Judgment calls are documented inline.
 */
export const FEATURE_TO_DIMENSION: Record<string, BurnoutDimension> = {
  // Exhaustion — physical/emotional depletion, poor recovery
  sleepHours: 'Exhaustion',
  sleepQuality: 'Exhaustion',
  screenTimeHours: 'Exhaustion',
  workHours: 'Exhaustion',
  overtimeHours: 'Exhaustion',
  breaksTaken: 'Exhaustion',
  commuteMinutes: 'Exhaustion',
  stressLevel: 'Exhaustion',
  energyLevel: 'Exhaustion',
  caffeineIntake: 'Exhaustion',
  mealQuality: 'Exhaustion',
  emotionalFatigue: 'Exhaustion',
  anxietyLevel: 'Exhaustion',
  irritabilityLevel: 'Exhaustion',
  isOnCallToday: 'Exhaustion',
  isWeekendWork: 'Exhaustion',
  afterHoursMessaging: 'Exhaustion',
  powerInternetDisruption: 'Exhaustion',
  familyResponsibilityLoad: 'Exhaustion',

  // Cynicism / Mental Distance — detachment, disengagement, isolation
  moodScore: 'Cynicism',
  socialSupportLevel: 'Cynicism',
  workSatisfaction: 'Cynicism',
  lonelinessLevel: 'Cynicism',
  salaryWorkloadSatisfaction: 'Cynicism',
  wfhEnvironmentQuality: 'Cynicism',
  workModeEncoded: 'Cynicism',

  // Reduced Professional Efficacy — confidence, capability, output quality
  exerciseLevel: 'ReducedEfficacy',
  workloadRating: 'ReducedEfficacy',
  motivationLevel: 'ReducedEfficacy',
  concentrationIssues: 'ReducedEfficacy',
  selfEfficacy: 'ReducedEfficacy',
  copingAbility: 'ReducedEfficacy',
  meetingsCount: 'ReducedEfficacy',
  urgentTasksCount: 'ReducedEfficacy',
  sprintPressureRating: 'ReducedEfficacy',
  deadlineFrequency: 'ReducedEfficacy',
  bugFixingLoad: 'ReducedEfficacy',
  contextSwitchingFrequency: 'ReducedEfficacy',
};

// Fail loudly in dev if FeatureAggregator's column list drifts from this map.
const missing = FEATURE_COLUMNS.filter((c) => !FEATURE_TO_DIMENSION[c]);
if (missing.length > 0) {
  console.warn(`[BurnoutDimensions] Unmapped feature columns: ${missing.join(', ')}`);
}

export interface DimensionScore {
  dimension: BurnoutDimension;
  label: string;
  score: number; // sum of SHAP values in this dimension (raw, signed)
  normalizedPct: number; // 0-100, share of total |SHAP| across all 3 dimensions
}

export function computeDimensionBreakdown(
  shapRows: { featureName: string; shapValue: number }[]
): DimensionScore[] {
  const sums: Record<BurnoutDimension, number> = {
    Exhaustion: 0,
    Cynicism: 0,
    ReducedEfficacy: 0,
  };

  for (const row of shapRows) {
    const dim = FEATURE_TO_DIMENSION[row.featureName];
    if (dim) sums[dim] += row.shapValue;
  }

  const totalAbs = Object.values(sums).reduce((a, b) => a + Math.abs(b), 0) || 1;

  return (Object.keys(sums) as BurnoutDimension[]).map((dimension) => ({
    dimension,
    label: BURNOUT_DIMENSION_LABELS[dimension],
    score: parseFloat(sums[dimension].toFixed(4)),
    normalizedPct: parseFloat(((Math.abs(sums[dimension]) / totalAbs) * 100).toFixed(1)),
  }));
}