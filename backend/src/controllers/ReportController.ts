import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/ReportService';

export class ReportController {
  constructor(private reportService: ReportService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reports = await this.reportService.getAll(req.user!.userId);
      res.status(200).json({ reports });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.reportService.getById(req.params.id, req.user!.userId);
      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }
      res.status(200).json({ report });
    } catch (err) {
      next(err);
    }
  };

  triggerManual = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await this.reportService.generateForAllUsers();
      res.status(200).json({ message: 'Reports generated', count });
    } catch (err) {
      next(err);
    }
  };
}
