import { Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { AuthRequest } from '../middleware/auth';

export class InvoiceController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoices = await InvoiceService.getAll();
      return res.status(200).json(invoices);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await InvoiceService.getById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      return res.status(200).json(invoice);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await InvoiceService.create(req.body);
      return res.status(201).json(invoice);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const invoice = await InvoiceService.updateStatus(req.params.id, status);
      return res.status(200).json(invoice);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
