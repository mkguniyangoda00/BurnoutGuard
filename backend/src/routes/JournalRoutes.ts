import { Router } from 'express';
import { JournalRepository } from '../repositories/JournalRepository';
import { JournalService } from '../services/JournalService';
import { JournalController } from '../controllers/JournalController';
import { Authenticate } from '../middleware/authenticate';

const router = Router();
const journalRepo = new JournalRepository();
const journalService = new JournalService(journalRepo);
const journalController = new JournalController(journalService);

router.post('/', Authenticate, journalController.create);
router.get('/', Authenticate, journalController.getHistory);
router.get('/:id', Authenticate, journalController.getById);

export default router;