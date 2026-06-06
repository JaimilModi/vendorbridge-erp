import { Response, NextFunction } from 'express';
import { PurchaseOrderService } from '../services/purchaseOrder.service';
import { AuthRequest } from '../middleware/auth';

export class PurchaseOrderController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pos = await PurchaseOrderService.getAll();
      return res.status(200).json(pos);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const po = await PurchaseOrderService.getById(req.params.id);
      if (!po) {
        return res.status(404).json({ message: 'Purchase Order not found' });
      }
      return res.status(200).json(po);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const po = await PurchaseOrderService.create(req.body);
      return res.status(201).json(po);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const po = await PurchaseOrderService.updateStatus(req.params.id, status);
      return res.status(200).json(po);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
