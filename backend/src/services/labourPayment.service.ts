import { LabourPaymentRepository, LabourPaymentRow } from '../repositories/labourPayment.repository';
import { LabourWorkLogRepository } from '../repositories/labourWorkLog.repository';

export class LabourPaymentService {
  private repo = new LabourPaymentRepository();
  private workLogRepo = new LabourWorkLogRepository();

  async getPayments(filters: { labourId?: number; projectId?: number; status?: string; startDate?: string; endDate?: string; managerId?: number } = {}): Promise<LabourPaymentRow[]> {
    return await this.repo.findAll(filters);
  }

  async getPaymentById(id: number): Promise<LabourPaymentRow> {
    const payment = await this.repo.findById(id);
    if (!payment) throw new Error('Labour payment voucher not found');
    return payment;
  }

  async createPayment(data: {
    labour_id: number;
    project_id?: number | null;
    payment_date: string;
    payment_method?: string;
    reference_number?: string | null;
    remarks?: string | null;
    created_by?: number | null;
    work_log_ids?: number[];
    total_amount?: number;
    total_hours?: number;
  }): Promise<LabourPaymentRow> {
    if (!data.labour_id) throw new Error('Labour selection is required');
    if (!data.payment_date) throw new Error('Payment date is required');

    // Calculate total hours & total amount from selected work logs
    let totalHours = data.total_hours || 0;
    let totalAmount = data.total_amount || 0;

    if (data.work_log_ids && data.work_log_ids.length > 0) {
      for (const logId of data.work_log_ids) {
        const log = await this.workLogRepo.findById(logId);
        if (!log) throw new Error(`Work log ID ${logId} not found`);
        if (log.payment_status === 'paid') {
          throw new Error(`Work log on date ${log.work_date} for task '${log.task_name}' is already paid`);
        }
        if (data.total_hours === undefined) totalHours += Number(log.total_working_hours || 0);
        if (data.total_amount === undefined) totalAmount += Number(log.amount || 0);
      }
    } else if (totalAmount <= 0) {
      throw new Error('Total amount must be greater than zero when no attendance logs are selected');
    }

    const code = `PAY-L${data.labour_id}-${Date.now().toString().slice(-6)}`;

    const id = await this.repo.create({
      ...data,
      payment_code: code,
      total_hours: Math.round(totalHours * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      status: 'pending',
    });

    return (await this.repo.findById(id))!;
  }

  async updateStatus(id: number, status: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled', remarks?: string): Promise<LabourPaymentRow> {
    const payment = await this.repo.findById(id);
    if (!payment) throw new Error('Labour payment record not found');

    await this.repo.updateStatus(id, status, remarks);
    return (await this.repo.findById(id))!;
  }
}
