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