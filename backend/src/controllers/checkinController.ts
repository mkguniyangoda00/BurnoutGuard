import { Request, Response, NextFunction } from 'express';
import { CheckInService } from '../services/CheckInService';
import { checkInSchema } from '../middleware/validators/CheckInValidator';

export class CheckInController {
  constructor(private checkInService: CheckInService) {}

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = checkInSchema.parse(req.body);
      const checkIn = await this.checkInService.submit(req.user!.userId, dto);
      res.status(201).json({ checkIn });
    } catch (err) {
      next(err);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const checkIns = await this.checkInService.getHistory(req.user!.userId);
      res.status(200).json({ checkIns });
    } catch (err) {
      next(err);
    }
  };

  getStreak = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const streak = await this.checkInService.getStreak(req.user!.userId);
      res.status(200).json({ streak });
    } catch (err) {
      next(err);
    }
  };

  editToday = async (req: Request, res: Response) => {
  const userId = req.user!.userId; // or however you extract it
  const { id } = req.params;
  const dto = req.body;
  const updated = await this.checkInService.editToday(id, userId, dto);
  res.json({ checkIn: updated });
  };
}
