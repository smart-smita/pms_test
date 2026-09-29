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
}
