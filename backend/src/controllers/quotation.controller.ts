import { Response, NextFunction } from 'express';
import { QuotationService } from '../services/quotation.service';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/db';

export class QuotationController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quotations = await QuotationService.getAll();
      return res.status(200).json(quotations);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const quotation = await QuotationService.getById(req.params.id);
      if (!quotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }
      return res.status(200).json(quotation);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      const vendorId = user?.vendorId || req.body.vendorId;

      if (!vendorId) {
        return res.status(400).json({ message: 'User is not associated with a Vendor' });
      }

      const quotation = await QuotationService.create(vendorId, req.body);
      return res.status(201).json(quotation);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const quotation = await QuotationService.updateStatus(req.params.id, status);
      return res.status(200).json(quotation);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
