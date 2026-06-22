import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  getTeamHeatmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getTeamHeatmap();
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
}
