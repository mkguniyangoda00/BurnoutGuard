import { Router } from 'express';
import { PredictionRepository } from '../repositories/PredictionRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { RecommendationRepository } from '../repositories/RecommendationRepository';
import { AlertRepository } from '../repositories/AlertRepository';
import { MlService } from '../services/MlService';
import { RecommendationService } from '../services/RecommendationService';
import { AlertService } from '../services/AlertService';
import { PredictionService } from '../services/PredictionService';
import { PredictionController } from '../controllers/predictionController';
import { Authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

const predictionRepo = new PredictionRepository();
const checkInRepo = new CheckInRepository();
const recRepo = new RecommendationRepository();
const alertRepo = new AlertRepository();
const mlService = new MlService();
const recService = new RecommendationService(recRepo);
const alertService = new AlertService(alertRepo);
const predictionService = new PredictionService(
    predictionRepo,
    mlService,
    recService,
    alertService,
    checkInRepo
);
const predictionController = new PredictionController(predictionService);

router.get('/latest', Authenticate, predictionController.getLatest);
router.get('/history', Authenticate, predictionController.getHistory);
router.post('/whatif', Authenticate, authorize(['Developer']), predictionController.runWhatIf);
router.post('/trigger', Authenticate, authorize(['Developer']), predictionController.triggerManual);

router.get('/:id', Authenticate, predictionController.getById);

export default router;