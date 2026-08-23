import { Request, Response, NextFunction } from 'express';
import { FactorAnalysisService } from '../services/FactorAnalysisService';

export class FactorAnalysisController {
  constructor(private factorService: FactorAnalysisService) {}

  getDemographicBreakdown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { dimension } = req.query;
      const result = await this.factorService.getDemographicBreakdown(dimension as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  getFactorDistribution = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { factor } = req.query;
      const result = await this.factorService.getFactorDistribution(String(factor));
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  getInteractionAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { factorA, factorB } = req.query;
      const result = await this.factorService.getInteractionAnalysis(String(factorA), String(factorB));
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  getAvailableFactors = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.factorService.getAvailableFactors();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
