import { ProjectFinancialRepository } from '../repositories/projectFinancial.repository';

export class ProjectFinancialService {
  private repo = new ProjectFinancialRepository();

  async getExecutivePortfolioMetrics(managerId?: number) {
    return await this.repo.getPortfolioExecutiveMetrics(managerId);
  }

  async getProjectPortfolioList(filters?: { manager_id?: number; customer_id?: number; status?: string; search?: string }) {
    return await this.repo.getProjectPortfolioList(filters);
  }

  async getWbsBudgetVsActual(projectId: number) {
    if (!projectId || isNaN(projectId)) {
      throw new Error('Valid Project ID is required');
    }
    return await this.repo.getWbsBudgetVsActual(projectId);
  }

  async getCustomerCollectionsVsSpending(projectId?: number, startDate?: string, endDate?: string) {
    return await this.repo.getCustomerCollectionsVsSpending(projectId, startDate, endDate);
  }

  async getCustomerWiseFinancials(customerId?: number) {
    return await this.repo.getCustomerWiseFinancials(customerId);
  }

  async getInvoiceRegisterAndAging(filters?: { customer_id?: number; project_id?: number; status?: string; aging_bucket?: string }) {
    return await this.repo.getInvoiceRegisterAndAging(filters);
  }

  async getEquipmentUtilizationReport(ownershipType?: 'own' | 'rented', projectId?: number) {
    return await this.repo.getEquipmentUtilizationReport(ownershipType, projectId);
  }

  async getPoGrnReconciliationReport(projectId?: number) {
    return await this.repo.getPoGrnReconciliationReport(projectId);
  }

  async getMaterialStockValuationReport(storeId?: number) {
    return await this.repo.getMaterialStockValuationReport(storeId);
  }
}
