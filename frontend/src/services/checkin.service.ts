/**
 * checkin.service.ts
 * 
 * Handles all API calls related to the Daily Check-In feature.
 * 
 * WHY: The check-in is the core data collection mechanism of BurnoutGuard.
 * Every other feature (predictions, recommendations, reports) depends on
 * the data collected here. Isolating these calls into a service layer
 * keeps our React components clean and makes it easy to unit test.
 */

import client from './client';

/**
 * Matches the Zod validator on the backend exactly.
 * If the backend schema changes, we update this interface accordingly.
 */
export interface CheckInPayload {
  // Sleep & Rest
  sleepHours: number;
  sleepQuality: number;

  // Physical Activity
  exerciseLevel: number;
  screenTimeHours: number;

  // Work & Productivity
  workHours: number;
  workloadRating: number;
  overtimeHours: number;
  breaksTaken: number;
  commuteMinutes: number;

  // Mental & Emotional
  stressLevel: number;
  moodScore: number;
  energyLevel: number;
  workSatisfaction: number;

  // Lifestyle & Health
  caffeineIntake: number;
  mealQuality: number;
  socialSupportLevel: number;

  // Psychological Wellbeing
  anxietyLevel: number;
  emotionalFatigue: number;
  motivationLevel: number;
  concentrationIssues: number;
  irritabilityLevel: number;
  lonelinessLevel: number;
  selfEfficacy: number;
  copingAbility: number;

  // Work Context (Sri Lankan & Global)
  powerInternetDisruption: number;
  wfhEnvironmentQuality: number;
  familyResponsibilityLoad: number;
  salaryWorkloadSatisfaction: number;
  afterHoursMessaging: boolean;

  // Work Pattern Monitoring
  meetingsCount: number;
  urgentTasksCount: number;
  sprintPressureRating: number;
  deadlineFrequency: number;
  isWeekendWork: boolean;
  bugFixingLoad: number;
  contextSwitchingFrequency: number;
  isOnCallToday: boolean;
  
  // Notes
  notes?: string;
}

export const checkinService = {
  submit: async (data: CheckInPayload) => {
    const res = await client.post('/checkins', data);
    return res.data.checkIn;
  },

  getHistory: async () => {
    const res = await client.get('/checkins/history');
    return res.data.checkIns;
  },

  getStreak: async () => {
    const res = await client.get('/checkins/streak');
    return res.data.streak;
  },

  editCheckIn: async (id: string, data: object) => {
    const res = await client.put(`/checkins/${id}`, data);
    return res.data.checkIn;
  },
};