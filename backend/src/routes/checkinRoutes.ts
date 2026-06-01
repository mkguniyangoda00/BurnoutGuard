import { Router } from 'express';
import { submitCheckin, getUserCheckins } from '../controllers/checkinController';

const router = Router();

// POST /api/checkins
router.post('/', submitCheckin);

// GET /api/checkins/user/:userId
router.get('/user/:userId', getUserCheckins);

export default router;
