import { Router } from 'express';
import { RFQController } from '../controllers/rfq.controller';
import { validateRFQ } from '../validators/rfq.validator';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, RFQController.getAll);
router.get('/:id', authenticate, RFQController.getById);
router.post('/', authenticate, authorize(['ADMIN', 'PROCUREMENT_OFFICER']), validateRFQ, RFQController.create);
router.put('/:id', authenticate, authorize(['ADMIN', 'PROCUREMENT_OFFICER']), validateRFQ, RFQController.update);
router.delete('/:id', authenticate, authorize(['ADMIN', 'PROCUREMENT_OFFICER']), RFQController.delete);

export default router;
