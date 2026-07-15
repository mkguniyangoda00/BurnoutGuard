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
    {
      featureName: 'sleepHours',
      shapValue: 0.18,
      featureValue: 5.5,
      importanceRank: 1,
      direction: 'IncreasesRisk',
    },
    {
      featureName: 'workHours',
      shapValue: 0.14,
      featureValue: 10.2,
      importanceRank: 2,
      direction: 'IncreasesRisk',
    },
    {
      featureName: 'stressLevel',
      shapValue: 0.09,
      featureValue: 7,
      importanceRank: 3,
      direction: 'IncreasesRisk',
    },
    {
      featureName: 'screenTimeHours',
      shapValue: 0.05,
      featureValue: 6,
      importanceRank: 4,
      direction: 'IncreasesRisk',
    },
    {
      featureName: 'moodScore',
      shapValue: -0.07,  // negative = decreases risk
      featureValue: 6,
      importanceRank: 5,
      direction: 'DecreasesRisk',  // FIXED
    },
    {
      featureName: 'exerciseDone',
      shapValue: -0.11,  // negative = decreases risk
      featureValue: 0,
      importanceRank: 6,
      direction: 'DecreasesRisk',  // FIXED
    },
  ],
};

export class MlService {
  // Used by CheckInService — fire and forget (just logs)
  triggerPrediction(userId: string): void {
    console.log(
      `[MlService] Prediction trigger noted for user ${userId}. Will be handled by PredictionService.`
    );
  }

  async getPrediction(_userId: string): Promise<PredictionResponse> {
    try {
      const response = await axios.post<PredictionResponse>(
        `${Env.ML_SERVICE_URL}/predict`,
        { _userId },
        { timeout: 5000 }
      );
      return response.data;
    } catch {
      console.warn('[MlService] ML service unavailable — using mock data');
      return MOCK_RESPONSE;
    }
  }

  async getWhatIf(_userId: string, modifications: Record<string, number>): Promise<{ riskScore: number; riskLevel: string }> {
    try {
      const response = await axios.post<{ riskScore: number; riskLevel: string }>(
        `${Env.ML_SERVICE_URL}/whatif`,
        { _userId, modifications },
        { timeout: 5000 }
      );
      return response.data;
    } catch {
      console.warn('[MlService] What-if unavailable — using mock recalculation');
      let adjustedScore = MOCK_RESPONSE.riskScore;

      // Simple simulation of what-if adjustments
      if (modifications.sleepHours && modifications.sleepHours > 7) {
        adjustedScore -= 0.08;
      }
      if (modifications.workHours && modifications.workHours < 8) {
        adjustedScore -= 0.06;
      }
      if (modifications.stressLevel && modifications.stressLevel < 5) {
        adjustedScore -= 0.05;
      }
      if (modifications.exerciseDone === 1) {
        adjustedScore -= 0.04;
      }

      adjustedScore = Math.max(0, Math.min(1, adjustedScore));

      const riskLevel =
        adjustedScore < 0.4
          ? 'Low'
          : adjustedScore < 0.6
            ? 'Moderate'
            : adjustedScore < 0.8
              ? 'High'
              : 'Critical';

      return { riskScore: parseFloat(adjustedScore.toFixed(2)), riskLevel };
    }
  }
}