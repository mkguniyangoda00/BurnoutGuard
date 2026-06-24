/**
 * admin.service.ts
 * 
 * Handles all admin-only API calls: user management and ML model oversight.
 * 
 * WHY: Admin operations like deactivating users or changing roles are
 * sensitive and must be restricted. The backend enforces this via the
 * authorize(['Admin', 'ResearchAdmin']) middleware. On the frontend,
 * we isolate these calls here so any future logging or audit trail
 * features can be added in one place.
 */

import { client } from './client';

export const adminService = {
  /**
   * Fetches all registered users in the system.
   * The backend strips passwordHash before returning.
   * GET /api/admin/users
   * Access: Admin, ResearchAdmin
   */
  getAllUsers: async () => {
    const response = await client.get('/admin/users');
    return response.data;
  },

  /**
   * Changes a user's role (e.g., Developer → Manager).
   * PUT /api/admin/users/:id/role
   */
  updateRole: async (userId: string, role: string) => {
    const response = await client.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  /**
   * Deactivates a user account (soft delete — the record is kept in the DB,
   * isActive is set to false). This preserves historical data integrity,
   * which is critical for a research project.
   * PUT /api/admin/users/:id/deactivate
   */
  deactivateUser: async (userId: string) => {
    const response = await client.put(`/admin/users/${userId}/deactivate`);
    return response.data;
  },

  /**
   * Fetches ML model version history and performance metrics.
   * Useful for the Research Admin to compare model iterations.
   * GET /api/admin/models
   */
  getModelMetrics: async () => {
    const response = await client.get('/admin/models');
    return response.data;
  },

  /**
   * Fetches all active alerts for all users.
   * GET /api/alerts — NOTE: The backend scopes by userId automatically
   * for Developers. For Admins, we could extend this endpoint later.
   */
  getAlerts: async () => {
    const response = await client.get('/alerts');
    return response.data;
  },
};
