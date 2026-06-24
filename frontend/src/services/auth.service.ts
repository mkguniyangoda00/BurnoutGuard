import { client } from './client';

export const authService = {
  login: async (credentials: any) => {
    const response = await client.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await client.post('/auth/register', userData);
    return response.data;
  },
  
  getMe: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  }
};
