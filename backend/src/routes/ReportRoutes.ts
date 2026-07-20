import { Router } from 'express';
import { ReportRepository } from '../repositories/ReportRepository';
import { CheckInRepository } from '../repositories/CheckInRepository';
import { ReportService } from '../services/ReportService';
import { PdfService } from '../services/PdfService';
import { ReportController } from '../controllers/ReportController';
import { Authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { UserRepository } from '../repositories/UserRepository';

const router = Router();
const reportRepo = new ReportRepository();
const checkInRepo = new CheckInRepository();
const reportService = new ReportService(reportRepo, checkInRepo, new UserRepository());
const pdfService = new PdfService();
const reportController = new ReportController(reportService, pdfService);

router.get('/', Authenticate, reportController.getAll);
router.post('/generate', Authenticate, reportController.generateMine);
router.post('/generate-all', Authenticate, authorize(['Admin']), reportController.triggerManual);
router.get('/:id/pdf', Authenticate, reportController.getPdf);
router.get('/:id', Authenticate, reportController.getById);

export default router;
