import { Router } from 'express';
import { ChatRepository } from '../repositories/ChatRepository';
import { PredictionRepository } from '../repositories/PredictionRepository';
import { ChatService } from '../services/ChatService';
import { ChatController } from '../controllers/ChatController';
import { Authenticate } from '../middleware/authenticate';

const router = Router();
const chatRepo = new ChatRepository();
const predictionRepo = new PredictionRepository();
const chatService = new ChatService(chatRepo, predictionRepo);
const chatController = new ChatController(chatService);

router.get('/', Authenticate, chatController.getHistory);
router.post('/', Authenticate, chatController.sendMessage);

export default router;
