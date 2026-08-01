import { Router } from 'express';
import { AdminService } from '../services/AdminService';
import { AdminController } from '../controllers/AdminController';
import { UserRepository } from '../repositories/UserRepository';
import { Authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogService } from '../services/AuditLogService';
import { ResearchService } from '../services/ResearchService'; 
import { AlertThresholdRepository } from '../repositories/AlertThresholdRepository';
import { AlertThresholdService } from '../services/AlertThresholdService';
import { AlertThresholdController } from '../controllers/AlertThresholdController';

const router = Router();
const userRepo = new UserRepository();
const adminService = new AdminService(userRepo);
const researchService = new ResearchService();
const auditLogService = new AuditLogService(new AuditLogRepository());
const adminController = new AdminController(adminService, researchService, auditLogService);
const thresholdService = new AlertThresholdService(new AlertThresholdRepository());
const thresholdController = new AlertThresholdController(thresholdService);


router.use(Authenticate);
router.use(authorize(['Admin', 'ResearchAdmin']));

router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateRole);
router.put('/users/:id/deactivate', adminController.deactivateUser);
router.get('/models', adminController.getModelMetrics);
router.get('/export', adminController.exportDataset);
router.post('/models/retrain', authorize(['Admin', 'ResearchAdmin']), adminController.retrainModel);
router.get('/alert-thresholds', authorize(['Admin']), thresholdController.getAll);
router.post('/alert-thresholds', authorize(['Admin']), thresholdController.create);
router.put('/alert-thresholds/:key', authorize(['Admin']), thresholdController.update);
router.delete('/alert-thresholds/:key', authorize(['Admin']), thresholdController.delete);
router.get('/audit', async (req: any, res: any, next: any) => {
  try {
    const { from, to } = req.query;
    let logs;
    if (from && to) {
      logs = await auditLogService.getByDateRange(new Date(from as string), new Date(to as string));
    } else {
      logs = await auditLogService.getAll(100);
    }
    res.status(200).json({ logs });
  } catch (err) {
    next(err);
  }
});

export default router;
