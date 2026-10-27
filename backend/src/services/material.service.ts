import { MaterialRepository } from '../repositories/material.repository';

export class MaterialService {
  private repo = new MaterialRepository();

  // ── Master ─────────────────────────────────────────────────────────────
  async getMaterials(filters: any) {
    return this.repo.getMaterials(filters);
  }
  async getMaterialById(id: number) {
    return this.repo.getMaterialById(id);
  }
  async createMaterial(data: any) {
    return this.repo.createMaterial(data);
  }
  async updateMaterial(id: number, data: any) {
    return this.repo.updateMaterial(id, data);
  }
  async deleteMaterial(id: number) {
    return this.repo.deleteMaterial(id);
  }

  // ── Quotations ─────────────────────────────────────────────────────────
  async getQuotations(filters: any) {
    return this.repo.getQuotations(filters);
  }
  async getQuotationById(id: number) {
    return this.repo.getQuotationById(id);
  }
  async createQuotation(data: any) {
    const items = data.items || [];
    return this.repo.createQuotation(data, items);
  }
  async updateQuotationStatus(id: number, status: string) {
    return this.repo.updateQuotationStatus(id, status);
  }

  // ── Surveys ────────────────────────────────────────────────────────────
  async getSurveys(filters: any) {
    return this.repo.getSurveys(filters);
  }
  async getSurveyById(id: number) {
    return this.repo.getSurveyById(id);
  }
  async createSurvey(data: any) {
    const items = data.items || [];
    return this.repo.createSurvey(data, items);
  }
  async updateSurveyStatus(id: number, status: string) {
    return this.repo.updateSurveyStatus(id, status);
  }

  // ── Reports ────────────────────────────────────────────────────────────
  async getProjectMaterialReport(projectId?: number) {
    return this.repo.getProjectMaterialReport(projectId);
  }
  async getProjectCostSummary(projectId: number) {
    return this.repo.getProjectCostSummary(projectId);
  }

  private wbsRepo = new (require('../repositories/wbs.repository').WbsRepository)();

  // ── Project Materials (Material WBS Tracking) ───────────────────────────
  async getProjectMaterials(filters: any) {
    return this.repo.getProjectMaterials(filters);
  }
  async getProjectMaterialById(id: number) {
    return this.repo.getProjectMaterialById(id);
  }
  async createProjectMaterial(data: any) {
    if (data.wbs_id) {
      const pw = await this.wbsRepo.findProjectWbsById(data.wbs_id);
      if (!pw) throw new Error('Selected WBS Discipline does not exist');
      if (pw.wbs_type === 'labour') {
        throw new Error('Selected WBS Discipline is a Labour WBS. Materials can only be linked to Material WBS Disciplines.');
      }
    }
    return this.repo.createProjectMaterial(data);
  }
  async updateProjectMaterial(id: number, data: any) {
    return this.repo.updateProjectMaterial(id, data);
  }
  async deleteProjectMaterial(id: number) {
    return this.repo.deleteProjectMaterial(id);
  }
  async logProjectMaterialAction(id: number, data: any) {
    return this.repo.logProjectMaterialAction(id, data);
  }
  async getProjectMaterialLogs(projectMaterialId: number) {
    return this.repo.getProjectMaterialLogs(projectMaterialId);
  }
}

