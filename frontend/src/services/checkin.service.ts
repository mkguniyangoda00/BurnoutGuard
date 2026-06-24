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

import { client } from './client';

/**
 * Matches the Zod validator on the backend exactly.
 * If the backend schema changes, we update this interface accordingly.
 */
export interface CheckInPayload {
  workHours: number;        // 0–24
  stressLevel: number;      // 1–10
  sleepHours: number;       // 0–24
  sleepQuality: number;     // 1–5
  exerciseDone: boolean;    // true/false
  screenTimeHours: number;  // 0–24
  workloadRating: number;   // 1–5
  moodScore: number;        // 1–10
  energyLevel: number;      // 1–5
  notes?: string;           // optional, max 500 chars
}

export const checkinService = {
  /**
   * Submits a new daily check-in to the backend.
   * POST /api/checkins
   * The backend will save it to the DailyCheckIn table in MySQL.
   */
  submit: async (payload: CheckInPayload) => {
    const response = await client.post('/checkins', payload);
    return response.data;
  },

  /**
   * Fetches the user's recent check-in history.
   * GET /api/checkins
   */
  getHistory: async (limit?: number) => {
    const response = await client.get('/checkins', { params: { limit } });
    return response.data;
  },

  /**
   * Fetches the user's streak data (consecutive check-in days).
   * GET /api/checkins/streak
   */
  getStreak: async () => {
    const response = await client.get('/checkins/streak');
    return response.data;
  },
};
