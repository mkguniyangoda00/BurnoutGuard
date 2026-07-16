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

  getTeamHeatmap: async () => {
    const res = await client.get('/analytics/heatmap');
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
};
