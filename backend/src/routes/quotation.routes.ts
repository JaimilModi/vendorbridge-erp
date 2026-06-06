import { Router } from 'express';
import { QuotationController } from '../controllers/quotation.controller';
import { validateQuotation } from '../validators/quotation.validator';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, QuotationController.getAll);
router.get('/:id', authenticate, QuotationController.getById);
router.post('/', authenticate, authorize(['VENDOR', 'ADMIN']), validateQuotation, QuotationController.create);
router.patch('/:id/status', authenticate, authorize(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), QuotationController.updateStatus);

export default router;
