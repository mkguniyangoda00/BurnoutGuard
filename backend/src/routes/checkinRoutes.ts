import { Router } from 'express';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { PredictionRepository } from '../repositories/PredictionRepository';
import { RecommendationRepository } from '../repositories/RecommendationRepository';
import { AlertRepository } from '../repositories/AlertRepository';
import { MlService } from '../services/MlService';
import { RecommendationService } from '../services/RecommendationService';
import { AlertService } from '../services/AlertService';
import { PredictionService } from '../services/PredictionService';
import { CheckInService } from '../services/CheckInService';
import { CheckInController } from '../controllers/checkinController';
import { Authenticate } from '../middleware/authenticate';

const router = Router();

const checkInRepo = new CheckInRepository();
const predictionRepo = new PredictionRepository();
const recRepo = new RecommendationRepository();
const alertRepo = new AlertRepository();
const mlService = new MlService();
const recService = new RecommendationService(recRepo);
const alertService = new AlertService(alertRepo);

// Create CheckInService first
const checkInService = new CheckInService(checkInRepo, mlService);

// Create PredictionService and inject into CheckInService
const predictionService = new PredictionService(predictionRepo, mlService, recService, alertService);
checkInService.setPredictionService(predictionService);

const checkInController = new CheckInController(checkInService);

router.post('/', Authenticate, checkInController.submit);
router.get('/history', Authenticate, checkInController.getHistory);
router.get('/streak', Authenticate, checkInController.getStreak);
router.put('/:id', Authenticate, checkInController.editToday);

export default router;