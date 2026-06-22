import { Router } from 'express';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { MlService } from '../services/MlService';
import { CheckInService } from '../services/CheckInService';
import { CheckInController } from '../controllers/CheckInController';
import { Authenticate } from '../middleware/Authenticate';
import { authorize } from '../middleware/Authorize';

const router = Router();
const checkInRepo = new CheckInRepository();
const mlService = new MlService();
const checkInService = new CheckInService(checkInRepo, mlService);
const checkInController = new CheckInController(checkInService);

router.post('/', Authenticate, authorize(['Developer']), checkInController.submit);
router.get('/history', Authenticate, checkInController.getHistory);
router.get('/streak', Authenticate, checkInController.getStreak);
router.put('/:id', Authenticate, authorize(['Developer']), checkInController.editToday);

export default router;
