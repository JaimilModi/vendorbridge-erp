import { Request, Response, NextFunction } from 'express';

export const validatePurchaseOrder = (req: Request, res: Response, next: NextFunction) => {
  const { poNumber, quotationId, vendorId, items } = req.body;
  if (!poNumber || !quotationId || !vendorId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'poNumber, quotationId, vendorId, and items are required' });
  }
  next();
};
