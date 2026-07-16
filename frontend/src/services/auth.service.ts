import client from './client';

export const authService = {
  register: async (data: {
    email: string;
    password: string;
    fullName: string;
    role: string;
    company?: string;
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
    window.location.href = '/login';
  },

  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};
