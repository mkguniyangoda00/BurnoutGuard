import { Request, Response, NextFunction } from 'express';
import { AlertThresholdService } from '../services/AlertThresholdService';

export class AlertThresholdController {
  constructor(private thresholdService: AlertThresholdService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const thresholds = await this.thresholdService.getAll();
      res.status(200).json({ thresholds });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { thresholdKey, value, description } = req.body;
      const threshold = await this.thresholdService.create({ thresholdKey, value: Number(value), description });
      res.status(201).json({ threshold });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { value, description } = req.body;
      const threshold = await this.thresholdService.update(req.params.key, {
        value: value !== undefined ? Number(value) : undefined,
        description,
      });
      res.status(200).json({ threshold });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const threshold = await this.thresholdService.delete(req.params.key);
      res.status(200).json({ threshold });
    } catch (err) {
      next(err);
    }
  };
}