import { TermsTemplateRepository, CreateTermsTemplateDTO } from '../repositories/termsTemplate.repository';

export class TermsTemplateService {
  static async getAll(filters: { country_id?: number; project_type_id?: number; discipline_id?: number } = {}) {
    return TermsTemplateRepository.getAll(filters);
  }

  static async getById(id: number) {
    const template = await TermsTemplateRepository.getById(id);
    if (!template) throw new Error(`Terms Template with ID ${id} not found`);
    return template;
  }

  static async create(data: CreateTermsTemplateDTO, userId?: number, ipAddress?: string) {
    if (!data.template_name) throw new Error('Template name is required');
    if (!data.terms_content) throw new Error('Terms content is required');

    return TermsTemplateRepository.create(data, userId, ipAddress);
  }

  static async update(id: number, data: Partial<CreateTermsTemplateDTO>, userId?: number, ipAddress?: string) {
    const existing = await TermsTemplateRepository.getById(id);
    if (!existing) throw new Error(`Terms Template with ID ${id} not found`);

    return TermsTemplateRepository.update(id, data, userId, ipAddress);
  }

  static async delete(id: number, userId?: number, ipAddress?: string) {
    const existing = await TermsTemplateRepository.getById(id);
    if (!existing) throw new Error(`Terms Template with ID ${id} not found`);

    return TermsTemplateRepository.delete(id, userId, ipAddress);
  }
}
