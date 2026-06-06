import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRegister, validateLogin } from '../validators/auth.validator';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.get('/me', authenticate, AuthController.me);

export default router;
