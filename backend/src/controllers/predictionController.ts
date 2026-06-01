import { Request, Response } from 'express';
import prisma from '../config/db';

/**
 * Get the latest burnout risk prediction for a user, including SHAP explanations.
 * Route: GET /api/predictions/my-risk/:userId
 */
export const getMyRisk = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Fetch the most recent prediction and its feature attributions (SHAP values)
    const latestPrediction = await prisma.riskPrediction.findFirst({
      where: { userId },
      orderBy: { predictionTimestamp: 'desc' },
      include: {
        featureAttributions: true, 
        recommendations: true
      }
    });

    if (!latestPrediction) {
      return res.status(404).json({ message: 'No risk prediction found for this user.' });
    }

    return res.status(200).json({ data: latestPrediction });
  } catch (error) {
    console.error('Error fetching risk prediction:', error);
    return res.status(500).json({ error: 'Failed to retrieve risk prediction.' });
  }
};

/**
 * What-If Simulator: Allows developers to change inputs and see projected risk.
 * Route: POST /api/predictions/simulate
 */
export const simulateRisk = async (req: Request, res: Response) => {
  try {
    const { userId, sleepHours, meetingsDurationMins, overtimeHours } = req.body;

    // In a full production app, this would call a Python Flask/FastAPI microservice
    // running the actual XGBoost model with the altered parameters.
    // E.g. const response = await axios.post('http://ml-service/predict', { ... })
    
    // For now, we mock the deterministic rules to show the simulation working:
    let simulatedRiskScore = 0.85; // Base high risk
    let riskCategory = 'HIGH';

    if (sleepHours && sleepHours >= 7) {
      simulatedRiskScore -= 0.25; 
    }
    if (overtimeHours !== undefined && overtimeHours < 5) {
      simulatedRiskScore -= 0.20;
    }
    
    if (simulatedRiskScore < 0.4) {
      riskCategory = 'LOW';
    } else if (simulatedRiskScore < 0.7) {
      riskCategory = 'MODERATE';
    }

    // Return the simulated result without saving it to the database
    return res.status(200).json({
      message: 'Simulation complete',
      data: {
        simulatedProbability: simulatedRiskScore,
        projectedCategory: riskCategory,
        insights: `By improving your sleep to ${sleepHours} hours, your risk drops to ${riskCategory}.`
      }
    });

  } catch (error) {
    console.error('Error running simulation:', error);
    return res.status(500).json({ error: 'Failed to run what-if simulation.' });
  }
};
