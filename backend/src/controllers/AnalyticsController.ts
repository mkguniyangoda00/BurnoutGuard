import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  getTeamHeatmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getTeamHeatmap({
        workMode: req.query.workMode as string | undefined,
        riskPeriod: req.query.riskPeriod as string | undefined,
      });
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  getDepartmentOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getDepartmentOverview();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  getSprintRisk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getSprintRisk();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  getWorkloadHotspots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getWorkloadHotspots();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  getOvertimePatterns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getOvertimePatterns();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  getManagerRecommendationSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getManagerRecommendationSummary();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };
}
