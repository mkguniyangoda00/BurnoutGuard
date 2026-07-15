/**
 * report.service.ts
 * 
 * Handles all API calls related to weekly wellness reports.
 */

import client from './client';

export const reportService = {
  getAll: async () => {
    const res = await client.get('/reports');
    return res.data.reports;
  },

  getById: async (id: string) => {
    const res = await client.get(`/reports/${id}`);
    return res.data.report;
  },

  generate: async () => {
    const res = await client.post('/reports/generate');
    return res.data;
  },
};
