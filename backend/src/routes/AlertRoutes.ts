import { Router, Request, Response, NextFunction } from 'express';
import { AlertRepository } from '../repositories/AlertRepository';
import { AlertService } from '../services/AlertService';
import { Authenticate } from '../middleware/Authenticate';

const router = Router();
const alertRepo = new AlertRepository();
const alertService = new AlertService(alertRepo);

router.get('/', Authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await alertService.getUnread(req.user!.userId);
    res.status(200).json({ alerts });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/read', Authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = await alertService.markRead(req.params.id, req.user!.userId);
    res.status(200).json({ alert });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/dismiss', Authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = await alertService.dismiss(req.params.id, req.user!.userId);
    res.status(200).json({ alert });
  } catch (err) {
    next(err);
  }
});

export default router;
