import { Router } from 'express';
import { Authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { FactorAnalysisService } from '../services/FactorAnalysisService';
import { InsightGeneratorService } from '../services/InsightGeneratorService';
import { AdminService } from '../services/AdminService';
import { UserRepository } from '../repositories/UserRepository';

const router = Router();
const factorService = new FactorAnalysisService();
const insightService = new InsightGeneratorService(factorService, new AdminService(new UserRepository()));

router.get('/insights', Authenticate, authorize(['Admin', 'ResearchAdmin']), async (_req, res, next) => {
  try {
    const insights = await insightService.generateInsights();
    res.status(200).json({ insights });
  } catch (err) {
    next(err);
  }
});

export default router;
