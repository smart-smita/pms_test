import { InvoiceRepository, BillingScheduleRow, MonthlyCompletedWorkRow, InvoiceRow, InvoicePaymentRow } from '../repositories/invoice.repository';
import { ProjectRepository } from '../repositories/project.repository';

export class InvoiceService {
  private repo = new InvoiceRepository();
  private projectRepo = new ProjectRepository();

  // ── Billing Schedules ──────────────────────────────────────────────────
  async getSchedulesByProject(projectId?: number): Promise<BillingScheduleRow[]> {
    return this.repo.getSchedulesByProject(projectId);
  }

  async generateBillingSchedules(data: {
    project_id: number;
    quotation_id?: number;
    start_month?: string; // YYYY-MM
    contract_period_months?: number;
    total_amount?: number;
  }): Promise<BillingScheduleRow[]> {
    // Check if schedules already exist
    const existing = await this.repo.getSchedulesByProject(data.project_id);
    if (existing.length > 0) {
      return existing;
    }

    let quotationId = data.quotation_id;
    let totalAmount = data.total_amount;
    let periodMonths = data.contract_period_months || 12;
    let startMonth = data.start_month || new Date().toISOString().slice(0, 7);

    // If quotation info is missing, fetch from project's latest approved quotation
    if (!quotationId || !totalAmount) {
      const details = await this.projectRepo.getProject360Details(data.project_id);
      if (!details?.quotation) {
        throw new Error(
          `Project ${data.project_id} has no approved quotation. ` +
          `Create and approve a quotation before generating billing schedules.`
        );
      }
      quotationId = details.quotation.quotation_id;
      totalAmount = Number(details.quotation.total_amount);
      if (!totalAmount || totalAmount <= 0) {
        throw new Error(`Quotation ${quotationId} has a zero or invalid total amount.`);
      }
    }

    const monthlyAmount = Math.round((totalAmount / periodMonths) * 100) / 100;
    
    const [yearStr, monthStr] = startMonth.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);

    const schedules: Omit<BillingScheduleRow, 'schedule_id' | 'status' | 'created_at'>[] = [];
    
    for (let i = 0; i < periodMonths; i++) {
      let m = month + i;
      let y = year;
      while (m > 12) {
        m -= 12;
        y += 1;
      }
      const formattedMonth = `${y}-${m.toString().padStart(2, '0')}-01`;
      
      let amount = monthlyAmount;
      if (i === periodMonths - 1) {
        amount = totalAmount - (monthlyAmount * (periodMonths - 1));
        amount = Math.round(amount * 100) / 100;
      }

      schedules.push({
        project_id: data.project_id,
        quotation_id: quotationId as number,
        billing_month: formattedMonth,
        expected_amount: amount
      });
    }

    await this.repo.createSchedulesBatch(schedules);
    return this.repo.getSchedulesByProject(data.project_id);
  }

  // ── Monthly Completed Work ───────────────────────────────────────────────
  async getCompletedWorkByProject(projectId?: number): Promise<MonthlyCompletedWorkRow[]> {
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

    const id = await this.repo.createCompletedWork({
      schedule_id: data.schedule_id,
      project_id: data.project_id,
      completion_percentage: data.completion_percentage,
      approved_amount: data.approved_amount
    });
    
    await this.repo.updateScheduleStatus(data.schedule_id, 'completed_work_logged');
    return id;
  }

  async updateCompletedWorkStatus(id: number, status: string, approvedBy?: number): Promise<void> {
    await this.repo.updateCompletedWorkStatus(id, status, approvedBy);
  }

  // ── Invoices ─────────────────────────────────────────────────────────────
  async getInvoices(projectId?: number): Promise<InvoiceRow[]> {
    return this.repo.getInvoices(projectId);
  }

  async getInvoiceById(id: number): Promise<InvoiceRow | null> {
    return this.repo.getInvoiceById(id);
  }

  async generateInvoice(data: {
    customer_id?: number;
    project_id?: number;
    quotation_id?: number;
    schedule_id: number;
    survey_id?: number | null;
    currency_id: number;
    tax_id?: number | null;
    tax_type?: string | null;
    tax_percentage?: number;
    cgst_amount?: number;
    sgst_amount?: number;
    igst_amount?: number;
    tax_amount?: number;
    items: {
      discipline_id?: number | null;
      description: string;
      amount: number;
      is_extra_work: boolean | number;
    }[];
    created_by: number;
    status?: InvoiceRow['status'];
  }): Promise<number> {
    const schedule = await this.repo.getScheduleById(data.schedule_id);
    if (!schedule) throw new Error("Schedule not found");
    if (schedule.status === 'invoiced' || schedule.status === 'paid') {
      throw new Error("This month is already invoiced.");
    }

    const projectId = data.project_id || schedule.project_id;
    const quotationId = data.quotation_id || schedule.quotation_id;
    
    const project = await this.projectRepo.findById(projectId);
    let customerId = data.customer_id;
    if (!customerId) {
      if (project?.customer_id) {
        customerId = project.customer_id;
      } else {
        throw new Error(
          `Project ${projectId} has no associated customer. ` +
          `Set customer_id on the project before generating an invoice.`
        );
      }
    }

    // Generate Invoice Number (e.g. INV-PRJ1-YYYYMM-01) - ensure no undefined
    const projectCode = (project?.project_code || `PRJ${projectId}`).replace(/[^a-zA-Z0-9_-]/g, '');
    const monthPart = (schedule.billing_month ? String(schedule.billing_month) : new Date().toISOString().slice(0, 10)).replace(/-/g, '').slice(0, 6);
    const invoiceNumber = `INV-${projectCode}-${monthPart}-${Date.now().toString().slice(-4)}`;
    
    const subtotal = data.items.reduce((sum, item) => sum + Number(item.amount), 0);
    const taxAmt = data.tax_amount !== undefined ? Number(data.tax_amount) : (data.tax_percentage ? (subtotal * data.tax_percentage) / 100 : 0);
    const totalAmt = subtotal + taxAmt;
    
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + 30); // 30 days due

    const initialStatus = data.status || 'pending_approval';

    const id = await this.repo.createInvoice({
      invoice_number: invoiceNumber,
      customer_id: customerId,
      project_id: projectId,
      quotation_id: quotationId,
      schedule_id: data.schedule_id,
      survey_id: data.survey_id || null,
      currency_id: data.currency_id,
      tax_id: data.tax_id || null,
      tax_type: data.tax_type || null,
      cgst_amount: data.cgst_amount || 0,
      sgst_amount: data.sgst_amount || 0,
      igst_amount: data.igst_amount || 0,
      invoice_date: now.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      subtotal_amount: subtotal,
      tax_amount: taxAmt,
      total_amount: totalAmt,
      status: initialStatus,
      created_by: data.created_by,
      approved_by: initialStatus === 'approved' ? data.created_by : null
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
    const invoice = await this.repo.getInvoiceById(id);
    if (!invoice) throw new Error("Invoice not found");

    await this.repo.updateInvoiceStatus(id, 'approved', userId);

    // If attached to a schedule, ensure completed work is also approved
    if (invoice.schedule_id) {
      await this.repo.approveCompletedWorkByScheduleId(invoice.schedule_id, userId);
    }
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
    if (invoice.status === 'cancelled') throw new Error("Cannot pay a cancelled invoice");
    if (invoice.status === 'draft' || invoice.status === 'pending_approval') {
      throw new Error("Cannot pay an unapproved invoice");
    }

    const paymentAmount = Number(data.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    const alreadyPaid = Number(invoice.paid_amount || 0);
    const outstanding = Math.round((Number(invoice.total_amount) - alreadyPaid) * 100) / 100;
    if (paymentAmount > outstanding + 0.01) {
      throw new Error(`Payment amount cannot exceed outstanding balance of ${outstanding.toFixed(2)}`);
    }

    const paymentId = await this.repo.addPayment({
      invoice_id: data.invoice_id,
      payment_date: data.payment_date,
      amount: paymentAmount,
      payment_method: data.payment_method || null,
      reference_number: data.reference_number || null,
      status: 'completed'
    });

    const existingPayments = await this.repo.getPaymentsByInvoice(data.invoice_id);
    const totalPaid = existingPayments.reduce((sum, p) => sum + (p.status === 'completed' ? Number(p.amount) : 0), 0);

    if (totalPaid >= Number(invoice.total_amount) - 0.01) {
      await this.repo.updateInvoiceStatus(data.invoice_id, 'paid');
      if (invoice.schedule_id) {
        await this.repo.updateScheduleStatus(invoice.schedule_id, 'paid');
      }
    } else if (totalPaid > 0) {
      await this.repo.updateInvoiceStatus(data.invoice_id, 'partially_paid');
    }

    return paymentId;
  }
}
