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

import { client } from './client';

export const recommendationService = {
  /**
   * Fetches all active (non-dismissed) recommendations for the user.
   * GET /api/recommendations
   */
  getActive: async () => {
    const response = await client.get('/recommendations');
    return response.data;
  },

  /**
   * Marks a specific recommendation as completed.
   * PUT /api/recommendations/:id/complete
   */
  markComplete: async (id: string) => {
    const response = await client.put(`/recommendations/${id}/complete`);
    return response.data;
  },

  /**
   * Dismisses a recommendation (user doesn't want to see it).
   * PUT /api/recommendations/:id/dismiss
   */
  dismiss: async (id: string) => {
    const response = await client.put(`/recommendations/${id}/dismiss`);
    return response.data;
  },
};
