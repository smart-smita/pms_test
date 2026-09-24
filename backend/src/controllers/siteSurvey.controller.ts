import { Request, Response, NextFunction } from 'express';
import { SiteSurveyService } from '../services/siteSurvey.service';

export class SiteSurveyController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        project_id: req.query.project_id ? Number(req.query.project_id) : undefined,
        customer_id: req.query.customer_id ? Number(req.query.customer_id) : undefined,
        discipline_id: req.query.discipline_id ? Number(req.query.discipline_id) : undefined,
        status: req.query.status ? String(req.query.status) : undefined,
      };

      const surveys = await SiteSurveyService.getAll(filters);
      res.json({ success: true, data: surveys });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const survey = await SiteSurveyService.getById(id);
      res.json({ success: true, data: survey });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip;
      const { photos, ...surveyData } = req.body;

      if (!surveyData.conducted_by && userId) {
        surveyData.conducted_by = userId;
      }

      const survey = await SiteSurveyService.create(surveyData, photos || [], userId, ipAddress);
      res.status(201).json({ success: true, message: 'Site survey recorded successfully', data: survey });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip;
      const { photos, ...surveyData } = req.body;

      const survey = await SiteSurveyService.update(id, surveyData, photos, userId, ipAddress);
      res.json({ success: true, message: 'Site survey updated successfully', data: survey });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id;
      const ipAddress = req.ip;

      await SiteSurveyService.delete(id, userId, ipAddress);
      res.json({ success: true, message: 'Site survey deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async downloadPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const survey = await SiteSurveyService.getById(id);
      if (!survey) {
        return res.status(404).json({ success: false, message: 'Site Survey not found' });
      }
      const { generateSiteSurveyPDF } = await import('../utils/pdfGenerator');
      generateSiteSurveyPDF(survey, res);
    } catch (err) {
      next(err);
    }
  }
}
