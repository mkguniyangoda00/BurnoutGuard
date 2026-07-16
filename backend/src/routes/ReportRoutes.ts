import { Router } from 'express';
import { ReportRepository } from '../repositories/ReportRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { ReportService } from '../services/ReportService';
import { ReportController } from '../controllers/ReportController';
import { Authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();
const reportRepo = new ReportRepository();
const checkInRepo = new CheckInRepository();
const reportService = new ReportService(reportRepo, checkInRepo);
const reportController = new ReportController(reportService);

router.get('/', Authenticate, reportController.getAll);
router.get('/:id', Authenticate, reportController.getById);
router.post('/generate', Authenticate, authorize(['Admin']), reportController.triggerManual);

export default router;
