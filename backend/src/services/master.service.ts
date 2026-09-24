import { MasterRepository, CountryRow, NationalityRow, CommunityRow, ProjectTypeRow, DocumentTypeRow, DisciplineRow, CurrencyRow, TaxRow } from '../repositories/master.repository';

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
    if (!name?.trim()) throw new Error('Community name is required');
    await this.repo.createCommunity({ community_name: name.trim(), country_id: countryId, state });
    return this.repo.findAllCommunities(countryId || undefined);
  }

  // ── Project Types ─────────────────────────────────────────────────────────
  async getProjectTypes(): Promise<ProjectTypeRow[]> {
    return this.repo.findAllProjectTypes(true);
  }

  async getAllProjectTypes(): Promise<ProjectTypeRow[]> {
    return this.repo.findAllProjectTypes(false);
  }

  async createProjectType(data: { type_code: string; type_name: string; description?: string | null; sort_order?: number }): Promise<ProjectTypeRow[]> {
    if (!data.type_code?.trim()) throw new Error('Type code is required');
    if (!data.type_name?.trim()) throw new Error('Type name is required');
    await this.repo.createProjectType(data);
    return this.repo.findAllProjectTypes(false);
  }

  async updateProjectType(id: number, data: Partial<{ type_name: string; description: string | null; sort_order: number; status: number }>): Promise<ProjectTypeRow | null> {
    await this.repo.updateProjectType(id, data);
    return this.repo.findProjectTypeById(id);
  }

  // ── Document Types ────────────────────────────────────────────────────────
  async getDocumentTypes(appliesTo?: string, countryId?: number): Promise<DocumentTypeRow[]> {
    return this.repo.findAllDocumentTypes(appliesTo, countryId);
  }

  async createDocumentType(data: {
    type_code: string; type_name: string; applies_to?: string;
    has_expiry?: number; has_number?: number; has_issue_date?: number;
    is_required?: number; country_id?: number | null; sort_order?: number;
  }): Promise<DocumentTypeRow[]> {
    if (!data.type_code?.trim()) throw new Error('Type code is required');
    if (!data.type_name?.trim()) throw new Error('Type name is required');
    await this.repo.createDocumentType(data);
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

  async createDiscipline(data: { discipline_code: string; discipline_name: string; description?: string | null; sort_order?: number }): Promise<DisciplineRow[]> {
    if (!data.discipline_code?.trim()) throw new Error('Discipline code is required');
    if (!data.discipline_name?.trim()) throw new Error('Discipline name is required');
    await this.repo.createDiscipline(data);
    return this.repo.findAllDisciplines(false);
  }

  async updateDiscipline(id: number, data: Partial<DisciplineRow>): Promise<DisciplineRow | null> {
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

  async createCurrency(data: { currency_code: string; currency_name: string; symbol: string; exchange_rate?: number; is_base?: number }): Promise<CurrencyRow[]> {
    if (!data.currency_code?.trim()) throw new Error('Currency code is required');
    if (!data.currency_name?.trim()) throw new Error('Currency name is required');
    if (!data.symbol?.trim()) throw new Error('Currency symbol is required');
    await this.repo.createCurrency(data);
    return this.repo.findAllCurrencies(false);
  }

  async updateCurrency(id: number, data: Partial<CurrencyRow>): Promise<CurrencyRow | null> {
    await this.repo.updateCurrency(id, data);
    return this.repo.findCurrencyById(id);
  }

  // ── Taxes ─────────────────────────────────────────────────────────────────
  async getTaxes(): Promise<TaxRow[]> {
    return this.repo.findAllTaxes(true);
  }

  async getAllTaxes(): Promise<TaxRow[]> {
    return this.repo.findAllTaxes(false);
  }

  async createTax(data: { tax_name: string; tax_percentage: number; country_id?: number | null }): Promise<TaxRow[]> {
    if (!data.tax_name?.trim()) throw new Error('Tax name is required');
    if (data.tax_percentage === undefined) throw new Error('Tax percentage is required');
    await this.repo.createTax(data);
    return this.repo.findAllTaxes(false);
  }

  async updateTax(id: number, data: Partial<TaxRow>): Promise<TaxRow | null> {
    await this.repo.updateTax(id, data);
    return this.repo.findTaxById(id);
  }
}

