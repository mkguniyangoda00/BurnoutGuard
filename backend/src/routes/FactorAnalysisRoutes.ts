import { Router } from 'express';
import { Authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { FactorAnalysisService } from '../services/FactorAnalysisService';
import { FactorAnalysisController } from '../controllers/FactorAnalysisController';
import { InsightGeneratorService } from '../services/InsightGeneratorService';
import { AdminService } from '../services/AdminService';
import { UserRepository } from '../repositories/UserRepository';

const router = Router();
const factorService = new FactorAnalysisService();
const factorController = new FactorAnalysisController(factorService);
const insightService = new InsightGeneratorService(factorService, new AdminService(new UserRepository()));

router.get('/demographic', Authenticate, authorize(['Admin', 'ResearchAdmin', 'HRofficer']), factorController.getDemographicBreakdown);
router.get('/distribution', Authenticate, authorize(['Admin', 'ResearchAdmin']), factorController.getFactorDistribution);
router.get('/interaction', Authenticate, authorize(['Admin', 'ResearchAdmin']), factorController.getInteractionAnalysis);
router.get('/available-factors', Authenticate, authorize(['Admin', 'ResearchAdmin']), factorController.getAvailableFactors);
export default router;
