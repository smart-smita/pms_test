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
  tax_name: string;
  tax_percentage: number;
  country_id: number | null;
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

  async createCommunity(data: { community_name: string; country_id?: number | null; state?: string | null }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO communities (community_name, country_id, state) VALUES (?, ?, ?)`,
      [data.community_name, data.country_id || null, data.state || null]
    );
    return result.insertId;
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
    const editable: (keyof CurrencyRow)[] = ['currency_name', 'symbol', 'exchange_rate', 'is_base', 'status'];
    for (const key of editable) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }
    if (!fields.length) return false;
    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(`UPDATE currencies SET ${fields.join(', ')} WHERE currency_id = ?`, params);
    return result.affectedRows > 0;
  }

  // ── Taxes ─────────────────────────────────────────────────────────────────
  async findAllTaxes(activeOnly = true): Promise<TaxRow[]> {
    const sql = activeOnly
      ? `SELECT * FROM taxes WHERE status = 1 ORDER BY tax_name ASC`
      : `SELECT * FROM taxes ORDER BY tax_name ASC`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql);
    return rows as TaxRow[];
  }

  async findTaxById(id: number): Promise<TaxRow | null> {
    const [rows] = await dbPool.query<RowDataPacket[]>(`SELECT * FROM taxes WHERE tax_id = ?`, [id]);
    return (rows[0] as TaxRow) || null;
  }

  async createTax(data: { tax_name: string; tax_percentage: number; country_id?: number | null }): Promise<number> {
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO taxes (tax_name, tax_percentage, country_id) VALUES (?, ?, ?)`,
      [data.tax_name, data.tax_percentage, data.country_id || null]
    );
    return result.insertId;
  }

  async updateTax(id: number, data: Partial<TaxRow>): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    const editable: (keyof TaxRow)[] = ['tax_name', 'tax_percentage', 'country_id', 'status'];
    for (const key of editable) {
      if (data[key] !== undefined) { fields.push(`${key} = ?`); params.push(data[key]); }
    }
    if (!fields.length) return false;
    params.push(id);
    const [result] = await dbPool.query<ResultSetHeader>(`UPDATE taxes SET ${fields.join(', ')} WHERE tax_id = ?`, params);
    return result.affectedRows > 0;
  }
}

