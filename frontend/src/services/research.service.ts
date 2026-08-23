import client from './client';

export type DemographicDimension = 'ageGroup' | 'experienceBand' | 'jobTitle' | 'workModel';

export const researchService = {
  getInsights: async () => {
    const res = await client.get('/research/insights');
    return res.data.insights ?? [];
  },

  getDemographicBreakdown: async (dimension: DemographicDimension) => {
    const res = await client.get(`/research/factors/demographic?dimension=${encodeURIComponent(dimension)}`);
    return res.data;
  },

  getAvailableFactors: async () => {
    const res = await client.get('/research/factors/available-factors');
    return res.data;
  },

  getFactorDistribution: async (factor: string) => {
    const res = await client.get(`/research/factors/distribution?factor=${encodeURIComponent(factor)}`);
    return res.data;
  },

  getInteractionAnalysis: async (factorA: string, factorB: string) => {
    const res = await client.get(
      `/research/factors/interaction?factorA=${encodeURIComponent(factorA)}&factorB=${encodeURIComponent(factorB)}`
    );
    return res.data;
  },
};
