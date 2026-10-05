import { Request, Response, NextFunction } from 'express';
import { PlanningService } from '../services/planning.service';

export class PlanningController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status ? String(req.query.status) : undefined,
        customer_id: req.query.customer_id ? Number(req.query.customer_id) : undefined,
        quotation_id: req.query.quotation_id ? Number(req.query.quotation_id) : undefined,
      };
      const plans = await PlanningService.getAll(filters);
      res.json({ success: true, data: plans });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const plan = await PlanningService.getById(id);
      if (!plan) return res.status(404).json({ success: false, message: 'Planning not found' });
      res.json({ success: true, data: plan });
    } catch (err) {
      next(err);
    }
  }

  static async createFromQuotation(req: Request, res: Response, next: NextFunction) {
    try {
      const quotationId = Number(req.params.quotationId);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip || '127.0.0.1';

      const result = await PlanningService.createFromQuotation(quotationId, userId, ipAddress);
      res.status(201).json({ success: true, message: 'Planning initialized from quotation', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async saveDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip || '127.0.0.1';

      const result = await PlanningService.saveDraft(id, req.body, userId, ipAddress);
      res.json({ success: true, message: 'Planning draft saved successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await PlanningService.validatePlanning(id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip || '127.0.0.1';

      const result = await PlanningService.submitPlanning(id, userId, ipAddress);
      res.json({ success: true, message: 'Planning submitted for review', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip || '127.0.0.1';

      const result = await PlanningService.approvePlanning(id, userId, ipAddress);
      res.json({
        success: true,
        message: result.action === 'created' ? 'Planning approved and new project created' : 'Planning approved and existing project updated',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const { rejection_reason } = req.body;
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip || '127.0.0.1';

      if (!rejection_reason || !rejection_reason.trim()) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required' });
      }

      const result = await PlanningService.rejectPlanning(id, rejection_reason, userId, ipAddress);
      res.json({ success: true, message: 'Planning rejected', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async calculate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const result = await PlanningService.calculateSchedule(id);
      res.json({ success: true, message: 'Schedule recalculated successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  static async applyQuotationChanges(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip || '127.0.0.1';

      const result = await PlanningService.applyQuotationChanges(id, userId, ipAddress);
      res.json({ success: true, message: 'Quotation changes applied to planning', data: result });
    } catch (err) {
      next(err);
    }
  }
}
