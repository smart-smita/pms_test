import { Request, Response, NextFunction } from 'express';
import { QuotationService } from '../services/quotation.service';

export class QuotationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        customer_id: req.query.customer_id ? Number(req.query.customer_id) : undefined,
        project_id: req.query.project_id ? Number(req.query.project_id) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
      };

      const quotations = await QuotationService.getAll(filters);
      res.json({ success: true, data: quotations });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const quotation = await QuotationService.getById(id);
      res.json({ success: true, data: quotation });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip;
      const { disciplines, ...quotationData } = req.body;

      const quotation = await QuotationService.create(quotationData, disciplines || [], userId, ipAddress);
      res.status(201).json({ success: true, message: 'Quotation created successfully', data: quotation });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip;
      const { disciplines, ...quotationData } = req.body;

      const quotation = await QuotationService.update(id, quotationData, disciplines, userId, ipAddress);
      res.json({ success: true, message: 'Quotation updated successfully', data: quotation });
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { status, rejection_reason } = req.body;
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip;

      if (!['approved', 'rejected', 'pending_approval'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      const quotation = await QuotationService.updateStatus(id, status, userId, rejection_reason, ipAddress);
      res.json({ success: true, message: `Quotation status updated to ${status}`, data: quotation });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip;

      await QuotationService.delete(id, userId, ipAddress);
      res.json({ success: true, message: 'Quotation deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async downloadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await QuotationService.generatePdf(id, res);
    } catch (err) {
      next(err);
    }
  }
}
