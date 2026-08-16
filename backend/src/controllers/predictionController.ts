import { Request, Response, NextFunction } from 'express';
import { PredictionService } from '../services/PredictionService';

export class PredictionController {
  constructor(private predictionService: PredictionService) {}

  getLatest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prediction = await this.predictionService.getLatest(req.user!.userId);
      const dimensionBreakdown = prediction
        ? await this.predictionService.getDimensionBreakdown((prediction as any).predictionId, req.user!.userId)
        : [];
      const calibrationConfidence = prediction
        ? this.computeCalibrationConfidence((prediction as any).riskScore)
        : null;
      res.status(200).json({ prediction, dimensionBreakdown, calibrationConfidence });
    } catch (err) {
      next(err);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const predictions = await this.predictionService.getHistory(req.user!.userId);
      res.status(200).json({ predictions });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prediction = await this.predictionService.getById(
        req.params.id,
        req.user!.userId
      );
      const dimensionBreakdown = await this.predictionService.getDimensionBreakdown(
        req.params.id,
        req.user!.userId
      );
      res.status(200).json({ prediction, dimensionBreakdown });
    } catch (err) {
      next(err);
    }
  };

  getCounterfactual = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.predictionService.getCounterfactual(req.user!.userId);
      res.status(200).json({ counterfactual: result });
    } catch (err) {
      next(err);
    }
  };

  runWhatIf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.predictionService.runWhatIf(
        req.user!.userId,
        req.body
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  triggerManual = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prediction = await this.predictionService.createPrediction(req.user!.userId);
      res.status(201).json({ prediction });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Lightweight proxy for calibration confidence: predictions further from
   * the 0.5 decision boundary within their class are treated as
   * higher-confidence. This is a heuristic surfaced in the UI; the
   * rigorous calibration analysis (Brier score, ECE, reliability curves)
   * lives in ml-service/experiments/calibration.py for the thesis
   * evaluation chapter — this heuristic exists so the finding is visible
   * in the product, not because it replaces that analysis.
   */
  private computeCalibrationConfidence(riskScore: number): 'high' | 'moderate' | 'low' {
    const distanceFromBoundary = Math.abs(riskScore - 0.5);
    if (distanceFromBoundary > 0.3) return 'high';
    if (distanceFromBoundary > 0.15) return 'moderate';
    return 'low';
  }
}
