import { dbPool } from '../config/db';
import { roundDecimal } from './calculation.service';
import { AuditService } from './audit.service';

export interface ProjectCashPosition {
  project_id: number;
  project_name: string;
  project_code: string;
  total_inflows: number;
  customer_receipts_cleared: number;
  total_outflows: number;
  vendor_payments_disbursed: number;
  labour_payments_disbursed: number;
  equipment_costs_incurred: number;
  net_available_cash: number;
  budget_amount: number;
  committed_po_amount: number;
  is_cash_deficit: boolean;
}

export class CashControlService {
  async getProjectCashPosition(projectId: number): Promise<ProjectCashPosition> {
    const [projRows]: any = await dbPool.query(
      `SELECT project_id, project_name, project_code, COALESCE(budget_amount, 0.00) AS budget_amount
       FROM projects WHERE project_id = ?`,
      [projectId]
    );
    if (projRows.length === 0) throw new Error(`Project ${projectId} not found`);
    const proj = projRows[0];

    // Inflows: customer receipts
    const [custReceiptRows]: any = await dbPool.query(
      `SELECT COALESCE(SUM(crv.total_amount_received), 0.00) AS total_receipts
       FROM customer_receipt_vouchers crv
       JOIN project_customers pc ON crv.project_customer_id = pc.id
       WHERE pc.project_id = ? AND crv.clearance_status = 'realised'`,
      [projectId]
    );
    const customerReceipts = Number(custReceiptRows[0].total_receipts || 0);

    // Fallback inflows from generic invoice_payments if customer_receipt_vouchers is empty
    let fallbackReceipts = 0;
    if (customerReceipts === 0) {
      const [invPayRows]: any = await dbPool.query(
        `SELECT COALESCE(SUM(ip.amount), 0.00) AS total_payments
         FROM invoice_payments ip
         JOIN invoices inv ON ip.invoice_id = inv.invoice_id
         WHERE inv.project_id = ? AND ip.status = 'completed'`,
        [projectId]
      );
      fallbackReceipts = Number(invPayRows[0].total_payments || 0);
    }
    const totalInflows = roundDecimal(customerReceipts > 0 ? customerReceipts : fallbackReceipts);

    // Outflows: Vendor disbursements
    const [vendorPayRows]: any = await dbPool.query(
      `SELECT COALESCE(SUM(vp.amount), (SELECT COALESCE(SUM(paid_amount), 0.00) FROM vendor_invoices WHERE project_id = ?), 0.00) AS total_vendor_paid
       FROM vendor_payments vp
       JOIN vendor_invoices vi ON vp.vendor_invoice_id = vi.vendor_invoice_id
       WHERE vi.project_id = ?`,
      [projectId, projectId]
    );
    const vendorPayments = Number(vendorPayRows[0].total_vendor_paid || 0);

    // Outflows: Labour payouts
    const [labourPayRows]: any = await dbPool.query(
      `SELECT COALESCE(SUM(amount), 0.00) AS total_labour_paid
       FROM labour_work_logs
       WHERE project_id = ? AND payment_status = 'paid' AND (is_deleted = 0 OR is_deleted IS NULL)`,
      [projectId]
    );
    const labourPayments = Number(labourPayRows[0].total_labour_paid || 0);

    // Outflows: Equipment logged usage
    const [eqCostRows]: any = await dbPool.query(
      `SELECT COALESCE(SUM(total_cost), 0.00) AS total_eq_cost
       FROM equipment_usage_logs
       WHERE project_id = ?`,
      [projectId]
    );
    const equipmentCosts = Number(eqCostRows[0].total_eq_cost || 0);

    const totalOutflows = roundDecimal(vendorPayments + labourPayments + equipmentCosts);
    const netAvailableCash = roundDecimal(totalInflows - totalOutflows);

    // Committed Costs: approved purchase orders
    const [poCommitRows]: any = await dbPool.query(
      `SELECT COALESCE(SUM(total_amount), 0.00) AS committed_po
       FROM purchase_orders
       WHERE project_id = ? AND status IN ('approved', 'partially_received')`,
      [projectId]
    );
    const committedPo = Number(poCommitRows[0].committed_po || 0);

    return {
      project_id: projectId,
      project_name: proj.project_name,
      project_code: proj.project_code,
      total_inflows: totalInflows,
      customer_receipts_cleared: totalInflows,
      total_outflows: totalOutflows,
      vendor_payments_disbursed: roundDecimal(vendorPayments),
      labour_payments_disbursed: roundDecimal(labourPayments),
      equipment_costs_incurred: roundDecimal(equipmentCosts),
      net_available_cash: netAvailableCash,
      budget_amount: Number(proj.budget_amount || 0),
      committed_po_amount: roundDecimal(committedPo),
      is_cash_deficit: netAvailableCash < 0
    };
  }

  /**
   * Validates whether a proposed cash disbursement violates the cash position rule.
   * If cash position is deficient and no override is supplied, it blocks execution.
   */
  async checkDisbursementAllowed(params: {
    project_id: number;
    amount: number;
    transaction_type: 'purchase_order' | 'vendor_payment' | 'contractor_bill' | 'labour_payout';
    transaction_ref_id: number;
    user_id: number;
    override_reason?: string;
    allow_deficit_buffer?: number;
  }): Promise<{ allowed: boolean; message?: string; deficit?: number; override_logged?: boolean }> {
    const cashPos = await this.getProjectCashPosition(params.project_id);
    const buffer = Number(params.allow_deficit_buffer || 0.00);
    const projectedCash = cashPos.net_available_cash - params.amount;

    if (projectedCash + buffer < 0) {
      const deficit = Math.abs(projectedCash);

      // If user provided an explicit override reason
      if (params.override_reason && params.override_reason.trim().length >= 10) {
        await dbPool.query(
          `
          INSERT INTO project_cash_overdraft_overrides (
            project_id, attempted_transaction_type, transaction_reference_id,
            attempted_amount, current_cash_inflow, current_cash_outflow,
            deficit_amount, authorized_by, override_reason
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            params.project_id,
            params.transaction_type,
            params.transaction_ref_id,
            params.amount,
            cashPos.total_inflows,
            cashPos.total_outflows,
            deficit,
            params.user_id,
            params.override_reason.trim()
          ]
        );

        await AuditService.log({
          user_id: params.user_id,
          action: 'CASH_DEFICIT_OVERRIDE',
          module: 'cash_control',
          description: `Authorized cash deficit override of ₹${params.amount} on project ${params.project_id}. Deficit: ₹${deficit}. Reason: ${params.override_reason}`,
          record_id: params.project_id
        });

        return { allowed: true, deficit, override_logged: true };
      }

      return {
        allowed: false,
        deficit,
        message:
          `CASH DEFICIT BLOCK: Project '${cashPos.project_name}' has insufficient customer receipts. ` +
          `Available Cash: ₹${cashPos.net_available_cash.toLocaleString('en-IN')}, ` +
          `Attempted Outflow: ₹${params.amount.toLocaleString('en-IN')}, ` +
          `Projected Deficit: ₹${deficit.toLocaleString('en-IN')}. ` +
          `An Executive Director override reason (min 10 characters) is required to proceed.`
      };
    }

    return { allowed: true };
  }
}
