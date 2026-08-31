import { PaymentRepository } from '../repositories/payment.repository';

export class PaymentService {
  private paymentRepo = new PaymentRepository();

  async getEmployeePayments(startDate?: string, endDate?: string, employeeId?: number) {
    return await this.paymentRepo.getEmployeePaymentSummary(startDate, endDate, employeeId);
  }

  async getDailyPayments(startDate?: string, endDate?: string) {
    return await this.paymentRepo.getDailyPaymentSummary(startDate, endDate);
  }

  async getProjectPayments() {
    return await this.paymentRepo.getProjectPaymentSummary();
  }

  async getTaskPayments() {
    return await this.paymentRepo.getTaskPaymentSummary();
  }
}
