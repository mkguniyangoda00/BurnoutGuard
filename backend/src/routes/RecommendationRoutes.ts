import { Router } from 'express';
import { RecommendationRepository } from '../repositories/RecommendationRepository';
import { RecommendationService } from '../services/RecommendationService';
import { RecommendationController } from '../controllers/RecommendationController';
import { Authenticate } from '../middleware/Authenticate';
import { authorize } from '../middleware/Authorize';

const router = Router();
const recRepo = new RecommendationRepository();
const recService = new RecommendationService(recRepo);
const recController = new RecommendationController(recService);

router.get('/', Authenticate, recController.getActive);
router.get('/all', Authenticate, recController.getAll);
router.put('/:id/complete', Authenticate, authorize(['Developer']), recController.complete);
router.put('/:id/dismiss', Authenticate, authorize(['Developer']), recController.dismiss);

export default router;
