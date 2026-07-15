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

import client from './client';

export const predictionService = {
  getLatest: async () => {
    const res = await client.get('/predictions/latest');
    return res.data.prediction;
  },

  getHistory: async () => {
    const res = await client.get('/predictions/history');
    return res.data.predictions;
  },

  getById: async (id: string) => {
    const res = await client.get(`/predictions/${id}`);
    return res.data.prediction;
  },

  trigger: async () => {
    const res = await client.post('/predictions/trigger');
    return res.data.prediction;
  },

  whatIf: async (modifications: Record<string, number>) => {
    const res = await client.post('/predictions/whatif', modifications);
    return res.data;
  },
};
