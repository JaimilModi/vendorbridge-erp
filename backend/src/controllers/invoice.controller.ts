import { Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { AuthRequest } from '../middleware/auth';

export class InvoiceController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoices = await InvoiceService.getAll(req.user?.role, req.user?.userId);
      return res.status(200).json(invoices);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const invoice = await InvoiceService.getById(req.params.id, req.user?.role, req.user?.userId);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      return res.status(200).json(invoice);
    } catch (error: any) {
      return res.status(error.message.includes('Access denied') ? 403 : 500).json({ message: error.message });
    }
  }

  static async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { dueDate } = req.body;
      if (!dueDate) {
        return res.status(400).json({ message: 'Due date is required to generate an invoice' });
      }

      const invoice = await InvoiceService.generate(req.params.poId, dueDate);
      return res.status(201).json(invoice);
    } catch (error: any) {
      return res.status(error.message.includes('not found') ? 404 : 400).json({ message: error.message });
    }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      if (!['DRAFT', 'SENT', 'PAID', 'OVERDUE'].includes(status)) {
        return res.status(400).json({ message: 'Invalid Invoice status value' });
      }

      const invoice = await InvoiceService.updateStatus(req.params.id, status);
      return res.status(200).json(invoice);
    } catch (error: any) {
      return res.status(error.message.includes('not found') ? 404 : 400).json({ message: error.message });
    }
  }
}

