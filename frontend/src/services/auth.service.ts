import client from './client';
import { queryClient } from '../lib/queryClient';

export const authService = {
  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    role: string;
    company?: string;
    consentGiven: boolean;
    researchParticipation?: boolean;
  }) => {
    const res = await client.post('/auth/register', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await client.post('/auth/login', data);
    const { token, user } = res.data;
    localStorage.setItem('bg_token', token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return res.data;
  },

  googleLogin: async (idToken: string) => {
    const res = await client.post('/auth/google', { idToken });
    const { token, user } = res.data;
    localStorage.setItem('bg_token', token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return res.data;
  },

  updateSettings: async (emailNotificationsEnabled: boolean) => {
    const res = await client.put('/auth/settings', { emailNotificationsEnabled });
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.emailNotificationsEnabled = emailNotificationsEnabled;
    localStorage.setItem('user', JSON.stringify(user));
    return res.data;
  },

  updateDeveloperProfile: async (ageGroup: string | null) => {
    const res = await client.put('/auth/developer-profile', { ageGroup });
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.ageGroup = ageGroup;
    localStorage.setItem('user', JSON.stringify(user));
    return res.data;
  },

  withdrawResearchParticipation: async () => {
    const res = await client.put('/auth/consent', {});
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.researchParticipation = false;
    localStorage.setItem('user', JSON.stringify(user));
    return res.data;
  },

  me: async () => {
    const res = await client.get('/auth/me');
    return res.data.user;
  },

  getMe: async () => {
    const res = await client.get('/auth/me');
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('bg_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    queryClient.clear();
    window.location.href = '/login';
  },

  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};
