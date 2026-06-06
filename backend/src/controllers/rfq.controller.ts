import { Response, NextFunction } from 'express';
import { RFQService } from '../services/rfq.service';
import { AuthRequest } from '../middleware/auth';

export class RFQController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rfqs = await RFQService.getAll();
      return res.status(200).json(rfqs);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rfq = await RFQService.getById(req.params.id);
      if (!rfq) {
        return res.status(404).json({ message: 'RFQ not found' });
      }
      return res.status(200).json(rfq);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const rfq = await RFQService.create(req.user.userId, req.body);
      return res.status(201).json(rfq);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rfq = await RFQService.update(req.params.id, req.body);
      return res.status(200).json(rfq);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await RFQService.delete(req.params.id);
      return res.status(200).json({ message: 'RFQ deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
