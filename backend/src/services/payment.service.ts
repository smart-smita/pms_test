import { PaymentRepository } from '../repositories/payment.repository';

export class PaymentService {
  private paymentRepo = new PaymentRepository();

  async getLabourPayments(startDate?: string, endDate?: string, labourId?: number, projectId?: number, managerId?: number) {
    return await this.paymentRepo.getLabourPaymentSummary(startDate, endDate, labourId, projectId, managerId);
  }

  async getDailyPayments(startDate?: string, endDate?: string, projectId?: number, managerId?: number) {
    return await this.paymentRepo.getDailyPaymentSummary(startDate, endDate, projectId, managerId);
  }

  async getProjectPayments(projectId?: number, managerId?: number) {
    return await this.paymentRepo.getProjectPaymentSummary(projectId, managerId);
  }

  async getTaskPayments(projectId?: number, managerId?: number) {
    return await this.paymentRepo.getTaskPaymentSummary(projectId, managerId);
  }

  async getWBSPayments(projectId?: number, managerId?: number) {
    return await this.paymentRepo.getWBSPaymentSummary(projectId, managerId);
  }
}
