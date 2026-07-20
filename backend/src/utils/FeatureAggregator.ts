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
] as const;

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
};

/**
 * Averages a user's recent check-ins into a single feature vector for the
 * ML service. Falls back to neutral defaults if no check-ins exist yet.
 */
export function aggregateCheckIns(checkIns: CheckIn[]): Record<string, number> {
  if (!checkIns || checkIns.length === 0) {
    return { ...NEUTRAL_DEFAULTS };
  }

  const sums: Record<string, number> = {};
  for (const col of FEATURE_COLUMNS) {
    sums[col] = 0;
  }

  for (const c of checkIns) {
    const record = c as unknown as Record<string, number | boolean>;
    for (const col of FEATURE_COLUMNS) {
      const value = record[col];
      if (col === 'afterHoursMessaging') {
        sums[col] += value ? 1 : 0;
      } else {
        sums[col] += typeof value === 'number' ? value : NEUTRAL_DEFAULTS[col];
      }
    }
  }

  const averaged: Record<string, number> = {};
  for (const col of FEATURE_COLUMNS) {
    averaged[col] = parseFloat((sums[col] / checkIns.length).toFixed(2));
  }

  return averaged;
}
