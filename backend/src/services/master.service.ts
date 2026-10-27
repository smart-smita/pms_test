import { MasterRepository, CountryRow, NationalityRow, CommunityRow, ProjectTypeRow, DocumentTypeRow, DisciplineRow, CurrencyRow, TaxRow } from '../repositories/master.repository';
import { dbPool } from '../config/db';

export function generateMasterShortCode(name: string, fallback = 'ITEM'): string {
  if (!name || !name.trim()) return fallback;
  const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].substring(0, 4).toUpperCase();
  }
  return words.map(w => w[0]).join('').substring(0, 6).toUpperCase();
}

export class MasterService {
  private repo = new MasterRepository();

  // ── Countries ────────────────────────────────────────────────────────────
  async getCountries(): Promise<CountryRow[]> {
    return this.repo.findAllCountries(true);
  }

  // ── Nationalities ─────────────────────────────────────────────────────────
  async getNationalities(countryId?: number): Promise<NationalityRow[]> {
    return this.repo.findAllNationalities(countryId);
  }

  // ── Communities ───────────────────────────────────────────────────────────
  async getCommunities(countryId?: number): Promise<CommunityRow[]> {
    return this.repo.findAllCommunities(countryId);
  }

  async createCommunity(name: string, countryId?: number | null, state?: string | null): Promise<CommunityRow[]> {
    const trimmed = name?.trim();
    if (!trimmed) throw new Error('Community name is required');
    
    const existing = await this.repo.findCommunityByName(trimmed);
    if (existing) {
      throw new Error(`A community named "${trimmed}" already exists`);
    }
    
    await this.repo.createCommunity({ community_name: trimmed, country_id: countryId, state });
    return this.repo.findAllCommunities(countryId || undefined);
  }

  async updateCommunity(id: number, name: string, countryId?: number | null, state?: string | null): Promise<CommunityRow | null> {
    const trimmed = name?.trim();
    if (!trimmed) throw new Error('Community name is required');

    // Check for duplicate, excluding the current community ID
    const existing = await this.repo.findCommunityByName(trimmed, id);
    if (existing) {
      throw new Error(`A community named ${trimmed} already exists`);
    }

    const ok = await this.repo.updateCommunity(id, { community_name: trimmed, country_id: countryId, state });
    if (!ok) throw new Error('Community not found or no changes made');
    const all = await this.repo.findAllCommunities();
    return all.find(c => c.community_id === id) || null;
  }

  // ── Project Types ─────────────────────────────────────────────────────────
  async getProjectTypes(): Promise<ProjectTypeRow[]> {
    return this.repo.findAllProjectTypes(true);
  }

  async getAllProjectTypes(): Promise<ProjectTypeRow[]> {
    return this.repo.findAllProjectTypes(false);
  }

  async createProjectType(data: { type_code?: string; type_name: string; description?: string | null; sort_order?: number }): Promise<ProjectTypeRow[]> {
    const typeName = data.type_name?.trim();
    if (!typeName) throw new Error('Project Type name is required');

    const typeCode = (data.type_code?.trim() || generateMasterShortCode(typeName, 'PRJ')).toUpperCase();

    const existingCode = await this.repo.findProjectTypeByCode(typeCode);
    if (existingCode) {
      throw new Error(`A project type with code "${typeCode}" already exists`);
    }

    const existingName = await this.repo.findProjectTypeByName(typeName);
    if (existingName) {
      throw new Error(`A project type named "${typeName}" already exists`);
    }

    await this.repo.createProjectType({
      type_code: typeCode,
      type_name: typeName,
      description: data.description || null,
      sort_order: data.sort_order || 0
    });
    return this.repo.findAllProjectTypes(false);
  }

  async updateProjectType(id: number, data: Partial<{ type_name: string; type_code: string; description: string | null; sort_order: number; status: number }>): Promise<ProjectTypeRow | null> {
    if (data.type_name) {
      const existingName = await this.repo.findProjectTypeByName(data.type_name.trim(), id);
      if (existingName) {
        throw new Error(`A project type named "${data.type_name.trim()}" already exists`);
      }
    }
    if (data.type_code) {
      const code = data.type_code.trim().toUpperCase();
      const existingCode = await this.repo.findProjectTypeByCode(code, id);
      if (existingCode) {
        throw new Error(`A project type with code "${code}" already exists`);
      }
      data.type_code = code;
    }
    await this.repo.updateProjectType(id, data);
    return this.repo.findProjectTypeById(id);
  }

  // ── Document Types ────────────────────────────────────────────────────────
  async getDocumentTypes(appliesTo?: string, countryId?: number): Promise<DocumentTypeRow[]> {
    return this.repo.findAllDocumentTypes(appliesTo, countryId);
  }

  async createDocumentType(data: {
    type_code?: string; type_name: string; applies_to?: string;
    has_expiry?: number; has_number?: number; has_issue_date?: number;
    is_required?: number; country_id?: number | null; sort_order?: number;
  }): Promise<DocumentTypeRow[]> {
    const typeName = data.type_name?.trim();
    if (!typeName) throw new Error('Document Type name is required');
    const typeCode = (data.type_code?.trim() || generateMasterShortCode(typeName, 'DOC')).toUpperCase();

    await this.repo.createDocumentType({
      ...data,
      type_code: typeCode,
      type_name: typeName
    });
    return this.repo.findAllDocumentTypes();
  }

  async updateDocumentType(id: number, data: Partial<DocumentTypeRow>): Promise<boolean> {
    return this.repo.updateDocumentType(id, data);
  }

  // ── Disciplines ───────────────────────────────────────────────────────────
  async getDisciplines(): Promise<DisciplineRow[]> {
    return this.repo.findAllDisciplines(true);
  }

  async getAllDisciplines(): Promise<DisciplineRow[]> {
    return this.repo.findAllDisciplines(false);
  }

  async createDiscipline(data: { discipline_code?: string; discipline_name: string; description?: string | null; sort_order?: number }): Promise<DisciplineRow[]> {
    const discName = data.discipline_name?.trim();
    if (!discName) throw new Error('Discipline name is required');

    const discCode = (data.discipline_code?.trim() || generateMasterShortCode(discName, 'DISC')).toUpperCase();

    const existingCode = await this.repo.findDisciplineByCode(discCode);
    if (existingCode) {
      throw new Error(`A discipline with code "${discCode}" already exists`);
    }

    const existingName = await this.repo.findDisciplineByName(discName);
    if (existingName) {
      throw new Error(`A discipline named "${discName}" already exists`);
    }

    await this.repo.createDiscipline({
      discipline_code: discCode,
      discipline_name: discName,
      description: data.description || null,
      sort_order: data.sort_order || 0
    });
    return this.repo.findAllDisciplines(false);
  }

  async updateDiscipline(id: number, data: Partial<DisciplineRow>): Promise<DisciplineRow | null> {
    if (data.discipline_name) {
      const existingName = await this.repo.findDisciplineByName(data.discipline_name.trim(), id);
      if (existingName) {
        throw new Error(`A discipline named "${data.discipline_name.trim()}" already exists`);
      }
    }
    if (data.discipline_code) {
      const code = data.discipline_code.trim().toUpperCase();
      const existingCode = await this.repo.findDisciplineByCode(code, id);
      if (existingCode) {
        throw new Error(`A discipline with code "${code}" already exists`);
      }
      data.discipline_code = code;
    }
    await this.repo.updateDiscipline(id, data);
    return this.repo.findDisciplineById(id);
  }

  // ── Currencies ────────────────────────────────────────────────────────────
  async getCurrencies(): Promise<CurrencyRow[]> {
    return this.repo.findAllCurrencies(true);
  }

  async getAllCurrencies(): Promise<CurrencyRow[]> {
    return this.repo.findAllCurrencies(false);
  }

  async createCurrency(data: { currency_code?: string; currency_name: string; symbol: string; exchange_rate?: number; is_base?: number }): Promise<CurrencyRow[]> {
    const currName = data.currency_name?.trim();
    if (!currName) throw new Error('Currency name is required');
    if (!data.symbol?.trim()) throw new Error('Currency symbol is required');

    const currCode = (data.currency_code?.trim() || generateMasterShortCode(currName, 'CUR')).toUpperCase();

    const existingCode = await this.repo.findCurrencyByCode(currCode);
    if (existingCode) {
      throw new Error(`A currency with code "${currCode}" already exists`);
    }

    await this.repo.createCurrency({
      currency_code: currCode,
      currency_name: currName,
      symbol: data.symbol.trim(),
      exchange_rate: data.exchange_rate || 1.0,
      is_base: data.is_base || 0
    });
    return this.repo.findAllCurrencies(false);
  }

  async updateCurrency(id: number, data: Partial<CurrencyRow>): Promise<CurrencyRow | null> {
    if (data.currency_code) {
      const code = data.currency_code.trim().toUpperCase();
      const existingCode = await this.repo.findCurrencyByCode(code, id);
      if (existingCode) {
        throw new Error(`A currency with code "${code}" already exists`);
      }
      data.currency_code = code;
    }
    await this.repo.updateCurrency(id, data);
    return this.repo.findCurrencyById(id);
  }

  // ── Taxes ─────────────────────────────────────────────────────────────────
  async getTaxes(countryId?: number): Promise<TaxRow[]> {
    return this.repo.findAllTaxes(true, countryId);
  }

  async getAllTaxes(countryId?: number): Promise<TaxRow[]> {
    return this.repo.findAllTaxes(false, countryId);
  }

  async createTax(data: {
    tax_name: string; tax_code?: string | null; tax_type?: string; tax_percentage: number;
    country_id?: number | null; is_split?: number; cgst_percentage?: number; sgst_percentage?: number;
  }): Promise<TaxRow[]> {
    const taxName = data.tax_name?.trim();
    if (!taxName) throw new Error('Tax name is required');
    if (data.tax_percentage === undefined || isNaN(Number(data.tax_percentage))) {
      throw new Error('Tax percentage is required');
    }

    const taxCode = (data.tax_code?.trim() || generateMasterShortCode(taxName, 'TAX')).toUpperCase();

    const existingCode = await this.repo.findTaxByCode(taxCode);
    if (existingCode) {
      throw new Error(`A tax with code "${taxCode}" already exists`);
    }

    const existingName = await this.repo.findTaxByName(taxName);
    if (existingName) {
      throw new Error(`A tax named "${taxName}" already exists`);
    }

    await this.repo.createTax({
      ...data,
      tax_name: taxName,
      tax_code: taxCode
    });
    return this.repo.findAllTaxes(false);
  }

  async updateTax(id: number, data: Partial<TaxRow>): Promise<TaxRow | null> {
    if (data.tax_name) {
      const existingName = await this.repo.findTaxByName(data.tax_name.trim(), id);
      if (existingName) {
        throw new Error(`A tax named "${data.tax_name.trim()}" already exists`);
      }
    }
    if (data.tax_code) {
      const code = data.tax_code.trim().toUpperCase();
      const existingCode = await this.repo.findTaxByCode(code, id);
      if (existingCode) {
        throw new Error(`A tax with code "${code}" already exists`);
      }
      data.tax_code = code;
    }
    await this.repo.updateTax(id, data);
    return this.repo.findTaxById(id);
  }

  // ─── Company Calendar & Holidays ──────────────────────────────────────────────
  async getCalendars() {
    return this.repo.findAllCalendars();
  }

  async createCalendar(data: any) {
    if (!data.calendar_name?.trim()) throw new Error('Calendar name is required');
    if (!data.working_days_json) throw new Error('Working days configuration is required');
    
    // Ensure working_days_json is valid JSON string
    try {
      const parsed = JSON.parse(data.working_days_json);
      if (!Array.isArray(parsed)) throw new Error();
    } catch {
      throw new Error('Invalid working_days_json format');
    }

    const conn = await dbPool.getConnection();
    await conn.beginTransaction();
    try {
      const id = await this.repo.createCalendar(data, conn);
      
      if (Array.isArray(data.holidays)) {
        for (const h of data.holidays) {
          await this.repo.createHoliday({ ...h, calendar_id: id }, conn);
        }
      }
      
      await conn.commit();
      const all = await this.repo.findAllCalendars();
      return all.find(c => c.id === id);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async updateCalendar(id: number, data: any) {
    if (data.working_days_json) {
      try {
        const parsed = JSON.parse(data.working_days_json);
        if (!Array.isArray(parsed)) throw new Error();
      } catch {
        throw new Error('Invalid working_days_json format');
      }
    }
    const conn = await dbPool.getConnection();
    await conn.beginTransaction();
    try {
      await this.repo.updateCalendar(id, data, conn);
      
      if (Array.isArray(data.holidays)) {
        // Simple sync: delete all existing and re-insert
        await conn.query('DELETE FROM holidays WHERE calendar_id = ?', [id]);
        for (const h of data.holidays) {
          await this.repo.createHoliday({ ...h, calendar_id: id }, conn);
        }
      }
      
      await conn.commit();
      const all = await this.repo.findAllCalendars();
      return all.find(c => c.id === id);
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getHolidays(calendarId?: number) {
    return this.repo.findAllHolidays(calendarId);
  }

  async createHoliday(data: any) {
    if (!data.calendar_id) throw new Error('Calendar ID is required');
    if (!data.holiday_date) throw new Error('Holiday date is required');
    
    const id = await this.repo.createHoliday(data);
    const all = await this.repo.findAllHolidays(data.calendar_id);
    return all.find(h => h.id === id);
  }

  async deleteHoliday(id: number) {
    await this.repo.deleteHoliday(id);
    return true;
  }
}


