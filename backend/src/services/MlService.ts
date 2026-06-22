import axios from 'axios';
import { Env } from '../config/Env';

interface ShapRow {
  featureName: string;
  shapValue: number;
  featureValue: number;
  importanceRank: number;
  direction: string;
}

interface PredictionResponse {
  riskScore: number;
  riskLevel: string;
  modelVersion: string;
  shapValues: ShapRow[];
}

const MOCK_RESPONSE: PredictionResponse = {
  riskScore: 0.62,
  riskLevel: 'Moderate',
  modelVersion: 'v1.1-mock',
  shapValues: [
    { featureName: 'sleepHours', shapValue: 0.18, featureValue: 5.5, importanceRank: 1, direction: 'IncreasesRisk' },
    { featureName: 'workHours', shapValue: 0.14, featureValue: 10.2, importanceRank: 2, direction: 'IncreasesRisk' },
    { featureName: 'exerciseDone', shapValue: -0.11, featureValue: 0, importanceRank: 3, direction: 'IncreasesRisk' },
    { featureName: 'stressLevel', shapValue: 0.09, featureValue: 7, importanceRank: 4, direction: 'IncreasesRisk' },
    { featureName: 'moodScore', shapValue: -0.07, featureValue: 6, importanceRank: 5, direction: 'DecreasesRisk' },
    { featureName: 'screenTimeHours', shapValue: 0.05, featureValue: 6, importanceRank: 6, direction: 'IncreasesRisk' },
  ],
};

export class MlService {
  triggerPrediction(userId: string): void {
    axios
      .post(`${Env.ML_SERVICE_URL}/predict`, { userId })
      .then(() => console.log(`[MlService] Prediction triggered for user ${userId}`))
      .catch((err) => console.error(`[MlService] Trigger failed for user ${userId}:`, err.message));
  }

  async getPrediction(userId: string): Promise<PredictionResponse> {
    try {
      const response = await axios.post<PredictionResponse>(
        `${Env.ML_SERVICE_URL}/predict`,
        { userId },
        { timeout: 5000 }
      );
      return response.data;
    } catch {
      console.warn('[MlService] ML service unavailable, using mock data');
      return MOCK_RESPONSE;
    }
  }

  async getWhatIf(userId: string, modifications: object): Promise<{ riskScore: number; riskLevel: string }> {
    try {
      const response = await axios.post<{ riskScore: number; riskLevel: string }>(
        `${Env.ML_SERVICE_URL}/whatif`,
        { userId, modifications },
        { timeout: 5000 }
      );
      return response.data;
    } catch {
      console.warn('[MlService] What-if unavailable, returning mock recalculation');
      const mock = { ...MOCK_RESPONSE };
      const adjustedScore = Math.max(0, Math.min(1, mock.riskScore - 0.08));
      return {
        riskScore: adjustedScore,
        riskLevel: adjustedScore < 0.4 ? 'Low' : adjustedScore < 0.6 ? 'Moderate' : adjustedScore < 0.8 ? 'High' : 'Critical',
      };
    }
  }
}
