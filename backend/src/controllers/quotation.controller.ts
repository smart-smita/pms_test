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

  /**
   * POST /quotations/:id/create-project
   * Creates a project from an approved quotation (Customer → Quotation → Project gate).
   */
  static async createProjectFromQuotation(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip;
      const { project_code, project_name, project_address, project_type_id, radius_meters } = req.body;

      if (!project_code) {
        return res.status(400).json({ success: false, message: 'project_code is required' });
      }

      const result = await QuotationService.createProjectFromQuotation(
        id,
        { project_code, project_name, project_address, project_type_id, radius_meters },
        userId,
        ipAddress
      );
      res.status(201).json({ success: true, message: 'Project created from quotation', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip;

      const quotation = await QuotationService.getById(id);
      if (!quotation) {
        return res.status(404).json({ success: false, message: 'Quotation not found' });
      }

      // Log audit dispatch
      try {
        const { AuditService } = await import('../services/audit.service');
        await AuditService.log({
          user_id: userId,
          action: 'SEND_QUOTATION_EMAIL',
          module: 'quotations',
          record_id: id,
          description: `Sent quotation ${quotation.quotation_code} via email to ${quotation.customer_email || quotation.customer_name}`,
          ip_address: ipAddress,
        });
      } catch (e) {
        console.error('Audit log failed for sendEmail:', e);
      }

      res.json({
        success: true,
        message: `Quotation ${quotation.quotation_code} sent via email successfully to ${quotation.customer_email || quotation.customer_name || 'customer'}!`,
        data: quotation,
      });
    } catch (err) {
      next(err);
    }
  }
}
