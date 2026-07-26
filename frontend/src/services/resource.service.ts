import client from './client';

export const resourceService = {
  getActive: async () => {
    const res = await client.get('/resources');
    return res.data.resources;
  },
};