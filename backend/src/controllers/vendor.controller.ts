import { Request, Response, NextFunction } from 'express';
import { VendorService } from '../services/vendor.service';

export class VendorController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const vendors = await VendorService.getAll();
      return res.status(200).json(vendors);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await VendorService.getById(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      return res.status(200).json(vendor);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await VendorService.create(req.body);
      return res.status(201).json(vendor);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const vendor = await VendorService.update(req.params.id, req.body);
      return res.status(200).json(vendor);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await VendorService.delete(req.params.id);
      return res.status(200).json({ message: 'Vendor deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
