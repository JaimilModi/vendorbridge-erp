import { Router } from 'express';
import { PurchaseOrderController } from '../controllers/purchaseOrder.controller';
import { validatePurchaseOrder } from '../validators/purchaseOrder.validator';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, PurchaseOrderController.getAll);
router.get('/:id', authenticate, PurchaseOrderController.getById);
router.post('/', authenticate, authorize(['PROCUREMENT_OFFICER', 'ADMIN']), validatePurchaseOrder, PurchaseOrderController.create);
router.patch('/:id/status', authenticate, authorize(['ADMIN', 'PROCUREMENT_OFFICER', 'MANAGER']), PurchaseOrderController.updateStatus);

export default router;
