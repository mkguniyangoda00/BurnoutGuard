import { Router } from 'express';
import { AdminService } from '../services/AdminService';
import { AdminController } from '../controllers/AdminController';
import { UserRepository } from '../repositories/UserRepository';
import { Authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();
const userRepo = new UserRepository();
const adminService = new AdminService(userRepo);
const adminController = new AdminController(adminService);

router.use(Authenticate);
router.use(authorize(['Admin', 'ResearchAdmin']));

router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateRole);
router.put('/users/:id/deactivate', adminController.deactivateUser);
router.get('/models', adminController.getModelMetrics);

export default router;
