import { ReportRepository } from '../repositories/report.repository';
import { PaymentRepository } from '../repositories/payment.repository';

export class ReportService {
  private reportRepo = new ReportRepository();
  private paymentRepo = new PaymentRepository();

  async getAttendanceReport(filters: any) {
    return await this.reportRepo.getAttendanceReport(filters);
  }

  async getProjectReport(employeeId?: number) {
    return await this.reportRepo.getProjectReport(employeeId);
  }

  async getTaskReport(filters: any) {
    return await this.reportRepo.getTaskReport(filters);
  }

  async getPaymentReport(type: 'employee' | 'daily' | 'project' | 'task', startDate?: string, endDate?: string, employeeId?: number) {
    switch (type) {
      case 'employee':
        return await this.paymentRepo.getEmployeePaymentSummary(startDate, endDate, employeeId);
      case 'daily':
        return await this.paymentRepo.getDailyPaymentSummary(startDate, endDate);
      case 'project':
        return await this.paymentRepo.getProjectPaymentSummary();
      case 'task':
        return await this.paymentRepo.getTaskPaymentSummary();
      default:
        return await this.paymentRepo.getEmployeePaymentSummary(startDate, endDate, employeeId);
    }
  }
}
