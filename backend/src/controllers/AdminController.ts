import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/AdminService';

export class AdminController {
  constructor(private adminService: AdminService) {}

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
}
