import { Request, Response, NextFunction } from 'express';

export const validateQuotation = (req: Request, res: Response, next: NextFunction) => {
  const { rfqId, validityDate, items } = req.body;
  if (!rfqId || !validityDate || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'rfqId, validityDate, and items are required' });
  }
  next();
};
