import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/db';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role, companyName, vendorEmail, phone, gstNumber, address } = req.body;
      const result = await AuthService.register({
        email,
        passwordHash: password,
        firstName,
        lastName,
        role,
        companyName,
        vendorEmail,
        phone,
        gstNumber,
        address,
      });
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, passwordHash: password });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, vendorId: true }
      });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json(user);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
