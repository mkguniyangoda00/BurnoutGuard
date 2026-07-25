import client from './client';

export interface JournalEntryPayload {
  reflectionText: string;
  stressTriggers?: string;
  workChallenges?: string;
  positiveEvents?: string;
  copingStrategiesUsed?: string;
}

export const journalService = {
  create: async (data: JournalEntryPayload) => {
    const res = await client.post('/journal', data);
    return res.data.entry;
  },

  getHistory: async () => {
    const res = await client.get('/journal');
    return res.data.entries;
  },
};