import { Request, Response, NextFunction } from 'express';

export const validateVendor = (req: Request, res: Response, next: NextFunction) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Vendor name and email are required' });
  }
  next();
};
