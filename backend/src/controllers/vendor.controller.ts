import { Request, Response } from 'express';
import { VendorService } from '../services/vendor.service';

const service = new VendorService();

export class VendorController {
  async getAll(req: Request, res: Response) {
    try {
      const { vendor_type, status, search } = req.query;
      const data = await service.getAll({
        vendor_type: vendor_type as string,
        status: status as string,
        search: search as string
      });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await service.getById(id);
      if (!data) return res.status(404).json({ success: false, message: 'Vendor not found' });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.employee_id || 1;
      const ip = req.ip || '127.0.0.1';
      const created = await service.create(req.body, userId, ip);
      res.status(201).json({ success: true, message: 'Vendor created successfully', data: created });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = (req as any).user?.employee_id || 1;
      const ip = req.ip || '127.0.0.1';
      const updated = await service.update(id, req.body, userId, ip);
      res.json({ success: true, message: 'Vendor updated successfully', data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = (req as any).user?.employee_id || 1;
      const ip = req.ip || '127.0.0.1';
      await service.delete(id, userId, ip);
      res.json({ success: true, message: 'Vendor deactivated successfully' });
    } catch (err: any) {
      const status = err.message.includes('Cannot delete') ? 409 : 400;
      res.status(status).json({ success: false, message: err.message });
    }
  }
}
