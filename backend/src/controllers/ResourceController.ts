import { Request, Response, NextFunction } from 'express';
import { ResourceService } from '../services/ResourceService';

export class ResourceController {
  constructor(private resourceService: ResourceService) {}

  getActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resources = await this.resourceService.getActive();
      res.status(200).json({ resources });
    } catch (err) {
      next(err);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resources = await this.resourceService.getAll();
      res.status(200).json({ resources });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resource = await this.resourceService.create(req.user!.userId, req.body);
      res.status(201).json({ resource });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resource = await this.resourceService.update(req.params.id, req.user!.userId, req.body);
      res.status(200).json({ resource });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.resourceService.delete(req.params.id);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  };
}