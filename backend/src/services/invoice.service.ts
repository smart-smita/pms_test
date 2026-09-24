import { InvoiceRepository, BillingScheduleRow, MonthlyCompletedWorkRow, InvoiceRow, InvoicePaymentRow } from '../repositories/invoice.repository';
import { ProjectRepository } from '../repositories/project.repository';

export class InvoiceService {
  private repo = new InvoiceRepository();
  private projectRepo = new ProjectRepository();

  // ── Billing Schedules ──────────────────────────────────────────────────
  async getSchedulesByProject(projectId: number): Promise<BillingScheduleRow[]> {
    return this.repo.getSchedulesByProject(projectId);
  }

  async generateBillingSchedules(data: {
    project_id: number;
    quotation_id: number;
    start_month: string; // YYYY-MM
    contract_period_months: number;
    total_amount: number;
  }): Promise<BillingScheduleRow[]> {
    if (data.contract_period_months <= 0) {
      throw new Error("Contract period must be greater than 0");
    }
    
    // Check if schedules already exist
    const existing = await this.repo.getSchedulesByProject(data.project_id);
    if (existing.length > 0) {
      throw new Error("Billing schedules already exist for this project.");
    }

    const monthlyAmount = Math.round((data.total_amount / data.contract_period_months) * 100) / 100;
    
    const [yearStr, monthStr] = data.start_month.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);

    const schedules: Omit<BillingScheduleRow, 'schedule_id' | 'status' | 'created_at'>[] = [];
    
    for (let i = 0; i < data.contract_period_months; i++) {
      // Ensure month is 1-12
      let m = month + i;
      let y = year;
      while (m > 12) {
        m -= 12;
        y += 1;
      }
      const formattedMonth = `${y}-${m.toString().padStart(2, '0')}-01`;
      
      // Calculate exact amount for last month to handle rounding errors
      let amount = monthlyAmount;
      if (i === data.contract_period_months - 1) {
        amount = data.total_amount - (monthlyAmount * (data.contract_period_months - 1));
        amount = Math.round(amount * 100) / 100;
      }

      schedules.push({
        project_id: data.project_id,
        quotation_id: data.quotation_id,
        billing_month: formattedMonth,
        expected_amount: amount
      });
    }

    await this.repo.createSchedulesBatch(schedules);
    return this.repo.getSchedulesByProject(data.project_id);
  }

  // ── Monthly Completed Work ───────────────────────────────────────────────
  async getCompletedWorkByProject(projectId: number): Promise<MonthlyCompletedWorkRow[]> {
    return this.repo.getCompletedWorkByProject(projectId);
  }

  async submitCompletedWork(data: {
    schedule_id: number;
    project_id: number;
    completion_percentage: number;
    approved_amount: number;
  }): Promise<number> {
    const schedule = await this.repo.getScheduleById(data.schedule_id);
    if (!schedule) throw new Error("Schedule not found");
    if (schedule.status !== 'pending') throw new Error("Schedule is not pending");

    const id = await this.repo.createCompletedWork({
      schedule_id: data.schedule_id,
      project_id: data.project_id,
      completion_percentage: data.completion_percentage,
      approved_amount: data.approved_amount
    });
    
    await this.repo.updateScheduleStatus(data.schedule_id, 'completed_work_logged');
    return id;
  }

  // ── Invoices ─────────────────────────────────────────────────────────────
  async getInvoices(projectId?: number): Promise<InvoiceRow[]> {
    return this.repo.getInvoices(projectId);
  }

  async getInvoiceById(id: number): Promise<InvoiceRow | null> {
    return this.repo.getInvoiceById(id);
  }

  async generateInvoice(data: {
    customer_id: number;
    project_id: number;
    quotation_id: number;
    schedule_id: number;
    survey_id?: number | null;
    currency_id: number;
    tax_id?: number | null;
    tax_percentage?: number;
    items: {
      discipline_id?: number | null;
      description: string;
      amount: number;
      is_extra_work: boolean | number;
    }[];
    created_by: number;
  }): Promise<number> {
    const schedule = await this.repo.getScheduleById(data.schedule_id);
    if (!schedule) throw new Error("Schedule not found");
    if (schedule.status === 'invoiced' || schedule.status === 'paid') {
      throw new Error("This month is already invoiced.");
    }

    // Generate Invoice Number (e.g. INV-PRJ1-YYYYMM-01)
    const invoiceNumber = `INV-${data.project_id}-${Date.now().toString().slice(-6)}`;
    
    const subtotal = data.items.reduce((sum, item) => sum + Number(item.amount), 0);
    const taxAmt = data.tax_percentage ? (subtotal * data.tax_percentage) / 100 : 0;
    const totalAmt = subtotal + taxAmt;
    
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + 30); // 30 days due

    const id = await this.repo.createInvoice({
      invoice_number: invoiceNumber,
      customer_id: data.customer_id,
      project_id: data.project_id,
      quotation_id: data.quotation_id,
      schedule_id: data.schedule_id,
      survey_id: data.survey_id || null,
      currency_id: data.currency_id,
      tax_id: data.tax_id || null,
      invoice_date: now.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      subtotal_amount: subtotal,
      tax_amount: taxAmt,
      total_amount: totalAmt,
      status: 'draft',
      created_by: data.created_by,
      approved_by: null
    });

    if (data.items && data.items.length > 0) {
      await this.repo.createInvoiceItems(id, data.items.map(item => ({
        invoice_id: id,
        discipline_id: item.discipline_id,
        description: item.description,
        amount: item.amount,
        is_extra_work: item.is_extra_work
      })));
    }

    await this.repo.updateScheduleStatus(data.schedule_id, 'invoiced');
    return id;
  }

  async approveInvoice(id: number, userId: number): Promise<void> {
    await this.repo.updateInvoiceStatus(id, 'approved', userId);
  }

  // ── Invoice Payments ───────────────────────────────────────────────────────
  async getPaymentsByInvoice(invoiceId: number): Promise<InvoicePaymentRow[]> {
    return this.repo.getPaymentsByInvoice(invoiceId);
  }

  async addPayment(data: {
    invoice_id: number;
    payment_date: string;
    amount: number;
    payment_method?: string;
    reference_number?: string;
  }): Promise<number> {
    const invoice = await this.repo.getInvoiceById(data.invoice_id);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.status === 'paid') throw new Error("Invoice is already fully paid");
    if (invoice.status === 'draft' || invoice.status === 'pending_approval') {
      throw new Error("Cannot pay an unapproved invoice");
    }

    const paymentId = await this.repo.addPayment({
      invoice_id: data.invoice_id,
      payment_date: data.payment_date,
      amount: data.amount,
      payment_method: data.payment_method || null,
      reference_number: data.reference_number || null,
      status: 'completed'
    });

    const existingPayments = await this.repo.getPaymentsByInvoice(data.invoice_id);
    const totalPaid = existingPayments.reduce((sum, p) => sum + (p.status === 'completed' ? Number(p.amount) : 0), 0);
    const newTotalPaid = totalPaid + data.amount;

    if (newTotalPaid >= invoice.total_amount) {
      await this.repo.updateInvoiceStatus(data.invoice_id, 'paid');
    } else {
      await this.repo.updateInvoiceStatus(data.invoice_id, 'partially_paid');
    }

    return paymentId;
  }
}
