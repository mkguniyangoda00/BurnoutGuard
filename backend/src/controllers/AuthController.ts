import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { registerSchema, loginSchema } from '../middleware/validators/AuthValidator';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = registerSchema.parse(req.body);
      const user = await this.authService.register(dto);
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await this.authService.login(dto);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.me(req.user!.userId);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };
}
