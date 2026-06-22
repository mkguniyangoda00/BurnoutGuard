import { Router } from 'express';
import { PredictionRepository } from '../repositories/PredictionRepository';
import { RecommendationRepository } from '../repositories/RecommendationRepository';
import { AlertRepository } from '../repositories/AlertRepository';
import { MlService } from '../services/MlService';
import { RecommendationService } from '../services/RecommendationService';
import { AlertService } from '../services/AlertService';
import { PredictionService } from '../services/PredictionService';
import { PredictionController } from '../controllers/PredictionController';
import { Authenticate } from '../middleware/Authenticate';
import { authorize } from '../middleware/Authorize';

const router = Router();
const predictionRepo = new PredictionRepository();
const recRepo = new RecommendationRepository();
const alertRepo = new AlertRepository();
const mlService = new MlService();
const recService = new RecommendationService(recRepo);
const alertService = new AlertService(alertRepo);
const predictionService = new PredictionService(predictionRepo, mlService, recService, alertService);
const predictionController = new PredictionController(predictionService);

router.get('/latest', Authenticate, predictionController.getLatest);
router.get('/history', Authenticate, predictionController.getHistory);
router.get('/:id', Authenticate, predictionController.getById);
router.post('/whatif', Authenticate, authorize(['Developer']), predictionController.runWhatIf);
router.post('/trigger', Authenticate, authorize(['Developer']), predictionController.triggerManual);

export default router;
