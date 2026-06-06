import { Response, NextFunction } from 'express';
import { ApprovalService } from '../services/approval.service';
import { AuthRequest } from '../middleware/auth';

export class ApprovalController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const approvals = await ApprovalService.getAll(req.user?.role, req.user?.userId);
      return res.status(200).json(approvals);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const approval = await ApprovalService.getById(req.params.id, req.user?.role, req.user?.userId);
      if (!approval) {
        return res.status(404).json({ message: 'Approval record not found' });
      }
      return res.status(200).json(approval);
    } catch (error: any) {
      return res.status(error.message.includes('Access denied') ? 403 : 500).json({ message: error.message });
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const approval = await ApprovalService.create(req.user.userId, req.body);
      return res.status(201).json(approval);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
