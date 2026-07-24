import { Router } from 'express';
import { RecommendationRepository } from '../repositories/RecommendationRepository';
import { RecommendationService } from '../services/RecommendationService';
import { RecommendationController } from '../controllers/RecommendationController';
import { Authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRepository } from '../repositories/UserRepository';

const router = Router();
const recRepo = new RecommendationRepository();
const recService = new RecommendationService(recRepo, new UserRepository());
const recController = new RecommendationController(recService);

router.get('/', Authenticate, recController.getActive);
router.get('/all', Authenticate, recController.getAll);
router.get('/by-prediction/:predictionId', Authenticate, recController.getByPrediction);
router.put('/:id/complete', Authenticate, authorize(['Developer']), recController.complete);
router.put('/:id/dismiss', Authenticate, authorize(['Developer']), recController.dismiss);

export default router;
