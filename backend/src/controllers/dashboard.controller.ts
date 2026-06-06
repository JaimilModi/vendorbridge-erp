import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  static async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { userId, role } = req.user;
      const analytics = await DashboardService.getAnalytics(userId, role);
      return res.status(200).json(analytics);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
