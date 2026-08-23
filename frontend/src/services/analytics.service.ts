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

  getTeamHeatmap: async (params?: { workMode?: string; riskPeriod?: string; experienceBand?: string; jobTitle?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.workMode) searchParams.set('workMode', params.workMode);
    if (params?.riskPeriod) searchParams.set('riskPeriod', params.riskPeriod);
    if (params?.experienceBand) searchParams.set('experienceBand', params.experienceBand);
    if (params?.jobTitle) searchParams.set('jobTitle', params.jobTitle);
    const queryString = searchParams.toString();
    const res = await client.get(`/analytics/heatmap${queryString ? `?${queryString}` : ''}`);
    return res.data;
  },

  getHeatmapFilterOptions: async () => {
    const res = await client.get('/analytics/heatmap-filters');
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

  getFairnessReport: async () => {
    const res = await client.get('/analytics/fairness');
    return res.data;
  },

  getOvertimePatterns: async () => {
    const res = await client.get('/analytics/overtime-patterns');
    return res.data;
  },

  getOrgRiskTrend: async () => {
    const res = await client.get('/analytics/org-risk-trend');
    return res.data;
  },

  getOrgLifestyleTrend: async () => {
    const res = await client.get('/analytics/org-lifestyle-trend');
    return res.data;
  },

  getManagerRecommendationSummary: async () => {
    const res = await client.get('/analytics/manager-recommendations');
    return res.data;
  },

  getTeamShapSummary: async (params?: { workMode?: string; experienceBand?: string; jobTitle?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.workMode) searchParams.set('workMode', params.workMode);
    if (params?.experienceBand) searchParams.set('experienceBand', params.experienceBand);
    if (params?.jobTitle) searchParams.set('jobTitle', params.jobTitle);
    const queryString = searchParams.toString();
    const res = await client.get(`/analytics/team-shap-summary${queryString ? `?${queryString}` : ''}`);
    return res.data;
  },

  teamWhatIf: async (
    modifications: Record<string, number>,
    params?: { workMode?: string; experienceBand?: string; jobTitle?: string }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.workMode) searchParams.set('workMode', params.workMode);
    if (params?.experienceBand) searchParams.set('experienceBand', params.experienceBand);
    if (params?.jobTitle) searchParams.set('jobTitle', params.jobTitle);
    const queryString = searchParams.toString();
    const res = await client.post(`/analytics/team-whatif${queryString ? `?${queryString}` : ''}`, modifications);
    return res.data;
  },
};
