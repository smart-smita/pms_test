import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { roundDecimal } from '../services/calculation.service';

export interface CustomerPaymentScheduleRow {
  id: number;
  project_customer_id: number;
  project_wbs_id: number | null;
  wbs_name?: string | null;
  milestone_name: string;
  milestone_percentage: number;
  trigger_progress_percentage: number;
  installment_amount: number;
  gst_amount: number;
  tds_deductible_amount: number;
  net_receivable_amount: number;
  status: 'pending' | 'ready_to_bill' | 'billed' | 'paid';
  sort_order: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  unit_number?: string;
}

export class CustomerPaymentScheduleRepository {
  async getByProjectCustomerId(projectCustomerId: number): Promise<CustomerPaymentScheduleRow[]> {
    const sql = `
      SELECT 
        cps.*,
        w.wbs_name
      FROM customer_payment_schedules cps
      LEFT JOIN project_wbs pw ON cps.project_wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      WHERE cps.project_customer_id = ?
      ORDER BY cps.sort_order ASC, cps.id ASC
    `;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, [projectCustomerId]);
    return rows as CustomerPaymentScheduleRow[];
  }

  async getByProjectId(projectId: number): Promise<CustomerPaymentScheduleRow[]> {
    const sql = `
      SELECT 
        cps.*,
        pc.unit_number,
        c.customer_name,
        w.wbs_name
      FROM customer_payment_schedules cps
      JOIN project_customers pc ON cps.project_customer_id = pc.id
      JOIN customers c ON pc.customer_id = c.customer_id
      LEFT JOIN project_wbs pw ON cps.project_wbs_id = pw.id
      LEFT JOIN work_breakdown_structures w ON pw.wbs_id = w.id
      WHERE pc.project_id = ?
      ORDER BY pc.unit_number ASC, cps.sort_order ASC
    `;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, [projectId]);
    return rows as CustomerPaymentScheduleRow[];
  }

  async createBatch(schedules: {
    project_customer_id: number;
    project_wbs_id?: number | null;
    milestone_name: string;
    milestone_percentage: number;
    trigger_progress_percentage: number;
    installment_amount: number;
    gst_amount: number;
    tds_deductible_amount?: number;
    net_receivable_amount: number;
    sort_order?: number;
  }[]): Promise<void> {
    if (schedules.length === 0) return;

    const values = schedules.map(s => [
      s.project_customer_id,
      s.project_wbs_id || null,
      s.milestone_name,
      s.milestone_percentage,
      s.trigger_progress_percentage,
      s.installment_amount,
      s.gst_amount,
      s.tds_deductible_amount || 0.00,
      s.net_receivable_amount,
      s.sort_order || 1
    ]);

    const sql = `
      INSERT INTO customer_payment_schedules (
        project_customer_id, project_wbs_id, milestone_name,
        milestone_percentage, trigger_progress_percentage, installment_amount,
        gst_amount, tds_deductible_amount, net_receivable_amount, sort_order
      ) VALUES ?
    `;
    await dbPool.query<ResultSetHeader>(sql, [values]);
  }

  async updateStatus(id: number, status: 'pending' | 'ready_to_bill' | 'billed' | 'paid'): Promise<boolean> {
    const [res] = await dbPool.query<ResultSetHeader>(
      `UPDATE customer_payment_schedules SET status = ? WHERE id = ?`,
      [status, id]
    );
    return res.affectedRows > 0;
  }

  /**
   * Helper to generate the reference milestone schedule based on Agreement Value:
   * 1. Booking: 10%
   * 2. Agreement Execution: 20%
   * 3. Plinth: 15%
   * 4. 1st Slab: 10%
   * 5. 2nd Slab: 10%
   * 6. Brickwork & Plaster: 15%
   * 7. Flooring & Finishing: 15%
   * 8. Handover / Possession: 5%
   */
  async generateDefaultMilestones(projectCustomerId: number, agreementValue: number, effectiveGstPct: number = 8.00): Promise<void> {
    const defaultMilestones = [
      { name: 'On Booking / Token', pct: 10.00, triggerPct: 0.00 },
      { name: 'On Agreement Execution', pct: 20.00, triggerPct: 0.00 },
      { name: 'On Plinth Level Completion', pct: 15.00, triggerPct: 15.00 },
      { name: 'On Completion of 1st Floor Slab', pct: 10.00, triggerPct: 30.00 },
      { name: 'On Completion of Top Floor Slab', pct: 10.00, triggerPct: 50.00 },
      { name: 'On Completion of Brickwork & Internal Plaster', pct: 15.00, triggerPct: 75.00 },
      { name: 'On Completion of Flooring & Finishing', pct: 15.00, triggerPct: 90.00 },
      { name: 'On Notice of Possession / Handover', pct: 5.00, triggerPct: 100.00 }
    ];

    const isTdsApplicable = agreementValue >= 5000000; // Section 194-IA threshold: >= 50 Lakhs
    const schedules = defaultMilestones.map((m, idx) => {
      const instAmount = roundDecimal((agreementValue * m.pct) / 100);
      const gst = roundDecimal((instAmount * effectiveGstPct) / 100);
      const tds = isTdsApplicable ? roundDecimal((instAmount * 1.00) / 100) : 0.00;
      const net = roundDecimal(instAmount + gst - tds);

      return {
        project_customer_id: projectCustomerId,
        milestone_name: m.name,
        milestone_percentage: m.pct,
        trigger_progress_percentage: m.triggerPct,
        installment_amount: instAmount,
        gst_amount: gst,
        tds_deductible_amount: tds,
        net_receivable_amount: net,
        sort_order: idx + 1
      };
    });

    await this.createBatch(schedules);
  }
}
