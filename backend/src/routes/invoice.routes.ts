import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// GET ALL
router.get(
  '/',
  authenticate,
  authorize(['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER']),
  InvoiceController.getAll
);

// GENERATE INVOICE
router.post(
  '/generate/:poId',
  authenticate,
  authorize(['PROCUREMENT_OFFICER', 'ADMIN']),
  InvoiceController.generate
);

// UPDATE STATUS
router.put(
  '/:id/status',
  authenticate,
  authorize(['PROCUREMENT_OFFICER', 'ADMIN']),
  InvoiceController.updateStatus
);

// GET BY ID (KEEP LAST)
router.get(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER']),
  InvoiceController.getById
);

export default router;
