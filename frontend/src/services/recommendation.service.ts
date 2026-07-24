/**
 * recommendation.service.ts
 * 
 * Handles API calls for wellness recommendations.
 * 
 * WHY: Recommendations are generated server-side by the RecommendationService
 * based on the prediction outcome and which SHAP features are most elevated.
 * Categories include Sleep, Exercise, WorkBoundary, Social, and ScreenTime —
 * all mapped from the backend RecommendationCategory enum.
 */

import client from './client';

export const recommendationService = {
  getActive: async () => {
    const res = await client.get('/recommendations');
    return res.data.recommendations;
  },

  getAll: async () => {
    const res = await client.get('/recommendations/all');
    return res.data.recommendations;
  },

  getByPrediction: async (predictionId: string) => {
    const res = await client.get(`/recommendations/by-prediction/${predictionId}`);
    return res.data.recommendations;
  },

  complete: async (id: string) => {
    const res = await client.put(`/recommendations/${id}/complete`);
    return res.data.recommendation;
  },

  dismiss: async (id: string) => {
    const res = await client.put(`/recommendations/${id}/dismiss`);
    return res.data.recommendation;
  },
};
