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
  sleepHours: number;        // 0–24
  sleepQuality: number;      // 1–5
  
  // Physical Activity
  exerciseLevel: number;     // 1–5 (None to Intense)
  screenTimeHours: number;   // 0–24
  
  // Work & Productivity
  workHours: number;         // 0–24
  workloadRating: number;    // 1–5
  overtimeHours: number;     // 0–24
  breaksTaken: number;       // 0–20
  commuteMinutes: number;    // 0–480
  
  // Mental & Emotional
  stressLevel: number;       // 1–10
  moodScore: number;         // 1–10
  energyLevel: number;       // 1–5
  workSatisfaction: number;  // 1–5
  
  // Lifestyle & Health
  caffeineIntake: number;    // 0–10
  mealQuality: number;       // 1–5
  socialSupportLevel: number; // 1–5
  
  // Notes
  notes?: string;            // optional, max 500 chars
}



export const checkinService = {
  submit: async (data: {
    workHours: number;
    stressLevel: number;
    sleepHours: number;
    sleepQuality: number;
    exerciseDone: boolean;
    screenTimeHours: number;
    workloadRating: number;
    moodScore: number;
    energyLevel: number;
    notes?: string;
  }) => {
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