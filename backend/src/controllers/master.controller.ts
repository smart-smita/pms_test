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

  updateCommunity = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { community_name, country_id, state } = req.body;
      if (!community_name?.trim()) return sendError(res, 'Community name is required', [], 400);
      const data = await this.svc.updateCommunity(id, community_name, country_id ?? null, state ?? null);
      return sendSuccess(res, 'Community updated successfully', data);
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
      const countryId = req.query.country_id ? Number(req.query.country_id) : undefined;
      const data = all ? await this.svc.getAllTaxes(countryId) : await this.svc.getTaxes(countryId);
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

  // ── Company Calendar & Holidays ─────────────────────────────────────────────
  getCalendars = async (_req: Request, res: Response) => {
    try {
      const data = await this.svc.getCalendars();
      return sendSuccess(res, 'Calendars retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  createCalendar = async (req: Request, res: Response) => {
    try {
      const data = await this.svc.createCalendar(req.body);
      return sendSuccess(res, 'Calendar created', data, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateCalendar = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await this.svc.updateCalendar(id, req.body);
      return sendSuccess(res, 'Calendar updated', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  getHolidays = async (req: Request, res: Response) => {
    try {
      const calendarId = req.query.calendar_id ? Number(req.query.calendar_id) : undefined;
      const data = await this.svc.getHolidays(calendarId);
      return sendSuccess(res, 'Holidays retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  createHoliday = async (req: Request, res: Response) => {
    try {
      const data = await this.svc.createHoliday(req.body);
      return sendSuccess(res, 'Holiday created', data, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  deleteHoliday = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      await this.svc.deleteHoliday(id);
      return sendSuccess(res, 'Holiday deleted', null);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Number Series ──────────────────────────────────────────────────────────
  getNumberSeries = async (_req: Request, res: Response) => {
    try {
      const { NumberSeriesService } = await import('../services/numberSeries.service');
      const data = await NumberSeriesService.getAllSeries();
      return sendSuccess(res, 'Number series retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  updateNumberSeries = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { NumberSeriesService } = await import('../services/numberSeries.service');
      const success = await NumberSeriesService.updateSeries(id, req.body);
      return sendSuccess(res, 'Number series updated', { success });
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  getNextNumber = async (req: Request, res: Response) => {
    try {
      const code = req.params.seriesCode;
      const { NumberSeriesService } = await import('../services/numberSeries.service');
      const nextNumber = await NumberSeriesService.getNextNumber(code);
      return sendSuccess(res, 'Next number generated', { next_number: nextNumber });
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  // ── Measurement Units ──────────────────────────────────────────────────────
  getUnits = async (_req: Request, res: Response) => {
    try {
      const { MeasurementUnitRepository } = await import('../repositories/measurementUnit.repository');
      const repo = new MeasurementUnitRepository();
      const data = await repo.getAll();
      return sendSuccess(res, 'Measurement units retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  createUnit = async (req: Request, res: Response) => {
    try {
      const { MeasurementUnitRepository } = await import('../repositories/measurementUnit.repository');
      const repo = new MeasurementUnitRepository();
      const data = await repo.create(req.body);
      return sendSuccess(res, 'Measurement unit created', data, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateUnit = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { MeasurementUnitRepository } = await import('../repositories/measurementUnit.repository');
      const repo = new MeasurementUnitRepository();
      const success = await repo.update(id, req.body);
      return sendSuccess(res, 'Measurement unit updated', { success });
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Contractors Master ─────────────────────────────────────────────────────
  getContractors = async (_req: Request, res: Response) => {
    try {
      const { dbPool } = await import('../config/db');
      const [rows] = await dbPool.query(
        `SELECT * FROM vendors WHERE vendor_type = 'contractor' AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY vendor_name ASC`
      );
      return sendSuccess(res, 'Contractors retrieved', rows);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  createContractor = async (req: Request, res: Response) => {
    try {
      const { dbPool } = await import('../config/db');
      const { vendor_code, vendor_name, contact_person, email, phone, address, gst_number, pan_number } = req.body;
      if (!vendor_name?.trim()) return sendError(res, 'Contractor name is required', [], 400);

      const code = vendor_code?.trim() || `CONT-${Date.now().toString().slice(-4)}`;
      const [resHeader]: any = await dbPool.query(
        `INSERT INTO vendors (vendor_code, vendor_name, vendor_type, contact_person, email, phone, address, gst_number, pan_number, status)
         VALUES (?, ?, 'contractor', ?, ?, ?, ?, ?, ?, 'active')`,
        [code, vendor_name.trim(), contact_person || null, email || null, phone || null, address || null, gst_number || null, pan_number || null]
      );
      return sendSuccess(res, 'Contractor created successfully', { vendor_id: resHeader.insertId }, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };
}


