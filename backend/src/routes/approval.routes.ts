import { Router } from 'express';
import { ApprovalController } from '../controllers/approval.controller';
import { validateApproval } from '../validators/approval.validator';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, ApprovalController.getAll);
router.get('/:id', authenticate, ApprovalController.getById);
router.post('/', authenticate, authorize(['MANAGER', 'ADMIN']), validateApproval, ApprovalController.create);

export default router;
