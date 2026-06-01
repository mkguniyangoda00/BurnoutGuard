import { Router } from 'express';
import { getMyRisk, simulateRisk } from '../controllers/predictionController';

const router = Router();

// GET /api/predictions/my-risk/:userId
router.get('/my-risk/:userId', getMyRisk);

// POST /api/predictions/simulate
router.post('/simulate', simulateRisk);

export default router;
