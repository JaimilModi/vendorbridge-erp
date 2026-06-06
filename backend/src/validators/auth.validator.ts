import { Request, Response, NextFunction } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, firstName, lastName, role } = req.body;
  if (!email || !password || !firstName || !lastName || !role) {
    return res.status(400).json({ message: 'Missing required fields for registration' });
  }
  if (role === 'VENDOR') {
    const { companyName, vendorEmail, phone, gstNumber, address } = req.body;
    if (!companyName || !vendorEmail || !phone || !gstNumber || !address) {
      return res.status(400).json({ message: 'Missing vendor details for VENDOR registration' });
    }
  }
  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  next();
};
