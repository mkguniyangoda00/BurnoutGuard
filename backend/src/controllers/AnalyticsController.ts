import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  getTeamHeatmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await this.analyticsService.getTeamHeatmap({
      workMode: req.query.workMode as string | undefined,
      riskPeriod: req.query.riskPeriod as string | undefined,
      experienceBand: req.query.experienceBand as string | undefined, // NEW
      jobTitle: req.query.jobTitle as string | undefined,             // NEW
    });
    res.status(200).json(data);
  } catch (err) { next(err); }
};

getHeatmapFilterOptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await this.analyticsService.getHeatmapFilterOptions();
    res.status(200).json(data);
  } catch (err) { next(err); }
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

  getOrgRiskTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getOrgRiskTrend();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  getOrgLifestyleTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getOrgLifestyleTrend();
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  getFairnessReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getFairnessReport();
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

  getTeamShapSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getTeamShapSummary({
        workMode: req.query.workMode as string | undefined,
        experienceBand: req.query.experienceBand as string | undefined,
        jobTitle: req.query.jobTitle as string | undefined,
      });
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };

  teamWhatIf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.analyticsService.getTeamWhatIf(req.body ?? {}, {
        workMode: req.query.workMode as string | undefined,
        experienceBand: req.query.experienceBand as string | undefined,
        jobTitle: req.query.jobTitle as string | undefined,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
