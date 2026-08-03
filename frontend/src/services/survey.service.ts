import client from './client';

export const surveyService = {
  getAll: async () => {
    const res = await client.get('/survey/all');
    return res.data.questions;
  },
  create: async (data: { questionText: string; category: string; type: string; scaleMax?: number; displayOrder?: number }) => {
    const res = await client.post('/survey', data);
    return res.data.question;
  },
  update: async (id: string, data: Partial<{ questionText: string; category: string; type: string; scaleMax: number; displayOrder: number; isActive: boolean }>) => {
    const res = await client.put(`/survey/${id}`, data);
    return res.data.question;
  },
  delete: async (id: string) => {
    const res = await client.delete(`/survey/${id}`);
    return res.data;
  },
};