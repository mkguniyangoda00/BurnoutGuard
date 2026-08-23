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
router.get('/workload-hotspots', Authenticate, authorize(['Manager', 'Admin']), analyticsController.getWorkloadHotspots);
router.get('/overtime-patterns', Authenticate, authorize(['Manager', 'Admin', 'HRofficer']), analyticsController.getOvertimePatterns);
router.get('/org-risk-trend', Authenticate, authorize(['HRofficer', 'Admin']), analyticsController.getOrgRiskTrend);
router.get('/org-lifestyle-trend', Authenticate, authorize(['HRofficer', 'Admin']), analyticsController.getOrgLifestyleTrend);
router.get('/manager-recommendations', Authenticate, authorize(['Manager', 'Admin']), analyticsController.getManagerRecommendationSummary);
router.get('/team-shap-summary', Authenticate, authorize(['Manager', 'Admin']), analyticsController.getTeamShapSummary);
router.post('/team-whatif', Authenticate, authorize(['Manager', 'Admin']), analyticsController.teamWhatIf);
router.get('/fairness', Authenticate, authorize(['Admin', 'ResearchAdmin']), analyticsController.getFairnessReport);
router.get('/heatmap-filters', Authenticate, authorize(['Manager', 'Admin']), analyticsController.getHeatmapFilterOptions);
export default router;
