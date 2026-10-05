import { Request, Response } from 'express';
import { MaterialService } from '../services/material.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class MaterialController {
  private svc = new MaterialService();

  // ── Master ─────────────────────────────────────────────────────────────
  getMaterials = async (req: Request, res: Response) => {
    try {
      const data = await this.svc.getMaterials(req.query);
      return sendSuccess(res, 'Materials retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  getMaterialById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = await this.svc.getMaterialById(id);
      return sendSuccess(res, 'Material details', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 404);
    }
  };

  createMaterial = async (req: Request, res: Response) => {
    try {
      const id = await this.svc.createMaterial(req.body);
      return sendSuccess(res, 'Material created successfully', { material_id: id }, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateMaterial = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const ok = await this.svc.updateMaterial(id, req.body);
      if (!ok) return sendError(res, 'Material not found or no changes made', [], 400);
      return sendSuccess(res, 'Material updated successfully');
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  deleteMaterial = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      await this.svc.deleteMaterial(id);
      return sendSuccess(res, 'Material deleted successfully');
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Quotations ─────────────────────────────────────────────────────────
  getQuotations = async (req: Request, res: Response) => {
    try {
      const data = await this.svc.getQuotations(req.query);
      return sendSuccess(res, 'Material quotations retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  getQuotationById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = await this.svc.getQuotationById(id);
      return sendSuccess(res, 'Quotation details', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 404);
    }
  };

  createQuotation = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.employee_id || 1;
      const id = await this.svc.createQuotation({ ...req.body, created_by: userId });
      return sendSuccess(res, 'Material quotation created successfully', { quotation_id: id }, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateQuotationStatus = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      await this.svc.updateQuotationStatus(id, status);
      return sendSuccess(res, `Quotation status updated to ${status}`);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Surveys ────────────────────────────────────────────────────────────
  getSurveys = async (req: Request, res: Response) => {
    try {
      const data = await this.svc.getSurveys(req.query);
      return sendSuccess(res, 'Material surveys retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  getSurveyById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = await this.svc.getSurveyById(id);
      return sendSuccess(res, 'Survey details', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 404);
    }
  };

  createSurvey = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.employee_id || 1;
      const id = await this.svc.createSurvey({ ...req.body, created_by: userId });
      return sendSuccess(res, 'Material survey created successfully', { survey_id: id }, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateSurveyStatus = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      await this.svc.updateSurveyStatus(id, status);
      return sendSuccess(res, `Survey status updated to ${status}`);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Reports ────────────────────────────────────────────────────────────
  getProjectMaterialReport = async (req: Request, res: Response) => {
    try {
      const pId = req.query.project_id ? Number(req.query.project_id) : undefined;
      const data = await this.svc.getProjectMaterialReport(pId);
      return sendSuccess(res, 'Project material report generated', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  getProjectCostSummary = async (req: Request, res: Response) => {
    try {
      const pId = Number(req.params.projectId || req.query.project_id);
      if (!pId) return sendError(res, 'Project ID required', [], 400);
      const data = await this.svc.getProjectCostSummary(pId);
      return sendSuccess(res, 'Project cost summary generated', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  // ── Project Materials (Material WBS Tracking) ───────────────────────────
  getProjectMaterials = async (req: Request, res: Response) => {
    try {
      const data = await this.svc.getProjectMaterials(req.query);
      return sendSuccess(res, 'Project materials retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  getProjectMaterialById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = await this.svc.getProjectMaterialById(id);
      if (!data) return sendError(res, 'Record not found', [], 404);
      return sendSuccess(res, 'Project material details', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  createProjectMaterial = async (req: Request, res: Response) => {
    try {
      const { project_id, wbs_id, material_name } = req.body;
      if (!project_id || !wbs_id || !material_name) {
        return sendError(res, 'project_id, wbs_id, and material_name are required', [], 400);
      }
      const id = await this.svc.createProjectMaterial(req.body);
      return sendSuccess(res, 'Project material created', { id }, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateProjectMaterial = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const ok = await this.svc.updateProjectMaterial(id, req.body);
      if (!ok) return sendError(res, 'Record not found or not modified', [], 400);
      return sendSuccess(res, 'Project material updated');
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  deleteProjectMaterial = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      await this.svc.deleteProjectMaterial(id);
      return sendSuccess(res, 'Project material deleted');
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  logProjectMaterialAction = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      await this.svc.logProjectMaterialAction(id, req.body);
      return sendSuccess(res, `Material ${req.body.action_type || 'action'} logged successfully`);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  getProjectMaterialLogs = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = await this.svc.getProjectMaterialLogs(id);
      return sendSuccess(res, 'Material logs retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };
}

