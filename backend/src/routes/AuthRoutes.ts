import { Router } from 'express';
import { UserRepository } from '../repositories/UserRepository';
import { AuthService } from '../services/AuthService';
import { AuthController } from '../controllers/AuthController';
import { Authenticate } from '../middleware/Authenticate';

const router = Router();
const userRepo = new UserRepository();
const authService = new AuthService(userRepo);
const authController = new AuthController(authService);

router.post('/', authController.register);
router.post('/login', authController.login);
router.get('/me', Authenticate, authController.me);

export default router;
