import { Request, Response, NextFunction } from 'express';
import { RecommendationService } from '../services/RecommendationService';

export class RecommendationController {
  constructor(private recService: RecommendationService) {}

  getActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recommendations = await this.recService.getActive(req.user!.userId);
      res.status(200).json({ recommendations });
    } catch (err) {
      next(err);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const recommendations = await this.recService.getAll(req.user!.userId);
      res.status(200).json({ recommendations });
    } catch (err) {
      next(err);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rec = await this.recService.complete(req.params.id, req.user!.userId);
      res.status(200).json({ recommendation: rec });
    } catch (err) {
      next(err);
    }
  };

  dismiss = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rec = await this.recService.dismiss(req.params.id, req.user!.userId);
      res.status(200).json({ recommendation: rec });
    } catch (err) {
      next(err);
    }
  };
}
