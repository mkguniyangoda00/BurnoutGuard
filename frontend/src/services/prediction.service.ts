/**
 * prediction.service.ts
 * 
 * Handles all API calls related to ML burnout predictions and SHAP explanations.
 * 
 * WHY: The ML prediction is what differentiates BurnoutGuard from a simple
 * wellness tracker. SHAP (SHapley Additive exPlanations) values make the
 * model's decisions interpretable — a key requirement for research publication
 * (explainable AI / XAI). This service isolates all prediction-related
 * API communication from the UI layer.
 */

import { client } from './client';

export const predictionService = {
  /**
   * Triggers a new burnout risk prediction from the ML model.
   * The backend ML service uses the last 7 check-ins to generate a risk score.
   * POST /api/predictions
   */
  runPrediction: async () => {
    const response = await client.post('/predictions');
    return response.data;
  },

  /**
   * Fetches the most recent/current prediction for the logged-in user.
   * Includes SHAP explanations (shapExplanations) so we can render
   * the feature importance chart.
   * GET /api/predictions/latest
   */
  getLatest: async () => {
    const response = await client.get('/predictions/latest');
    return response.data;
  },

  /**
   * Fetches the full prediction history for the risk trend chart.
   * GET /api/predictions/history
   */
  getHistory: async () => {
    const response = await client.get('/predictions/history');
    return response.data;
  },

  /**
   * Runs a "what-if" simulation by temporarily modifying certain features.
   * This allows developers to see how improving their sleep or reducing
   * work hours would change their risk score — great for user engagement.
   * POST /api/predictions/what-if
   */
  whatIf: async (modifications: Record<string, number>) => {
    const response = await client.post('/predictions/what-if', modifications);
    return response.data;
  },
};
