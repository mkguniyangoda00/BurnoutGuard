import { CheckIn } from '../models/CheckIn';

// MUST stay in sync with ml-service/preprocess.py's FEATURE_COLUMNS
export const FEATURE_COLUMNS = [
  'sleepHours', 'sleepQuality', 'exerciseLevel', 'screenTimeHours',
  'workHours', 'workloadRating', 'overtimeHours', 'breaksTaken',
  'commuteMinutes', 'stressLevel', 'moodScore', 'energyLevel',
  'workSatisfaction', 'caffeineIntake', 'mealQuality', 'socialSupportLevel',
  'anxietyLevel', 'emotionalFatigue', 'motivationLevel',
  'concentrationIssues', 'irritabilityLevel', 'lonelinessLevel',
  'selfEfficacy', 'copingAbility', 'powerInternetDisruption',
  'wfhEnvironmentQuality', 'familyResponsibilityLoad',
  'salaryWorkloadSatisfaction', 'afterHoursMessaging',
  // Work Pattern Monitoring (new)
  'meetingsCount', 'urgentTasksCount', 'sprintPressureRating',
  'deadlineFrequency', 'isWeekendWork', 'bugFixingLoad',
  'contextSwitchingFrequency', 'isOnCallToday', 'workModeEncoded',
] as const;

// Boolean-typed fields need 0/1 conversion instead of straight averaging.
const BOOLEAN_FIELDS = new Set(['afterHoursMessaging', 'isWeekendWork', 'isOnCallToday']);

const NEUTRAL_DEFAULTS: Record<string, number> = {
  sleepHours: 7, sleepQuality: 3, exerciseLevel: 3, screenTimeHours: 5,
  workHours: 8, workloadRating: 3, overtimeHours: 0, breaksTaken: 3,
  commuteMinutes: 30, stressLevel: 5, moodScore: 5, energyLevel: 3,
  workSatisfaction: 3, caffeineIntake: 2, mealQuality: 3, socialSupportLevel: 3,
  anxietyLevel: 4, emotionalFatigue: 4, motivationLevel: 3,
  concentrationIssues: 2, irritabilityLevel: 2, lonelinessLevel: 2,
  selfEfficacy: 3, copingAbility: 3, powerInternetDisruption: 2,
  wfhEnvironmentQuality: 3, familyResponsibilityLoad: 2,
  salaryWorkloadSatisfaction: 3, afterHoursMessaging: 0,
  // Work Pattern Monitoring (new)
  meetingsCount: 3, urgentTasksCount: 2, sprintPressureRating: 3,
  deadlineFrequency: 3, isWeekendWork: 0, bugFixingLoad: 3,
  contextSwitchingFrequency: 3, isOnCallToday: 0,
  workModeEncoded: 2, // 2 = Hybrid (neutral default)
};

/**
 * Encodes DeveloperProfile.workModel (Remote/Hybrid/Onsite) into a numeric
 * value the ML model can consume. Ordered by typical isolation/autonomy
 * trade-off: Remote=1, Hybrid=2 (neutral), Onsite=3.
 */
export function encodeWorkModel(workModel: string | null | undefined): number {
  switch (workModel) {
    case 'Remote':
      return 1;
    case 'Hybrid':
      return 2;
    case 'Onsite':
      return 3;
    default:
      return NEUTRAL_DEFAULTS.workModeEncoded;
  }
}

/**
 * Averages a user's recent check-ins into a single feature vector for the
 * ML service. Falls back to neutral defaults if no check-ins exist yet.
 * workModel comes from the user's DeveloperProfile (not stored per
 * check-in, since it rarely changes day-to-day) and is merged in separately.
 */
export interface AggregatedFeatures {
  features: Record<string, number>;
  dataCompletenessScore: number; // 0-100, % of fields backed by real check-in data
}

export function aggregateCheckIns(
  checkIns: CheckIn[],
  workModel?: string | null
): AggregatedFeatures {
  const workModeEncoded = encodeWorkModel(workModel);

  if (!checkIns || checkIns.length === 0) {
    // workModeEncoded still counts as "real" only if workModel was provided
    const completeness = workModel ? (1 / FEATURE_COLUMNS.length) * 100 : 0;
    return {
      features: { ...NEUTRAL_DEFAULTS, workModeEncoded },
      dataCompletenessScore: parseFloat(completeness.toFixed(1)),
    };
  }

  const sums: Record<string, number> = {};
  const presentCounts: Record<string, number> = {};
  for (const col of FEATURE_COLUMNS) {
    if (col === 'workModeEncoded') continue;
    sums[col] = 0;
    presentCounts[col] = 0;
  }

  for (const c of checkIns) {
    const record = c as unknown as Record<string, number | boolean | undefined>;
    for (const col of FEATURE_COLUMNS) {
      if (col === 'workModeEncoded') continue;
      const value = record[col];
      const isPresent = value !== undefined && value !== null;
      if (isPresent) presentCounts[col]++;
      if (BOOLEAN_FIELDS.has(col)) {
        sums[col] += value ? 1 : 0;
      } else {
        sums[col] += typeof value === 'number' ? value : NEUTRAL_DEFAULTS[col];
      }
    }
  }

  const averaged: Record<string, number> = { workModeEncoded };
  let presentFieldCount = workModel ? 1 : 0; // workModeEncoded counted if real
  for (const col of FEATURE_COLUMNS) {
    if (col === 'workModeEncoded') continue;
    averaged[col] = parseFloat((sums[col] / checkIns.length).toFixed(2));
    // A field counts as "real" for this user if at least one check-in had it present
    if (presentCounts[col] > 0) presentFieldCount++;
  }

  const dataCompletenessScore = parseFloat(
    ((presentFieldCount / FEATURE_COLUMNS.length) * 100).toFixed(1)
  );

  return { features: averaged, dataCompletenessScore };
}