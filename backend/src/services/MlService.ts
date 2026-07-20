import axios from 'axios';
import { Env } from '../config/env';

interface ShapRow {
  featureName: string;
  shapValue: number;
  featureValue: number;
  importanceRank: number;
  direction: string;
  plainLanguageText?: string;
}

interface PredictionResponse {
  riskScore: number;
  riskLevel: string;
  modelVersion: string;
  shapValues: ShapRow[];
}

interface WhatIfResponse {
  riskScore: number;
  riskLevel: string;
}

// Kept as a resilience fallback if the ML service is temporarily unreachable.
const FALLBACK_RESPONSE: PredictionResponse = {
  riskScore: 0.5,
  riskLevel: 'Moderate',
  modelVersion: 'fallback',
  shapValues: [],
};

export class MlService {
  triggerPrediction(userId: string): void {
    console.log(
      `[MlService] Prediction trigger noted for user ${userId}. Will be handled by PredictionService.`
    );
  }

  async getPrediction(
    _userId: string,
    features: Record<string, number>
  ): Promise<PredictionResponse> {
    try {
      const response = await axios.post<PredictionResponse>(
        `${Env.ML_SERVICE_URL}/predict`,
        { features },
        { timeout: 8000 }
      );
      return response.data;
    } catch (err) {
      console.warn('[MlService] ML service unavailable — using fallback response', err);
      return FALLBACK_RESPONSE;
    }
  }

  async getWhatIf(
    _userId: string,
    features: Record<string, number>,
    modifications: Record<string, number>
  ): Promise<WhatIfResponse> {
    try {
      const response = await axios.post<WhatIfResponse>(
        `${Env.ML_SERVICE_URL}/whatif`,
        { features, modifications },
        { timeout: 8000 }
      );
      return response.data;
    } catch (err) {
      console.warn('[MlService] What-if unavailable — using fallback response', err);
      return { riskScore: 0.5, riskLevel: 'Moderate' };
    }
  }
}
