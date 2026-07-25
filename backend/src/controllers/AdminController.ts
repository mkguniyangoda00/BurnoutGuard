import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/AdminService';
import { AuditLogService } from '../services/AuditLogService';
import { ResearchService } from '../services/ResearchService';

export class AdminController {
  constructor(
    private adminService: AdminService ,
    private researchService: ResearchService, 
    private auditLogService: AuditLogService
  ) {}

  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.adminService.getAllUsers();
      res.status(200).json({ users });
    } catch (err) {
      next(err);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role } = req.body;
      const user = await this.adminService.updateRole(req.params.id, role, req.user!.userId);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };

  deactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.adminService.deactivateUser(req.params.id, req.user!.userId);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };

  getModelMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metrics = await this.adminService.getModelMetrics();
      res.status(200).json({ metrics });
    } catch (err) {
      next(err);
    }
  };

  retrainModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminService.triggerRetrain();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  exportDataset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from, to, includeShap } = req.query;
    const csv = await this.researchService.exportAnonymizedData({
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      includeShap: includeShap === 'true',
    });

    void this.auditLogService.log({
      actorId: req.user!.userId,
      actorEmail: req.user!.email ?? 'unknown',
      actorRole: req.user!.role,
      action: 'DATASET_EXPORT',
      entityType: 'ResearchExport',
      result: 'Success',
      details: `Exported anonymized dataset (from=${from ?? 'all'}, to=${to ?? 'all'})`,
    }).catch((err: any) => console.error('[AuditLog] Failed to log dataset export:', err.message));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=burnoutguard-anonymized-export.csv');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};
}
