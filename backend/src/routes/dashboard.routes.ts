import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/analytics', authenticate, DashboardController.getAnalytics);

export default router;
