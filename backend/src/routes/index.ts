import { Router } from 'express';
import authRoutes from './auth.routes';
import vendorRoutes from './vendor.routes';
import rfqRoutes from './rfq.routes';
import quotationRoutes from './quotation.routes';
import approvalRoutes from './approval.routes';
import purchaseOrderRoutes from './purchaseOrder.routes';
import invoiceRoutes from './invoice.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vendors', vendorRoutes);
router.use('/rfqs', rfqRoutes);
router.use('/quotations', quotationRoutes);
router.use('/approvals', approvalRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/invoices', invoiceRoutes);

export default router;
