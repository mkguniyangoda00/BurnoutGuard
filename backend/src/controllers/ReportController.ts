import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/ReportService';
import { PdfService } from '../services/PdfService';

export class ReportController {
  constructor(
    private reportService: ReportService,
    private pdfService: PdfService
  ) {}

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

  getPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.reportService.getById(req.params.id, req.user!.userId);
      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      const pdfBuffer = await this.pdfService.generateReportPdf(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=burnoutguard-report-${report.reportId}.pdf`);
      res.status(200).send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  };

  generateMine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log(`[ReportController] Generating report on demand for user ${req.user!.userId}.`);
      const report = await this.reportService.generateForRecentDays(req.user!.userId);

      if (!report) {
        res.status(404).json({ error: 'Not enough check-in data to generate a report yet' });
        return;
      }

      console.log(`[ReportController] Generated report ${report.reportId} for user ${req.user!.userId}.`);
      res.status(200).json({ report });
    } catch (err) {
      next(err);
    }
  };

  triggerManual = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await this.reportService.generateForAllUsers(req.user!.userId);
      res.status(200).json({ message: 'Reports generated', count });
    } catch (err) {
      next(err);
    }
  };
}
