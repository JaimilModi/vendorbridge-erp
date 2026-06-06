import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller';
import { validateVendor } from '../validators/vendor.validator';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, VendorController.getAll);
router.get('/:id', authenticate, VendorController.getById);
router.post('/', authenticate, authorize(['ADMIN', 'PROCUREMENT_OFFICER']), validateVendor, VendorController.create);
router.put('/:id', authenticate, authorize(['ADMIN', 'PROCUREMENT_OFFICER']), validateVendor, VendorController.update);
router.delete('/:id', authenticate, authorize(['ADMIN']), VendorController.delete);

export default router;
