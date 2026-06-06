import { Request, Response, NextFunction } from 'express';

export const validateInvoice = (req: Request, res: Response, next: NextFunction) => {
  const { invoiceNumber, poId, vendorId, dueDate, items } = req.body;
  if (!invoiceNumber || !poId || !vendorId || !dueDate || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'invoiceNumber, poId, vendorId, dueDate, and items are required' });
  }
  next();
};
