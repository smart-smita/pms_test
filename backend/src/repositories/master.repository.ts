import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

// ─── Country ─────────────────────────────────────────────────────────────────
export interface CountryRow {
  country_id: number;
  country_code: string;
  country_name: string;
  phone_code: string | null;
  status: number;
}

// ─── Nationality ──────────────────────────────────────────────────────────────
export interface NationalityRow {
  nationality_id: number;
  nationality_name: string;
  country_id: number | null;
  status: number;
}

// ─── Community ────────────────────────────────────────────────────────────────
export interface CommunityRow {
  community_id: number;
  community_name: string;
  country_id: number | null;
  state: string | null;
  status: number;
}

// ─── Project Type ─────────────────────────────────────────────────────────────
export interface ProjectTypeRow {
  type_id: number;
  type_code: string;
  type_name: string;
  description: string | null;
  status: number;
  sort_order: number;
}

// ─── Document Type ────────────────────────────────────────────────────────────
export interface DocumentTypeRow {
  doc_type_id: number;
  type_code: string;
  type_name: string;
  applies_to: 'employee' | 'labour' | 'project' | 'quotation' | 'all';
  has_expiry: number;
  has_number: number;
  has_issue_date: number;
  is_required: number;
  country_id: number | null;
  status: number;
  sort_order: number;
}

// ─── Discipline ─────────────────────────────────────────────────────────────
export interface DisciplineRow {
  discipline_id: number;
  discipline_code: string;
  discipline_name: string;
  description: string | null;
  status: number;
  sort_order: number;
}

// ─── Currency ───────────────────────────────────────────────────────────────
export interface CurrencyRow {
  currency_id: number;
  currency_code: string;
  currency_name: string;
  symbol: string;
  exchange_rate: number;
  is_base: number;
  status: number;
}

// ─── Tax ────────────────────────────────────────────────────────────────────
export interface TaxRow {
  tax_id: number;
  tax_code?: string | null;
  tax_name: string;
  tax_type?: 'VAT' | 'GST' | 'CGST_SGST' | 'IGST' | 'SALES_TAX' | 'OTHER';
  tax_percentage: number;
  country_id: number | null;
  country_name?: string | null;
  country_code?: string | null;
  is_split?: number;
  cgst_percentage?: number;
  sgst_percentage?: number;
  status: number;
}


export class MasterRepository {
  // ── Countries ────────────────────────────────────────────────────────────
  async findAllCountries(activeOnly = true): Promise<CountryRow[]> {
    const sql = activeOnly
      ? `SELECT * FROM countries WHERE status = 1 ORDER BY country_name ASC`
      : `SELECT * FROM countries ORDER BY country_name ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql);
    return rows as CountryRow[];
  }

  // ── Nationalities ─────────────────────────────────────────────────────────
  async findAllNationalities(countryId?: number): Promise<NationalityRow[]> {
    let sql = `SELECT * FROM nationalities WHERE status = 1`;
    const params: any[] = [];
    if (countryId) { sql += ` AND (country_id = ? OR country_id IS NULL)`; params.push(countryId); }
    sql += ` ORDER BY nationality_name ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as NationalityRow[];
  }

  // ── Communities ────────────────────────────────────────────────────────────
  async findAllCommunities(countryId?: number): Promise<CommunityRow[]> {
    let sql = `SELECT * FROM communities WHERE status = 1`;
    const params: any[] = [];
    if (countryId) { sql += ` AND (country_id = ? OR country_id IS NULL)`; params.push(countryId); }
    sql += ` ORDER BY community_name ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as CommunityRow[];
  }

  async findCommunityByName(name: string, excludeId?: number): Promise<CommunityRow | null> {
    let sql = `SELECT * FROM communities WHERE LOWER(TRIM(community_name)) = LOWER(TRIM(?))`;
    const params: any[] = [name];
    if (excludeId) {
      sql += ` AND community_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as CommunityRow) || null;
  }

  async createCommunity(data: { community_name: string; country_id?: number | null; state?: string | null }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO communities (community_name, country_id, state) VALUES (?, ?, ?)`,
      [data.community_name, data.country_id || null, data.state || null]
    );
    return result.insertId;
  }

  async updateCommunity(id: number, data: { community_name?: string; country_id?: number | null; state?: string | null }): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.community_name !== undefined) { fields.push('community_name = ?'); params.push(data.community_name); }
    if (data.country_id !== undefined) { fields.push('country_id = ?'); params.push(data.country_id); }
    if (data.state !== undefined) { fields.push('state = ?'); params.push(data.state); }
    if (fields.length === 0) return false;
    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(
      `UPDATE communities SET ${fields.join(', ')} WHERE community_id = ?`,
      params
    );
    return result.affectedRows > 0;
  }

  // ── Project Types ─────────────────────────────────────────────────────────
  async findAllProjectTypes(activeOnly = true): Promise<ProjectTypeRow[]> {
    const sql = activeOnly
      ? `SELECT * FROM project_types WHERE status = 1 ORDER BY sort_order ASC, type_name ASC`
      : `SELECT * FROM project_types ORDER BY sort_order ASC, type_name ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql);
    return rows as ProjectTypeRow[];
  }

  async findProjectTypeById(id: number): Promise<ProjectTypeRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT * FROM project_types WHERE type_id = ?`, [id]
    );
    return (rows[0] as ProjectTypeRow) || null;
  }

  async findProjectTypeByCode(code: string, excludeId?: number): Promise<ProjectTypeRow | null> {
    let sql = `SELECT * FROM project_types WHERE LOWER(TRIM(type_code)) = LOWER(TRIM(?))`;
    const params: any[] = [code];
    if (excludeId) {
      sql += ` AND type_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as ProjectTypeRow) || null;
  }

  async findProjectTypeByName(name: string, excludeId?: number): Promise<ProjectTypeRow | null> {
    let sql = `SELECT * FROM project_types WHERE LOWER(TRIM(type_name)) = LOWER(TRIM(?))`;
    const params: any[] = [name];
    if (excludeId) {
      sql += ` AND type_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as ProjectTypeRow) || null;
  }

  async createProjectType(data: { type_code: string; type_name: string; description?: string | null; sort_order?: number }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO project_types (type_code, type_name, description, sort_order) VALUES (?, ?, ?, ?)`,
      [data.type_code.toUpperCase(), data.type_name, data.description || null, data.sort_order || 0]
    );
    return result.insertId;
  }

  async updateProjectType(id: number, data: Partial<{ type_name: string; description: string | null; sort_order: number; status: number }>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.type_name !== undefined)   { fields.push('type_name = ?');   params.push(data.type_name); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
    if (data.sort_order !== undefined)  { fields.push('sort_order = ?');  params.push(data.sort_order); }
    if (data.status !== undefined)      { fields.push('status = ?');      params.push(data.status); }
    if (!fields.length) return false;
    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(`UPDATE project_types SET ${fields.join(', ')} WHERE type_id = ?`, params);
    return result.affectedRows > 0;
  }

  // ── Document Types ────────────────────────────────────────────────────────
  async findAllDocumentTypes(appliesTo?: string, countryId?: number): Promise<DocumentTypeRow[]> {
    let sql = `SELECT * FROM document_types WHERE status = 1`;
    const params: any[] = [];
    if (appliesTo) {
      sql += ` AND (applies_to = ? OR applies_to = 'all')`;
      params.push(appliesTo);
    }
    if (countryId) {
      sql += ` AND (country_id = ? OR country_id IS NULL)`;
      params.push(countryId);
    }
    sql += ` ORDER BY sort_order ASC, type_name ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as DocumentTypeRow[];
  }

  async createDocumentType(data: {
    type_code: string; type_name: string;
    applies_to?: string; has_expiry?: number; has_number?: number;
    has_issue_date?: number; is_required?: number; country_id?: number | null; sort_order?: number;
  }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO document_types (type_code, type_name, applies_to, has_expiry, has_number, has_issue_date, is_required, country_id, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.type_code.toUpperCase(), data.type_name,
        data.applies_to || 'all', data.has_expiry ?? 1, data.has_number ?? 1,
        data.has_issue_date ?? 1, data.is_required ?? 0,
        data.country_id || null, data.sort_order || 0,
      ]
    );
    return result.insertId;
  }

  async updateDocumentType(id: number, data: Partial<DocumentTypeRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    const editable: (keyof DocumentTypeRow)[] = ['type_name','applies_to','has_expiry','has_number','has_issue_date','is_required','country_id','status','sort_order'];
    for (const key of editable) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }
    if (!fields.length) return false;
    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(`UPDATE document_types SET ${fields.join(', ')} WHERE doc_type_id = ?`, params);
    return result.affectedRows > 0;
  }

  // ── Disciplines ───────────────────────────────────────────────────────────
  async findAllDisciplines(activeOnly = true): Promise<DisciplineRow[]> {
    const sql = activeOnly
      ? `SELECT * FROM disciplines WHERE status = 1 ORDER BY sort_order ASC, discipline_name ASC`
      : `SELECT * FROM disciplines ORDER BY sort_order ASC, discipline_name ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql);
    return rows as DisciplineRow[];
  }

  async findDisciplineById(id: number): Promise<DisciplineRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(`SELECT * FROM disciplines WHERE discipline_id = ?`, [id]);
    return (rows[0] as DisciplineRow) || null;
  }

  async findDisciplineByCode(code: string, excludeId?: number): Promise<DisciplineRow | null> {
    let sql = `SELECT * FROM disciplines WHERE LOWER(TRIM(discipline_code)) = LOWER(TRIM(?))`;
    const params: any[] = [code];
    if (excludeId) {
      sql += ` AND discipline_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as DisciplineRow) || null;
  }

  async findDisciplineByName(name: string, excludeId?: number): Promise<DisciplineRow | null> {
    let sql = `SELECT * FROM disciplines WHERE LOWER(TRIM(discipline_name)) = LOWER(TRIM(?))`;
    const params: any[] = [name];
    if (excludeId) {
      sql += ` AND discipline_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as DisciplineRow) || null;
  }

  async createDiscipline(data: { discipline_code: string; discipline_name: string; description?: string | null; sort_order?: number }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO disciplines (discipline_code, discipline_name, description, sort_order) VALUES (?, ?, ?, ?)`,
      [data.discipline_code.toUpperCase(), data.discipline_name, data.description || null, data.sort_order || 0]
    );
    return result.insertId;
  }

  async updateDiscipline(id: number, data: Partial<DisciplineRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    if (data.discipline_name !== undefined) { fields.push('discipline_name = ?'); params.push(data.discipline_name); }
    if (data.discipline_code !== undefined) { fields.push('discipline_code = ?'); params.push(data.discipline_code); }
    if (data.description !== undefined)     { fields.push('description = ?');     params.push(data.description); }
    if (data.sort_order !== undefined)      { fields.push('sort_order = ?');      params.push(data.sort_order); }
    if (data.status !== undefined)          { fields.push('status = ?');          params.push(data.status); }
    if (!fields.length) return false;
    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(`UPDATE disciplines SET ${fields.join(', ')} WHERE discipline_id = ?`, params);
    return result.affectedRows > 0;
  }

  // ── Currencies ────────────────────────────────────────────────────────────
  async findAllCurrencies(activeOnly = true): Promise<CurrencyRow[]> {
    const sql = activeOnly
      ? `SELECT * FROM currencies WHERE status = 1 ORDER BY currency_name ASC`
      : `SELECT * FROM currencies ORDER BY currency_name ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql);
    return rows as CurrencyRow[];
  }

  async findCurrencyById(id: number): Promise<CurrencyRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(`SELECT * FROM currencies WHERE currency_id = ?`, [id]);
    return (rows[0] as CurrencyRow) || null;
  }

  async findCurrencyByCode(code: string, excludeId?: number): Promise<CurrencyRow | null> {
    let sql = `SELECT * FROM currencies WHERE LOWER(TRIM(currency_code)) = LOWER(TRIM(?))`;
    const params: any[] = [code];
    if (excludeId) {
      sql += ` AND currency_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as CurrencyRow) || null;
  }

  async createCurrency(data: { currency_code: string; currency_name: string; symbol: string; exchange_rate?: number; is_base?: number }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO currencies (currency_code, currency_name, symbol, exchange_rate, is_base) VALUES (?, ?, ?, ?, ?)`,
      [data.currency_code.toUpperCase(), data.currency_name, data.symbol, data.exchange_rate || 1.000000, data.is_base || 0]
    );
    return result.insertId;
  }

  async updateCurrency(id: number, data: Partial<CurrencyRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    const editable: (keyof CurrencyRow)[] = ['currency_name', 'currency_code', 'symbol', 'exchange_rate', 'is_base', 'status'];
    for (const key of editable) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }
    if (!fields.length) return false;
    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(`UPDATE currencies SET ${fields.join(', ')} WHERE currency_id = ?`, params);
    return result.affectedRows > 0;
  }

  // ── Taxes ─────────────────────────────────────────────────────────────────
  async findAllTaxes(activeOnly = true, countryId?: number): Promise<TaxRow[]> {
    let sql = activeOnly
      ? `SELECT t.*, c.country_name, c.country_code FROM taxes t LEFT JOIN countries c ON t.country_id = c.country_id WHERE t.status = 1`
      : `SELECT t.*, c.country_name, c.country_code FROM taxes t LEFT JOIN countries c ON t.country_id = c.country_id WHERE 1=1`;
    const params: any[] = [];
    if (countryId) {
      sql += ` AND (t.country_id = ? OR t.country_id IS NULL)`;
      params.push(countryId);
    }
    sql += ` ORDER BY t.tax_name ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return rows as TaxRow[];
  }

  async findTaxById(id: number): Promise<TaxRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT t.*, c.country_name, c.country_code FROM taxes t LEFT JOIN countries c ON t.country_id = c.country_id WHERE t.tax_id = ?`,
      [id]
    );
    return (rows[0] as TaxRow) || null;
  }

  async findTaxByCode(code: string, excludeId?: number): Promise<TaxRow | null> {
    let sql = `SELECT * FROM taxes WHERE LOWER(TRIM(tax_code)) = LOWER(TRIM(?))`;
    const params: any[] = [code];
    if (excludeId) {
      sql += ` AND tax_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as TaxRow) || null;
  }

  async findTaxByName(name: string, excludeId?: number): Promise<TaxRow | null> {
    let sql = `SELECT * FROM taxes WHERE LOWER(TRIM(tax_name)) = LOWER(TRIM(?))`;
    const params: any[] = [name];
    if (excludeId) {
      sql += ` AND tax_id != ?`;
      params.push(excludeId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, params);
    return (rows[0] as TaxRow) || null;
  }

  async createTax(data: {
    tax_name: string; tax_code?: string | null; tax_type?: string; tax_percentage: number;
    country_id?: number | null; is_split?: number; cgst_percentage?: number; sgst_percentage?: number;
  }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO taxes (tax_name, tax_code, tax_type, tax_percentage, country_id, is_split, cgst_percentage, sgst_percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.tax_name,
        data.tax_code || null,
        data.tax_type || 'VAT',
        data.tax_percentage,
        data.country_id || null,
        data.is_split || 0,
        data.cgst_percentage || 0,
        data.sgst_percentage || 0,
      ]
    );
    return result.insertId;
  }

  async updateTax(id: number, data: Partial<TaxRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    const editable: (keyof TaxRow)[] = ['tax_name', 'tax_code', 'tax_type', 'tax_percentage', 'country_id', 'is_split', 'cgst_percentage', 'sgst_percentage', 'status'];
    for (const key of editable) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }
    if (!fields.length) return false;
    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(`UPDATE taxes SET ${fields.join(', ')} WHERE tax_id = ?`, params);
    return result.affectedRows > 0;
  }
  // ─── Company Calendar & Holidays ──────────────────────────────────────────────
  async findAllCalendars(): Promise<CompanyCalendarRow[]> {
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT * FROM company_calendar WHERE deleted_at IS NULL ORDER BY id ASC`
    );
    return rows as CompanyCalendarRow[];
  }

  async createCalendar(data: any, connection?: any): Promise<any> {
    const db = connection || dbPool;
    const [result] = await db.query(
      `INSERT INTO company_calendar (project_id, calendar_name, working_days_json, working_hours_per_day, status) VALUES (?, ?, ?, ?, ?)`,
      [data.project_id || null, data.calendar_name, data.working_days_json || '[1,2,3,4,5,6]', data.working_hours_per_day || 10, data.status === undefined ? 1 : data.status]
    );
    return result.insertId;
  }

  async updateCalendar(id: number, data: any, connection?: any): Promise<void> {
    const db = connection || dbPool;
    const updates: string[] = [];
    const values: any[] = [];
    if (data.calendar_name !== undefined) { updates.push('calendar_name = ?'); values.push(data.calendar_name); }
    if (data.working_days_json !== undefined) { updates.push('working_days_json = ?'); values.push(data.working_days_json); }
    if (data.working_hours_per_day !== undefined) { updates.push('working_hours_per_day = ?'); values.push(data.working_hours_per_day); }
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }
    
    if (updates.length > 0) {
      values.push(id);
      await db.query(`UPDATE company_calendar SET ${updates.join(', ')} WHERE id = ?`, values);
    }
  }

  async findAllHolidays(calendarId?: number): Promise<HolidayRow[]> {
    let query = `SELECT * FROM holidays ORDER BY holiday_date ASC`;
    const params: any[] = [];
    if (calendarId) {
      query = `SELECT * FROM holidays WHERE calendar_id = ? ORDER BY holiday_date ASC`;
      params.push(calendarId);
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(query, params);
    return rows as HolidayRow[];
  }

  async createHoliday(data: any, connection?: any): Promise<any> {
    const db = connection || dbPool;
    const [result] = await db.query(
      `INSERT INTO holidays (calendar_id, holiday_date, description, type) VALUES (?, ?, ?, ?)`,
      [data.calendar_id, data.holiday_date, data.description || null, data.type || 'public_holiday']
    );
    return result.insertId;
  }

  async deleteHoliday(id: number): Promise<void> {
    await dbPool.query(`DELETE FROM holidays WHERE id = ?`, [id]);
  }
}


// ─── Company Calendar ─────────────────────────────────────────────────────────
export interface CompanyCalendarRow {
  id: number;
  project_id: number | null;
  calendar_name: string;
  working_days_json: string;
  working_hours_per_day: number;
  status: number;
}

// ─── Holidays ─────────────────────────────────────────────────────────────────
export interface HolidayRow {
  id: number;
  calendar_id: number;
  holiday_date: string;
  description: string | null;
  type: string;
}

