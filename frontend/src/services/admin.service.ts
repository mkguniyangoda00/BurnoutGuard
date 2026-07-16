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

import client from './client';

export const adminService = {
  getUsers: async () => {
    const res = await client.get('/admin/users');
    return res.data.users ?? res.data;
  },

  getAllUsers: async () => {
    const res = await client.get('/admin/users');
    return res.data.users ?? res.data;
  },

  updateRole: async (id: string, role: string) => {
    const res = await client.put(`/admin/users/${id}/role`, { role });
    return res.data.user;
  },

  deactivate: async (id: string) => {
    const res = await client.put(`/admin/users/${id}/deactivate`);
    return res.data.user;
  },

  deactivateUser: async (id: string) => {
    const res = await client.put(`/admin/users/${id}/deactivate`);
    return res.data.user;
  },

  getModels: async () => {
    const res = await client.get('/admin/models');
    return res.data.metrics;
  },

  getAuditLogs: async (from?: string, to?: string) => {
    const params = from && to ? `?from=${from}&to=${to}` : '';
    const res = await client.get(`/admin/audit${params}`);
    return res.data.logs;
  },
};
