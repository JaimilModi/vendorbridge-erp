import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { validateInvoice } from '../validators/invoice.validator';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, InvoiceController.getAll);
router.get('/:id', authenticate, InvoiceController.getById);
router.post('/', authenticate, authorize(['VENDOR', 'ADMIN']), validateInvoice, InvoiceController.create);
router.patch('/:id/status', authenticate, authorize(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), InvoiceController.updateStatus);

export default router;
