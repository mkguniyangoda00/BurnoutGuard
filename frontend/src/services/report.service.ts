/**
 * report.service.ts
 * 
 * Handles all API calls related to weekly wellness reports.
 */

import client from './client';

export interface WellnessReport {
  reportId: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  avgStress: number;
  avgSleep: number;
  avgMood: number;
  avgWorkHours: number;
  totalCheckIns: number;
  exerciseDays: number;
  overallTrend: 'Improving' | 'Stable' | 'Worsening';
  riskScoreAtEndOfWeek: number | null;
  insightSummary: string | null;
  createdBy: string;
  createdDateTime: string;
  modifiedBy: string;
  modifiedDate: string;
}

export const reportService = {
  getAll: async () => {
    const res = await client.get('/reports');
    return res.data.reports as WellnessReport[];
  },

  getById: async (id: string) => {
    const res = await client.get(`/reports/${id}`);
    return res.data.report as WellnessReport;
  },

  generate: async () => {
    const res = await client.post('/reports/generate');
    return res.data.report as WellnessReport;
  },

  downloadPdf: async (id: string) => {
    const res = await client.get(`/reports/${id}/pdf`, {
      responseType: 'blob',
    });
    return res.data as Blob;
  },
};
