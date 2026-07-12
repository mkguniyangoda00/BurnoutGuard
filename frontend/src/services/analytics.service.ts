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

import { client } from './client';

export const analyticsService = {
  /**
   * Fetches the team heatmap data for the Manager dashboard.
   * Shows each developer's risk level per week in a grid format.
   * GET /api/analytics/heatmap
   * Access: Manager, Admin
   */
  getTeamHeatmap: async () => {
    const response = await client.get('/analytics/heatmap');
    return response.data;
  },

  /**
   * Fetches the department-level risk distribution for the HR dashboard.
   * Shows percentage breakdown of Low/Moderate/High risk per department.
   * GET /api/analytics/department
   * Access: HRofficer, Admin
   */
  getDepartmentOverview: async () => {
    const response = await client.get('/analytics/department');
    return response.data;
  },

  /**
   * Fetches sprint-by-sprint aggregate risk counts for the Manager dashboard.
   * Useful for identifying if burnout spikes around release cycles.
   * GET /api/analytics/sprint
   * Access: Manager, Admin
   */
  getSprintRisk: async () => {
    const response = await client.get('/analytics/sprint');
    return response.data;
  },
};
