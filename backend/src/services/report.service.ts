import { ReportRepository } from '../repositories/report.repository';
import { PaymentRepository } from '../repositories/payment.repository';

export class ReportService {
  private reportRepo = new ReportRepository();
  private paymentRepo = new PaymentRepository();

  async getEmployeeDetailsReport(filters: any) {
    return await this.reportRepo.getEmployeeDetailsReport(filters);
  }

  async getDisciplineDetailsReport(filters?: any) {
    return await this.reportRepo.getDisciplineDetailsReport(filters);
  }

  async getEmployeeAttendanceReport1(filters: any) {
    return await this.reportRepo.getEmployeeAttendanceReport1(filters);
  }

  async getEmployeeAttendanceReport2(filters: any) {
    return await this.reportRepo.getEmployeeAttendanceReport2(filters);
  }

  async getEmployeeAttendanceDayWiseReport2(filters: any) {
    return await this.reportRepo.getEmployeeAttendanceDayWiseReport2(filters);
  }

  async getEmployeeAttendanceSummaryMatrix(filters: any) {
    return await this.reportRepo.getEmployeeAttendanceSummaryMatrix(filters);
  }

  async getEmployeeAttendanceReport3(filters: any) {
    return await this.reportRepo.getEmployeeAttendanceReport3(filters);
  }

  async getLabourDetailsReport(filters: any) {
    return await this.reportRepo.getLabourDetailsReport(filters);
  }

  async getLabourAttendanceReport1(filters: any) {
    return await this.reportRepo.getLabourAttendanceReport1(filters);
  }

  async getLabourAttendanceReport2(filters: any) {
    return await this.reportRepo.getLabourAttendanceReport2(filters);
  }

  async getLabourAttendanceReport3(filters: any) {
    return await this.reportRepo.getLabourAttendanceReport3(filters);
  }

  async getLabourCostPaymentReport(filters: any) {
    return await this.reportRepo.getLabourCostPaymentReport(filters);
  }

  async getProjectWorkReport(projectId?: number, managerId?: number, employeeId?: number, startDate?: string, endDate?: string) {
    return await this.reportRepo.getProjectWorkReport(projectId, managerId, employeeId, startDate, endDate);
  }

  async getProjectBudgetReport(filters?: any) {
    return await this.reportRepo.getProjectBudgetReport(filters);
  }

  async getProjectSummaryReport(filters?: any) {
    return await this.reportRepo.getProjectSummaryReport(filters);
  }

  async getPaymentReport(type: 'employee' | 'daily' | 'project' | 'task', startDate?: string, endDate?: string, employeeId?: number) {
    switch (type) {
      case 'employee':
        return await this.paymentRepo.getLabourPaymentSummary(startDate, endDate, employeeId);
      case 'daily':
        return await this.paymentRepo.getDailyPaymentSummary(startDate, endDate);
      case 'project':
        return await this.paymentRepo.getProjectPaymentSummary();
      case 'task':
        return await this.paymentRepo.getTaskPaymentSummary();
      default:
        return await this.paymentRepo.getLabourPaymentSummary(startDate, endDate, employeeId);
    }
  }
}
