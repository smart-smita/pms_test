import { SiteSurveyRepository, CreateSiteSurveyDTO, SiteSurveyPhotoDTO } from '../repositories/siteSurvey.repository';
import fs from 'fs';
import path from 'path';

export class SiteSurveyService {
  static async getAll(filters: { project_id?: number; customer_id?: number; discipline_id?: number; status?: string } = {}) {
    return SiteSurveyRepository.getAll(filters);
  }

  static async getById(id: number) {
    const survey = await SiteSurveyRepository.getById(id);
    if (!survey) throw new Error(`Site Survey with ID ${id} not found`);
    return survey;
  }

  static async create(data: CreateSiteSurveyDTO & { report_base64?: string; report_file_name?: string }, photos: SiteSurveyPhotoDTO[] = [], userId?: number, ipAddress?: string) {
    if (!data.project_id) throw new Error('Project ID is required');
    if (!data.survey_date) throw new Error('Survey date is required');
    if (!data.conducted_by) throw new Error('Inspector / Employee name is required');

    // Handle Option 2 (Attached Report PDF) if passed
    if (data.report_base64) {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'surveys');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const matches = data.report_base64.match(/^data:(.+);base64,(.+)$/);
      let buffer: Buffer;
      if (matches) buffer = Buffer.from(matches[2], 'base64');
      else buffer = Buffer.from(data.report_base64, 'base64');

      const ext = data.report_file_name ? path.extname(data.report_file_name) : '.pdf';
      const uniqueName = `survey_report_${data.project_id}_${Date.now()}${ext}`;
      const targetPath = path.join(uploadsDir, uniqueName);
      fs.writeFileSync(targetPath, buffer);
      data.attached_report_path = `/uploads/surveys/${uniqueName}`;
      data.entry_type = 'report_attachment';
    }

    return SiteSurveyRepository.create(data, photos, userId, ipAddress);
  }

  static async update(id: number, data: Partial<CreateSiteSurveyDTO>, photos?: SiteSurveyPhotoDTO[], userId?: number, ipAddress?: string) {
    const existing = await SiteSurveyRepository.getById(id);
    if (!existing) throw new Error(`Site Survey with ID ${id} not found`);

    return SiteSurveyRepository.update(id, data, photos, userId, ipAddress);
  }

  static async delete(id: number, userId?: number, ipAddress?: string) {
    const existing = await SiteSurveyRepository.getById(id);
    if (!existing) throw new Error(`Site Survey with ID ${id} not found`);

    return SiteSurveyRepository.delete(id, userId, ipAddress);
  }
}
