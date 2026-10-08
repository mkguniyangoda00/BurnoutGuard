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
  managerSupportLevel: 'Cynicism',      // lack of manager support drives disengagement
  peerSupportLevel: 'Cynicism',

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
  autonomyLevel: 'ReducedEfficacy',     // low autonomy undermines sense of effectiveness
  roleAmbiguity: 'ReducedEfficacy',
  taskComplexity: 'ReducedEfficacy',
  interruptionsPerDay: 'Exhaustion',    // constant interruption = depletion
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
  // Tracked separately from `sums` so that opposing-sign SHAP values within
  // the same dimension (e.g. good sleep offsetting high stress, both inside
  // Exhaustion) don't cancel each other out when measuring how much that
  // dimension actually drove the prediction — only the net sign (for color)
  // should come from the signed sum; the magnitude share must come from
  // each feature's individual |SHAP|, or a dimension with more mapped
  // features (Exhaustion has 20 vs Cynicism's 9) would dominate by feature
  // count alone regardless of real contribution.
  const absSums: Record<BurnoutDimension, number> = {
    Exhaustion: 0,
    Cynicism: 0,
    ReducedEfficacy: 0,
  };

  for (const row of shapRows) {
    const dim = FEATURE_TO_DIMENSION[row.featureName];
    if (dim) {
      sums[dim] += row.shapValue;
      absSums[dim] += Math.abs(row.shapValue);
    }
  }

  const totalAbs = Object.values(absSums).reduce((a, b) => a + b, 0) || 1;

  return (Object.keys(sums) as BurnoutDimension[]).map((dimension) => ({
    dimension,
    label: BURNOUT_DIMENSION_LABELS[dimension],
    score: parseFloat(sums[dimension].toFixed(4)),
    normalizedPct: parseFloat(((absSums[dimension] / totalAbs) * 100).toFixed(1)),
  }));
}