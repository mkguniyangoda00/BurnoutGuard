import { Router } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { PredictionRepository } from '../repositories/PredictionRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { Authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();
const predictionRepo = new PredictionRepository();
const checkInRepo = new CheckInRepository();
const analyticsService = new AnalyticsService(predictionRepo, checkInRepo);
const analyticsController = new AnalyticsController(analyticsService);

router.get('/heatmap', Authenticate, authorize(['Manager', 'Admin']), analyticsController.getTeamHeatmap);
router.get('/department', Authenticate, authorize(['HRofficer', 'Admin']), analyticsController.getDepartmentOverview);
router.get('/sprint', Authenticate, authorize(['Manager', 'Admin']), analyticsController.getSprintRisk);

export default router;
