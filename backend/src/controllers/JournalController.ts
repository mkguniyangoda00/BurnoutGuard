import { Request, Response, NextFunction } from 'express';
import { JournalService } from '../services/JournalService';

export class JournalController {
  constructor(private journalService: JournalService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entry = await this.journalService.create(req.user!.userId, req.body);
      res.status(201).json({ entry });
    } catch (err) {
      next(err);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entries = await this.journalService.getHistory(req.user!.userId);
      res.status(200).json({ entries });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const entry = await this.journalService.getById(req.params.id, req.user!.userId);
      res.status(200).json({ entry });
    } catch (err) {
      next(err);
    }
  };
}