import { Request, Response, NextFunction } from 'express';
import { SurveyQuestionService } from '../services/SurveyQuestionService';

export class SurveyQuestionController {
  constructor(private service: SurveyQuestionService) {}

  getActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const questions = await this.service.getActive();
      res.status(200).json({ questions });
    } catch (err) { next(err); }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const questions = await this.service.getAll();
      res.status(200).json({ questions });
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const question = await this.service.create(req.user!.userId, req.body);
      res.status(201).json({ question });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const question = await this.service.update(req.params.id, req.user!.userId, req.body);
      res.status(200).json({ question });
    } catch (err) { next(err); }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.params.id);
      res.status(200).json({ success: true });
    } catch (err) { next(err); }
  };
}