import { Request, Response, NextFunction } from 'express';
import { TermsTemplateService } from '../services/termsTemplate.service';

export class TermsTemplateController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        country_id: req.query.country_id ? Number(req.query.country_id) : undefined,
        project_type_id: req.query.project_type_id ? Number(req.query.project_type_id) : undefined,
        discipline_id: req.query.discipline_id ? Number(req.query.discipline_id) : undefined,
      };

      const templates = await TermsTemplateService.getAll(filters);
      res.json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const template = await TermsTemplateService.getById(id);
      res.json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip;

      const template = await TermsTemplateService.create(req.body, userId, ipAddress);
      res.status(201).json({ success: true, message: 'Terms Template created successfully', data: template });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip;

      const template = await TermsTemplateService.update(id, req.body, userId, ipAddress);
      res.json({ success: true, message: 'Terms Template updated successfully', data: template });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip;

      await TermsTemplateService.delete(id, userId, ipAddress);
      res.json({ success: true, message: 'Terms Template deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
