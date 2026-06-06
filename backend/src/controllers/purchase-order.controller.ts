import { Response, NextFunction } from 'express';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { AuthRequest } from '../middleware/auth';

export class PurchaseOrderController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pos = await PurchaseOrderService.getAll(req.user?.role, req.user?.userId);
      return res.status(200).json(pos);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const po = await PurchaseOrderService.getById(req.params.id, req.user?.role, req.user?.userId);
      if (!po) {
        return res.status(404).json({ message: 'Purchase Order not found' });
      }
      return res.status(200).json(po);
    } catch (error: any) {
      return res.status(error.message.includes('Access denied') ? 403 : 500).json({ message: error.message });
    }
  }

  static async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const po = await PurchaseOrderService.generate(req.params.quotationId);
      return res.status(201).json(po);
    } catch (error: any) {
      return res.status(error.message.includes('not found') ? 404 : 400).json({ message: error.message });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      if (!['DRAFT', 'ISSUED', 'COMPLETED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid Purchase Order status value' });
      }

      const po = await PurchaseOrderService.updateStatus(req.params.id, status);
      return res.status(200).json(po);
    } catch (error: any) {
      return res.status(error.message.includes('not found') ? 404 : 400).json({ message: error.message });
    }
  }
}
