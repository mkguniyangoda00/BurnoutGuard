import { Router } from 'express';
import { ResourceRepository } from '../repositories/ResourceRepository';
import { ResourceService } from '../services/ResourceService';
import { ResourceController } from '../controllers/ResourceController';
import { Authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();
const resourceRepo = new ResourceRepository();
const resourceService = new ResourceService(resourceRepo);
const resourceController = new ResourceController(resourceService);

// All authenticated roles can browse active resources
router.get('/', Authenticate, resourceController.getActive);

// Admin/ResearchAdmin only: full management CRUD
router.get('/all', Authenticate, authorize(['Admin', 'ResearchAdmin']), resourceController.getAll);
router.post('/', Authenticate, authorize(['Admin', 'ResearchAdmin']), resourceController.create);
router.put('/:id', Authenticate, authorize(['Admin', 'ResearchAdmin']), resourceController.update);
router.delete('/:id', Authenticate, authorize(['Admin', 'ResearchAdmin']), resourceController.delete);

export default router;