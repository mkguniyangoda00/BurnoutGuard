import { Router } from 'express';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { MlService } from '../services/MlService';
import { CheckInService } from '../services/CheckInService';
import { CheckInController } from '../controllers/CheckInController';
import { Authenticate } from '../middleware/Authenticate';
import { authorize } from '../middleware/Authorize';

import { PredictionRepository } from '../repositories/PredictionRepository';
import { RecommendationRepository } from '../repositories/RecommendationRepository';
import { AlertRepository } from '../repositories/AlertRepository';
import { RecommendationService } from '../services/RecommendationService';
import { AlertService } from '../services/AlertService';
import { PredictionService } from '../services/PredictionService';

import { ReportRepository } from '../repositories/ReportRepository';
import { ReportService } from '../services/ReportService';

const router = Router();
const checkInRepo = new CheckInRepository();
const mlService = new MlService();

const predictionRepo = new PredictionRepository();
const recRepo = new RecommendationRepository();
const alertRepo = new AlertRepository();
const recService = new RecommendationService(recRepo);
const alertService = new AlertService(alertRepo);
const predictionService = new PredictionService(predictionRepo, mlService, recService, alertService);

const reportRepo = new ReportRepository();
const reportService = new ReportService(reportRepo, checkInRepo);

const checkInService = new CheckInService(checkInRepo, mlService, predictionService, reportService);
const checkInController = new CheckInController(checkInService);

router.post('/', Authenticate, authorize(['Developer']), checkInController.submit);
router.get('/history', Authenticate, checkInController.getHistory);
router.get('/streak', Authenticate, checkInController.getStreak);
router.put('/:id', Authenticate, authorize(['Developer']), checkInController.editToday);

export default router;
