import { Request, Response } from 'express';
import { MasterService } from '../services/master.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class MasterController {
  private svc = new MasterService();

  // ── Countries ────────────────────────────────────────────────────────────
  getCountries = async (_req: Request, res: Response) => {
    try {
      const data = await this.svc.getCountries();
      return sendSuccess(res, 'Countries retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  // ── Nationalities ─────────────────────────────────────────────────────────
  getNationalities = async (req: Request, res: Response) => {
    try {
      const countryId = req.query.country_id ? Number(req.query.country_id) : undefined;
      const data = await this.svc.getNationalities(countryId);
      return sendSuccess(res, 'Nationalities retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  // ── Communities ───────────────────────────────────────────────────────────
  getCommunities = async (req: Request, res: Response) => {
    try {
      const countryId = req.query.country_id ? Number(req.query.country_id) : undefined;
      const data = await this.svc.getCommunities(countryId);
      return sendSuccess(res, 'Communities retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  createCommunity = async (req: Request, res: Response) => {
    try {
      const { community_name, country_id, state } = req.body;
      if (!community_name?.trim()) return sendError(res, 'Community name is required', [], 400);
      const data = await this.svc.createCommunity(community_name, country_id || null, state || null);
      return sendSuccess(res, 'Community created', data, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Project Types ─────────────────────────────────────────────────────────
  getProjectTypes = async (req: Request, res: Response) => {
    try {
      const all = req.query.all === 'true';
      const data = all ? await this.svc.getAllProjectTypes() : await this.svc.getProjectTypes();
      return sendSuccess(res, 'Project types retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  createProjectType = async (req: Request, res: Response) => {
    try {
      const data = await this.svc.createProjectType(req.body);
      return sendSuccess(res, 'Project type created', data, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateProjectType = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await this.svc.updateProjectType(id, req.body);
      if (!result) return sendError(res, 'Project type not found', [], 404);
      return sendSuccess(res, 'Project type updated', result);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Document Types ────────────────────────────────────────────────────────
  getDocumentTypes = async (req: Request, res: Response) => {
    try {
      const appliesTo = req.query.applies_to as string | undefined;
      const countryId = req.query.country_id ? Number(req.query.country_id) : undefined;
      const data = await this.svc.getDocumentTypes(appliesTo, countryId);
      return sendSuccess(res, 'Document types retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  createDocumentType = async (req: Request, res: Response) => {
    try {
      const data = await this.svc.createDocumentType(req.body);
      return sendSuccess(res, 'Document type created', data, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateDocumentType = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const ok = await this.svc.updateDocumentType(id, req.body);
      if (!ok) return sendError(res, 'Document type not found', [], 404);
      return sendSuccess(res, 'Document type updated');
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Disciplines ───────────────────────────────────────────────────────────
  getDisciplines = async (req: Request, res: Response) => {
    try {
      const all = req.query.all === 'true';
      const data = all ? await this.svc.getAllDisciplines() : await this.svc.getDisciplines();
      return sendSuccess(res, 'Disciplines retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  createDiscipline = async (req: Request, res: Response) => {
    try {
      const data = await this.svc.createDiscipline(req.body);
      return sendSuccess(res, 'Discipline created', data, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateDiscipline = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await this.svc.updateDiscipline(id, req.body);
      if (!result) return sendError(res, 'Discipline not found', [], 404);
      return sendSuccess(res, 'Discipline updated', result);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Currencies ────────────────────────────────────────────────────────────
  getCurrencies = async (req: Request, res: Response) => {
    try {
      const all = req.query.all === 'true';
      const data = all ? await this.svc.getAllCurrencies() : await this.svc.getCurrencies();
      return sendSuccess(res, 'Currencies retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  createCurrency = async (req: Request, res: Response) => {
    try {
      const data = await this.svc.createCurrency(req.body);
      return sendSuccess(res, 'Currency created', data, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateCurrency = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await this.svc.updateCurrency(id, req.body);
      if (!result) return sendError(res, 'Currency not found', [], 404);
      return sendSuccess(res, 'Currency updated', result);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Taxes ─────────────────────────────────────────────────────────────────
  getTaxes = async (req: Request, res: Response) => {
    try {
      const all = req.query.all === 'true';
      const data = all ? await this.svc.getAllTaxes() : await this.svc.getTaxes();
      return sendSuccess(res, 'Taxes retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  createTax = async (req: Request, res: Response) => {
    try {
      const data = await this.svc.createTax(req.body);
      return sendSuccess(res, 'Tax created', data, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateTax = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await this.svc.updateTax(id, req.body);
      if (!result) return sendError(res, 'Tax not found', [], 404);
      return sendSuccess(res, 'Tax updated', result);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };
}

