/**
 * report.service.ts
 * 
 * Handles all API calls related to weekly wellness reports.
 */

import { client } from './client';

export const reportService = {
  /**
   * Fetches all weekly wellness reports for the logged-in user.
   * GET /api/reports
   */
  getAll: async () => {
    const response = await client.get('/reports');
    return response.data;
  },

  /**
   * Fetches a specific weekly wellness report by ID.
   * GET /api/reports/:id
   */
  getById: async (id: string) => {
    const response = await client.get(`/reports/${id}`);
    return response.data;
  },
};
