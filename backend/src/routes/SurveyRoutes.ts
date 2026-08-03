import { Router } from 'express';
import { SurveyQuestionRepository } from '../repositories/SurveyQuestionRepository';
import { SurveyQuestionService } from '../services/SurveyQuestionService';
import { SurveyQuestionController } from '../controllers/SurveyQuestionController';
import { Authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();
const repo = new SurveyQuestionRepository();
const service = new SurveyQuestionService(repo);
const controller = new SurveyQuestionController(service);

router.get('/', Authenticate, controller.getActive);
router.get('/all', Authenticate, authorize(['Admin', 'ResearchAdmin']), controller.getAll);
router.post('/', Authenticate, authorize(['Admin', 'ResearchAdmin']), controller.create);
router.put('/:id', Authenticate, authorize(['Admin', 'ResearchAdmin']), controller.update);
router.delete('/:id', Authenticate, authorize(['Admin', 'ResearchAdmin']), controller.delete);

export default router;