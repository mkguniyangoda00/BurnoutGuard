/**
 * analytics.service.ts
 * 
 * Handles API calls for team and department-level analytics.
 * 
 * WHY: Analytics endpoints are restricted to Manager and HR roles (RBAC).
 * They aggregate individual burnout data into anonymised team trends,
 * which is ethically important for a research project (no individual
 * data is exposed to managers — only aggregate statistics).
 */

import client from './client';

export const analyticsService = {
  getHeatmap: async () => {
    const res = await client.get('/analytics/heatmap');
    return res.data;
  },

  getTeamHeatmap: async (params?: { workMode?: string; riskPeriod?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.workMode) searchParams.set('workMode', params.workMode);
    if (params.riskPeriod) searchParams.set('riskPeriod', params.riskPeriod);
    const queryString = searchParams.toString();
    const res = await client.get(`/analytics/heatmap${queryString ? `?${queryString}` : ''}`);
    return res.data;
  },

  getDepartment: async () => {
    const res = await client.get('/analytics/department');
    return res.data;
  },

  getDepartmentOverview: async () => {
    const res = await client.get('/analytics/department');
    return res.data;
  },

  getSprintRisk: async () => {
    const res = await client.get('/analytics/sprint');
    return res.data;
  },

  getWorkloadHotspots: async () => {
    const res = await client.get('/analytics/workload-hotspots');
    return res.data;
  },

  getOvertimePatterns: async () => {
    const res = await client.get('/analytics/overtime-patterns');
    return res.data;
  },

  getManagerRecommendationSummary: async () => {
    const res = await client.get('/analytics/manager-recommendations');
    return res.data;
  },
};
