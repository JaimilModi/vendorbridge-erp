import { Request, Response, NextFunction } from 'express';

export const validateRFQ = (req: Request, res: Response, next: NextFunction) => {
  const { title, deadline, items } = req.body;
  if (!title || !deadline || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Title, deadline, and at least one item are required' });
  }
  next();
};
