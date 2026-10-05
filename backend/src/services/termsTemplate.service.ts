import { TermsTemplateRepository, CreateTermsTemplateDTO } from '../repositories/termsTemplate.repository';

export class TermsTemplateService {
  static async getAll(filters: { country_id?: number; project_type_id?: number; discipline_id?: number; status?: number; all?: boolean } = {}) {
    return TermsTemplateRepository.getAll(filters);
  }

  static async getById(id: number) {
    const template = await TermsTemplateRepository.getById(id);
    if (!template) throw new Error(`Terms Template with ID ${id} not found`);
    return template;
  }

  static async create(data: CreateTermsTemplateDTO, userId?: number, ipAddress?: string) {
    if (!data.template_name?.trim()) throw new Error('Template name is required');
    const existing = await TermsTemplateRepository.findByName(data.template_name.trim());
    if (existing) {
      throw new Error(`A Terms & Conditions template named "${data.template_name.trim()}" already exists.`);
    }
    return TermsTemplateRepository.create(data, userId, ipAddress);
  }

  static async update(id: number, data: Partial<CreateTermsTemplateDTO>, userId?: number, ipAddress?: string) {
    const existing = await TermsTemplateRepository.getById(id);
    if (!existing) throw new Error(`Terms Template with ID ${id} not found`);

    if (data.template_name?.trim()) {
      const duplicate = await TermsTemplateRepository.findByName(data.template_name.trim(), id);
      if (duplicate) {
        throw new Error(`A Terms & Conditions template named "${data.template_name.trim()}" already exists.`);
      }
    }

    return TermsTemplateRepository.update(id, data, userId, ipAddress);
  }

  static async toggleStatus(id: number, status: number, userId?: number, ipAddress?: string) {
    const existing = await TermsTemplateRepository.getById(id);
    if (!existing) throw new Error(`Terms Template with ID ${id} not found`);

    return TermsTemplateRepository.toggleStatus(id, status, userId, ipAddress);
  }

  static async delete(id: number, userId?: number, ipAddress?: string) {
    const existing = await TermsTemplateRepository.getById(id);
    if (!existing) throw new Error(`Terms Template with ID ${id} not found`);

    return TermsTemplateRepository.delete(id, userId, ipAddress);
  }
}
