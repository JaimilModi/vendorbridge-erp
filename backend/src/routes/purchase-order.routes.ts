import { Router } from 'express';
import { PurchaseOrderController } from '../controllers/purchase-order.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize(['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER']), PurchaseOrderController.getAll);
router.get('/:id', authenticate, authorize(['ADMIN', 'PROCUREMENT_OFFICER', 'VENDOR', 'MANAGER']), PurchaseOrderController.getById);
router.post('/generate/:quotationId', authenticate, authorize(['PROCUREMENT_OFFICER', 'ADMIN']), PurchaseOrderController.generate);
router.put('/:id/status', authenticate, authorize(['PROCUREMENT_OFFICER', 'ADMIN']), PurchaseOrderController.updateStatus);

export default router;
