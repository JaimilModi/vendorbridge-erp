import { Router } from 'express';
import { QuotationController } from '../controllers/quotation.controller';
import { validateQuotation } from '../validators/quotation.validator';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize(['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER']), QuotationController.getAll);
router.get('/:id', authenticate, authorize(['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER']), QuotationController.getById);
router.post('/', authenticate, authorize(['VENDOR', 'ADMIN']), validateQuotation, QuotationController.create);
router.put('/:id', authenticate, authorize(['VENDOR', 'ADMIN']), validateQuotation, QuotationController.update);
router.delete('/:id', authenticate, authorize(['VENDOR', 'ADMIN']), QuotationController.delete);

export default router;

