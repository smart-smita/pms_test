import { SettingService } from './setting.service';
import { InvoiceRepository, BillingScheduleRow, MonthlyCompletedWorkRow, InvoiceRow, InvoicePaymentRow } from '../repositories/invoice.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { dbPool } from '../config/db';

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
    currency_id?: number;
    tax_id?: number | null;
    tax_type?: string | null;
    tax_percentage?: number;
    cgst_amount?: number;
    sgst_amount?: number;
    igst_amount?: number;
    tax_amount?: number;
    invoice_type?: 'combined' | 'labour' | 'material';
    items: {
      discipline_id?: number | null;
      description: string;
      amount: number;
      is_extra_work: boolean | number;
      item_type?: 'labour' | 'material' | 'other';
      project_wbs_id?: number | null;
      task_id?: number | null;
      quantity?: number | null;
      rate?: number | null;
    }[];
    created_by: number;
  }): Promise<number> {
    const schedule = await this.repo.getScheduleById(data.schedule_id);
    if (!schedule) throw new Error("Schedule not found");

    const projectId = data.project_id || schedule.project_id;
    const quotationId = data.quotation_id || schedule.quotation_id;
    const invoiceType = data.invoice_type || 'combined';

    // 1. Duplicate check: prevent duplicate active invoices for same schedule and type
    const existing = await this.repo.findInvoiceByScheduleAndType(projectId, data.schedule_id, invoiceType);
    if (existing) {
      throw new Error(`An active ${invoiceType} invoice already exists for this billing schedule (${existing.invoice_number}).`);
    }

    // If attempting combined invoice, check if either labour or material is already invoiced
    if (invoiceType === 'combined') {
      const existingLabour = await this.repo.findInvoiceByScheduleAndType(projectId, data.schedule_id, 'labour');
      const existingMaterial = await this.repo.findInvoiceByScheduleAndType(projectId, data.schedule_id, 'material');
      if (existingLabour || existingMaterial) {
        throw new Error(
          `Cannot generate a Combined invoice because separate ${existingLabour ? 'Labour' : ''}${existingLabour && existingMaterial ? ' and ' : ''}${existingMaterial ? 'Material' : ''} invoices already exist for this billing schedule.`
        );
      }
    }
    
    let customerId = data.customer_id;
    const project = await this.projectRepo.findById(projectId);
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

    // 2. Currency synchronization: Quotation -> Project -> Invoice
    // If currency_id is not passed, automatically inherit from project's currency
    let currencyId = data.currency_id;
    if (!currencyId && project?.currency_id) {
      currencyId = project.currency_id;
    }
    if (!currencyId) {
      currencyId = 2; // Default to base currency if not set
    }

    // Generate Invoice Number (e.g. INV-PRJ8-LAB-328816)
    const typeTag = invoiceType === 'labour' ? 'LAB' : (invoiceType === 'material' ? 'MAT' : 'INV');
    const invoiceNumber = `${typeTag}-${projectId}-${Date.now().toString().slice(-6)}`;
    
    const subtotal = data.items.reduce((sum, item) => sum + Number(item.amount), 0);
    const taxAmt = data.tax_amount !== undefined ? Number(data.tax_amount) : (data.tax_percentage ? (subtotal * data.tax_percentage) / 100 : 0);
    const totalAmt = subtotal + taxAmt;
    
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + 30); // 30 days due

    const id = await this.repo.createInvoice({
      invoice_number: invoiceNumber,
      customer_id: customerId,
      project_id: projectId,
      quotation_id: quotationId,
      schedule_id: data.schedule_id,
      survey_id: data.survey_id || null,
      currency_id: currencyId,
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
      invoice_type: invoiceType,
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
        is_extra_work: item.is_extra_work,
        item_type: item.item_type || (item.description.startsWith('Labour:') ? 'labour' : (item.description.startsWith('Material:') ? 'material' : 'other')),
        project_wbs_id: item.project_wbs_id || null,
        task_id: item.task_id || null,
        quantity: item.quantity !== undefined ? item.quantity : null,
        rate: item.rate !== undefined ? item.rate : null,
      })));
    }

    // If combined invoice, schedule is fully invoiced.
    // If separate, check if both labour and material now exist
    if (invoiceType === 'combined') {
      await this.repo.updateScheduleStatus(data.schedule_id, 'invoiced');
    } else {
      const otherType = invoiceType === 'labour' ? 'material' : 'labour';
      const existingOther = await this.repo.findInvoiceByScheduleAndType(projectId, data.schedule_id, otherType);
      if (existingOther) {
        await this.repo.updateScheduleStatus(data.schedule_id, 'invoiced');
      }
    }

    return id;
  }

  /**
   * Automate Invoice Updates When Task Details Change.
   * Recalculates line items and totals for draft invoices of this project.
   * Preserves approved, sent, or paid invoices completely untouched.
   */
  async syncDraftInvoicesForProject(projectId: number, taskId?: number, userId?: number): Promise<void> {
    try {
      const draftInvoices = await this.repo.findDraftInvoicesByProject(projectId);
      if (draftInvoices.length === 0) return;

      const costs = await this.getProjectCosts(projectId);

      for (const draft of draftInvoices) {
        // Build fresh items based on invoice type
        let newItems: any[] = [];
        const type = draft.invoice_type || 'combined';

        if (type === 'labour' || type === 'combined') {
          for (const l of costs.labour_items) {
            newItems.push({
              discipline_id: l.wbs_id || null,
              description: `Labour: ${l.labour_name} (${l.labour_type === 'direct_labour' ? 'Direct' : 'Contractor'}) - ${l.work_description || l.task_name} [${l.work_date}]`,
              amount: Number(l.amount || 0),
              is_extra_work: 0,
              item_type: 'labour',
              project_wbs_id: l.wbs_id || null,
              task_id: l.task_id || null,
              quantity: Number(l.total_working_hours || 0),
              rate: Number(l.rate || 0),
            });
          }
        }

        if (type === 'material' || type === 'combined') {
          for (const m of costs.material_items) {
            newItems.push({
              discipline_id: m.discipline_id || m.wbs_id || null,
              description: `Material: ${m.material_name} (${Number(m.quantity)} ${m.unit} @ ₹${Number(m.rate).toFixed(2)}) - ${m.task_name}`,
              amount: Number(m.amount || 0),
              cost_amount: Number(m.cost_amount || 0),
              is_extra_work: 0,
              item_type: 'material',
              project_wbs_id: m.project_wbs_id || m.wbs_id || null,
              task_id: m.task_id || null,
              quotation_wbs_material_id: m.quotation_wbs_material_id || null,
              project_material_id: m.project_material_id || null,
              consumption_log_id: m.consumption_log_id || null,
              quantity: Number(m.quantity || 0),
              rate: Number(m.rate || 0), // Quotation billing rate
              cost_rate: Number(m.cost_rate || 0), // Procurement cost rate snapshot
            });
          }
        }

        // If no cost items, retain existing milestone item
        if (newItems.length === 0) continue;

        // Recalculate subtotal & taxes
        const subtotal = newItems.reduce((s, it) => s + Number(it.amount), 0);
        let taxAmt = 0;
        let cgstAmt = 0;
        let sgstAmt = 0;
        let igstAmt = 0;

        if (draft.tax_id) {
          const [taxRows]: any = await dbPool.query('SELECT * FROM taxes WHERE tax_id = ?', [draft.tax_id]);
          const tax = taxRows[0];
          if (tax) {
            const taxPct = Number(tax.tax_percentage || 0);
            const isSplit = Boolean(tax.is_split || tax.tax_type === 'CGST_SGST');
            if (isSplit) {
              const half = taxPct / 2;
              cgstAmt = (subtotal * half) / 100;
              sgstAmt = (subtotal * half) / 100;
              taxAmt = cgstAmt + sgstAmt;
            } else if (tax.tax_type === 'IGST') {
              igstAmt = (subtotal * taxPct) / 100;
              taxAmt = igstAmt;
            } else {
              taxAmt = (subtotal * taxPct) / 100;
            }
          }
        }

        const totalAmt = subtotal + taxAmt;

        // Atomically replace line items & update invoice amounts
        await this.repo.deleteInvoiceItems(draft.invoice_id);
        await this.repo.createInvoiceItems(draft.invoice_id, newItems);
        await this.repo.updateInvoiceAmounts(draft.invoice_id, {
          subtotal_amount: subtotal,
          tax_amount: taxAmt,
          cgst_amount: cgstAmt,
          sgst_amount: sgstAmt,
          igst_amount: igstAmt,
          total_amount: totalAmt,
        });

        // Audit log trail
        await dbPool.query(
          `INSERT INTO audit_logs (user_id, action, module, description, record_id, created_at)
           VALUES (?, 'AUTO_SYNC', 'invoices', ?, ?, NOW())`,
          [
            userId || null,
            `Draft invoice #${draft.invoice_number} auto-updated: subtotal ₹${subtotal.toFixed(2)}, total ₹${totalAmt.toFixed(2)}${taskId ? ` (Task #${taskId} modified)` : ''}`,
            draft.invoice_id
          ]
        ).catch(() => {});
      }
    } catch (err: any) {
      console.error('Error during syncDraftInvoicesForProject:', err);
    }
  }

  /**
   * Approves a draft invoice.
   * - Marks status 'approved' and records approved_by.
   * - Locks consumed stock: increments billed_qty on linked stock_ledger consumption logs.
   * - Enforces immutability: approved invoices can never be edited directly.
   */
  async approveInvoice(id: number, userId: number): Promise<void> {
    const invoice = await this.repo.getInvoiceById(id);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'approved' || invoice.status === 'paid') {
      return; // Idempotent
    }
    if (invoice.status === 'cancelled') {
      throw new Error('Cancelled invoices cannot be approved');
    }

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(`UPDATE invoices SET status = 'approved', approved_by = ? WHERE invoice_id = ?`, [userId, id]);

      // Lock consumed stock as billed in stock_ledger
      const sources = await this.repo.getInvoiceSources(id);
      for (const s of sources) {
        if (s.consumption_log_id && Number(s.billed_qty) > 0) {
          await conn.query(
            `UPDATE stock_ledger SET billed_qty = billed_qty + ? WHERE ledger_id = ?`,
            [Number(s.billed_qty), s.consumption_log_id]
          );
        }
      }

      await conn.commit();

      await dbPool.query(
        `INSERT INTO audit_logs (user_id, action, module, description, record_id, created_at)
         VALUES (?, 'APPROVE', 'invoices', ?, ?, NOW())`,
        [userId, `Invoice #${invoice.invoice_number} approved and marked immutable. Consumed materials locked as billed.`, id]
      ).catch(() => {});
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  /**
   * Regenerates a draft invoice from latest project sources.
   * Throws 403 / error if invoice is approved or paid (immutable).
   */
  async regenerateDraftInvoice(id: number, userId?: number): Promise<InvoiceRow> {
    const invoice = await this.repo.getInvoiceById(id);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'draft') {
      throw new Error(`Approved or paid invoices are immutable (current status: '${invoice.status}'). Corrections must be processed via credit note or revision.`);
    }

    await this.syncDraftInvoicesForProject(invoice.project_id, undefined, userId);

    const updated = await this.repo.getInvoiceById(id);
    if (!updated) throw new Error('Failed to retrieve regenerated invoice');
    return updated;
  }

  /**
   * Issues a Credit Note against an approved/paid invoice.
   * Creates a credit note invoice (is_credit_note = 1) with negative amounts.
   * Releases stock_ledger.billed_qty on credited consumption logs.
   */
  async createCreditNote(invoiceId: number, data: { reason: string; items?: any[] }, userId: number) {
    if (!data.reason || data.reason.trim().length < 5) {
      throw new Error('A mandatory credit note reason (min 5 characters) is required');
    }

    const original = await this.repo.getInvoiceById(invoiceId);
    if (!original) throw new Error('Original invoice not found');
    if (original.status === 'draft') {
      throw new Error('Cannot issue credit note against draft invoice. Edit or regenerate the draft instead.');
    }

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      const cnNumber = `CN-${original.invoice_number}-${Date.now().toString().slice(-4)}`;
      const now = new Date().toISOString().split('T')[0];

      // Credit amounts (negative)
      const subtotal = -Math.abs(Number(original.subtotal_amount || 0));
      const taxAmt = -Math.abs(Number(original.tax_amount || 0));
      const cgst = -Math.abs(Number(original.cgst_amount || 0));
      const sgst = -Math.abs(Number(original.sgst_amount || 0));
      const igst = -Math.abs(Number(original.igst_amount || 0));
      const total = -Math.abs(Number(original.total_amount || 0));

      const [res]: any = await conn.query(
        `INSERT INTO invoices (
           invoice_number, customer_id, project_id, original_invoice_id, quotation_id,
           schedule_id, currency_id, tax_id, tax_type, invoice_date, due_date,
           subtotal_amount, tax_amount, cgst_amount, sgst_amount, igst_amount, total_amount,
           invoice_type, is_credit_note, credit_note_reason, status, created_by, approved_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'credit_note', 1, ?, 'approved', ?, ?)`,
        [
          cnNumber,
          original.customer_id,
          original.project_id,
          original.invoice_id,
          original.quotation_id,
          original.schedule_id,
          original.currency_id,
          original.tax_id,
          original.tax_type,
          now,
          now,
          subtotal,
          taxAmt,
          cgst,
          sgst,
          igst,
          total,
          data.reason,
          userId,
          userId,
        ]
      );

      const cnId = res.insertId;

      // Release billed quantities in stock_ledger for credited material sources
      const origSources = await this.repo.getInvoiceSources(original.invoice_id);
      for (const s of origSources) {
        if (s.consumption_log_id && Number(s.billed_qty) > 0) {
          await conn.query(
            `UPDATE stock_ledger 
             SET billed_qty = GREATEST(0.00, billed_qty - ?) 
             WHERE ledger_id = ?`,
            [Number(s.billed_qty), s.consumption_log_id]
          );
        }
      }

      await conn.commit();

      await dbPool.query(
        `INSERT INTO audit_logs (user_id, action, module, description, record_id, created_at)
         VALUES (?, 'CREATE_CREDIT_NOTE', 'invoices', ?, ?, NOW())`,
        [userId, `Credit Note #${cnNumber} issued for invoice #${original.invoice_number} (Amount: ₹${total}). Reason: ${data.reason}`, cnId]
      ).catch(() => {});

      return { credit_note_id: cnId, invoice_number: cnNumber, total_amount: total };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  /**
   * Revises an approved invoice (Revision Flow).
   * Releases previous billed quantities, supersedes the old invoice,
   * and generates a new draft revision with revision_number = original.revision_number + 1.
   */
  async createRevision(invoiceId: number, data: { reason: string }, userId: number) {
    if (!data.reason || data.reason.trim().length < 5) {
      throw new Error('A mandatory revision reason (min 5 characters) is required');
    }

    const original = await this.repo.getInvoiceById(invoiceId);
    if (!original) throw new Error('Original invoice not found');
    if (original.status === 'draft') {
      throw new Error('Draft invoices can be regenerated directly. Revision is for approved invoices.');
    }
    if (original.status === 'paid') {
      throw new Error('Paid invoices cannot be revised directly; use the credit-note flow instead.');
    }

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Release billed quantities in stock_ledger from original invoice
      const origSources = await this.repo.getInvoiceSources(original.invoice_id);
      for (const s of origSources) {
        if (s.consumption_log_id && Number(s.billed_qty) > 0) {
          await conn.query(
            `UPDATE stock_ledger 
             SET billed_qty = GREATEST(0.00, billed_qty - ?) 
             WHERE ledger_id = ?`,
            [Number(s.billed_qty), s.consumption_log_id]
          );
        }
      }

      // 2. Mark original invoice as cancelled / superseded
      await conn.query(
        `UPDATE invoices 
         SET status = 'cancelled', credit_note_reason = ? 
         WHERE invoice_id = ?`,
        [`Superseded by revision R${Number(original.revision_number || 0) + 1}. Reason: ${data.reason}`, original.invoice_id]
      );

      // 3. Create revised draft invoice
      const newRevNum = Number(original.revision_number || 0) + 1;
      const revNumber = `${original.invoice_number.replace(/-R\d+$/, '')}-R${newRevNum}`;
      const now = new Date().toISOString().split('T')[0];

      const [res]: any = await conn.query(
        `INSERT INTO invoices (
           invoice_number, customer_id, project_id, original_invoice_id, quotation_id,
           schedule_id, currency_id, tax_id, tax_type, invoice_date, due_date,
           subtotal_amount, tax_amount, cgst_amount, sgst_amount, igst_amount, total_amount,
           invoice_type, revision_number, status, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, ?, ?, 'draft', ?)`,
        [
          revNumber,
          original.customer_id,
          original.project_id,
          original.invoice_id,
          original.quotation_id,
          original.schedule_id,
          original.currency_id,
          original.tax_id,
          original.tax_type,
          now,
          original.due_date,
          original.invoice_type || 'combined',
          newRevNum,
          userId,
        ]
      );

      const revId = res.insertId;

      await conn.commit();

      // 4. Auto-populate lines from unbilled sources for new revision
      await this.syncDraftInvoicesForProject(original.project_id, undefined, userId);

      await dbPool.query(
        `INSERT INTO audit_logs (user_id, action, module, description, record_id, created_at)
         VALUES (?, 'REVISE_INVOICE', 'invoices', ?, ?, NOW())`,
        [userId, `Invoice #${original.invoice_number} revised as #${revNumber}. Reason: ${data.reason}`, revId]
      ).catch(() => {});

      return { revised_invoice_id: revId, invoice_number: revNumber };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  async getInvoiceSources(invoiceId: number) {
    return this.repo.getInvoiceSources(invoiceId);
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

  // ── Project Costs for Invoicing ────────────────────────────────────────────
  async getProjectCosts(projectId: number) {
    const costs = await this.repo.getProjectCosts(projectId);
    const category = await SettingService.getWorkCategory();
    if (category === 'material') {
      costs.labour_items = [];
      costs.total_labour_amount = 0;
      costs.total_cost = Number(costs.total_material_amount || 0);
    } else if (category === 'labour') {
      costs.material_items = [];
      costs.total_material_amount = 0;
      costs.total_cost = Number(costs.total_labour_amount || 0);
    }
    return costs;
  }
}

