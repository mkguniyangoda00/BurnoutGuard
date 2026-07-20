import { Router } from 'express';
import { AdminService } from '../services/AdminService';
import { AdminController } from '../controllers/AdminController';
import { UserRepository } from '../repositories/UserRepository';
import { Authenticate } from '../middleware/Authenticate';
import { authorize } from '../middleware/Authorize';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuditLogService } from '../services/AuditLogService';

const router = Router();
const userRepo = new UserRepository();
const adminService = new AdminService(userRepo);
const adminController = new AdminController(adminService);
const auditLogService = new AuditLogService(new AuditLogRepository());

router.use(Authenticate);
router.use(authorize(['Admin', 'ResearchAdmin']));

router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateRole);
router.put('/users/:id/deactivate', adminController.deactivateUser);
router.get('/models', adminController.getModelMetrics);
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
