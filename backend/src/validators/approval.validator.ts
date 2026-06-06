import { Request, Response, NextFunction } from 'express';

export const validateApproval = (req: Request, res: Response, next: NextFunction) => {
  const { quotationId, status } = req.body;
  if (!quotationId || !status) {
    return res.status(400).json({ message: 'quotationId and status are required' });
  }
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Status must be APPROVED or REJECTED' });
  }
  next();
};
