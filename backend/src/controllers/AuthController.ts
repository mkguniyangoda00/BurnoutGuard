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

  googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        res.status(400).json({ error: 'Google ID token is required' });
        return;
      }
      const result = await this.authService.googleLogin(idToken);
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

  updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { emailNotificationsEnabled } = req.body;
      if (emailNotificationsEnabled === undefined) {
        res.status(400).json({ error: 'emailNotificationsEnabled is required' });
        return;
      }
      const user = await this.authService.updateSettings(req.user!.userId, emailNotificationsEnabled);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  };
}
