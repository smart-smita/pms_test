import { dbPool } from '../config/db';
import { roundDecimal } from './calculation.service';
import { AuditService } from './audit.service';
import { ProjectCustomerRepository, ProjectCustomerRow } from '../repositories/projectCustomer.repository';

export interface CustomerWbsCostShare {
  project_customer_id: number;
  customer_id: number;
  customer_name: string;
  unit_number: string | null;
  split_rule: 'percentage' | 'area_ratio' | 'fixed_amount' | 'custom_wbs';
  share_percentage: number;
  allocated_cost: number;
}

export class CustomerAllocationService {
  private pcRepo = new ProjectCustomerRepository();

  /**
   * Calculates how a shared WBS cost is split across all active customer allotments in a project.
   * Supports area_ratio, percentage, or fixed_amount rules.
   */
  async calculateSharedWbsCost(
    projectId: number,
    wbsCost: number,
    splitRuleOverride?: 'percentage' | 'area_ratio'
  ): Promise<{ total_cost: number; shares: CustomerWbsCostShare[] }> {
    const cost = Number(wbsCost || 0);
    const customers = await this.pcRepo.getByProjectId(projectId);
    const activeAllotments = customers.filter(c => c.status === 'active');

    if (activeAllotments.length === 0) {
      return { total_cost: cost, shares: [] };
    }

    const totalArea = activeAllotments.reduce((acc, c) => acc + Number(c.allocated_area_sqft || 0), 0);
    const totalPercentage = activeAllotments.reduce((acc, c) => acc + Number(c.ownership_percentage || 0), 0);

    const shares: CustomerWbsCostShare[] = [];
    let allocatedSum = 0;

    for (let i = 0; i < activeAllotments.length; i++) {
      const a = activeAllotments[i];
      const rule = splitRuleOverride || a.split_rule;
      let ratio = 0;

      if (rule === 'area_ratio' && totalArea > 0) {
        ratio = Number(a.allocated_area_sqft || 0) / totalArea;
      } else {
        // default percentage ratio
        ratio = totalPercentage > 0 ? Number(a.ownership_percentage || 0) / totalPercentage : 1 / activeAllotments.length;
      }

      let shareCost = roundDecimal(cost * ratio);

      // On final item, absorb any fractional cent / paise rounding variance
      if (i === activeAllotments.length - 1) {
        shareCost = roundDecimal(cost - allocatedSum);
      } else {
        allocatedSum += shareCost;
      }

      shares.push({
        project_customer_id: a.id,
        customer_id: a.customer_id,
        customer_name: a.customer_name,
        unit_number: a.unit_number,
        split_rule: rule,
        share_percentage: roundDecimal(ratio * 100),
        allocated_cost: shareCost
      });
    }

    return { total_cost: cost, shares };
  }

  /**
   * Safely transfers a customer allotment to a new customer mid-project:
   * - Preserves all previously issued invoices and receipts with the original customer.
   * - Sets the old allotment to 'transferred'.
   * - Creates a new allotment for the new customer with the unbilled agreement balance.
   * - Reassigns pending/unbilled milestone schedules to the new customer.
   */
  async transferCustomerAllotment(params: {
    project_customer_id: number;
    new_customer_id: number;
    transfer_reason: string;
    user_id: number;
    ip_address?: string;
  }): Promise<{ old_allotment: ProjectCustomerRow; new_allotment: ProjectCustomerRow }> {
    const { project_customer_id, new_customer_id, transfer_reason, user_id, ip_address } = params;

    const oldAllotment = await this.pcRepo.getById(project_customer_id);
    if (!oldAllotment) throw new Error(`Allotment ID ${project_customer_id} not found`);
    if (oldAllotment.status !== 'active') throw new Error(`Cannot transfer allotment in '${oldAllotment.status}' status`);

    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Calculate historical billed amount on this allotment
      const [invRows]: any = await connection.query(
        `SELECT COALESCE(SUM(total_amount), 0.00) AS total_billed
         FROM invoices
         WHERE project_customer_id = ? AND status != 'cancelled'`,
        [project_customer_id]
      );
      const totalBilled = Number(invRows[0].total_billed || 0);

      const totalAgreementValue = Number(oldAllotment.agreement_value || 0);
      const remainingUnbilledValue = Math.max(0, roundDecimal(totalAgreementValue - totalBilled));

      // 2. Create the new allotment for the new customer with remaining unbilled value
      const [newAllotRes]: any = await connection.query(
        `INSERT INTO project_customers (
           project_id, customer_id, unit_number, allocated_area_sqft,
           ownership_percentage, split_rule, agreement_value, is_primary_billing_contact, status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [
          oldAllotment.project_id,
          new_customer_id,
          oldAllotment.unit_number,
          oldAllotment.allocated_area_sqft,
          oldAllotment.ownership_percentage,
          oldAllotment.split_rule,
          remainingUnbilledValue,
          oldAllotment.is_primary_billing_contact ? 1 : 0
        ]
      );
      const newAllotmentId = newAllotRes.insertId;

      // 3. Mark the old allotment as transferred (linking to new allotment)
      await connection.query(
        `UPDATE project_customers
         SET status = 'transferred', transferred_to_id = ?, transferred_at = CURRENT_TIMESTAMP, transfer_reason = ?
         WHERE id = ?`,
        [newAllotmentId, transfer_reason, project_customer_id]
      );

      // 4. Reassign pending (unbilled) milestone schedules to the new allotment
      await connection.query(
        `UPDATE customer_payment_schedules
         SET project_customer_id = ?
         WHERE project_customer_id = ? AND status = 'pending'`,
        [newAllotmentId, project_customer_id]
      );

      await connection.commit();

      // 5. Audit log
      await AuditService.log({
        user_id,
        action: 'TRANSFER_CUSTOMER_ALLOTMENT',
        module: 'customer_allocation',
        description: `Transferred allotment ID ${project_customer_id} (Unit: ${oldAllotment.unit_number}) from Customer ${oldAllotment.customer_id} to Customer ${new_customer_id}. Historical billed: ₹${totalBilled}, Remaining unbilled assigned: ₹${remainingUnbilledValue}`,
        record_id: project_customer_id,
        old_value: { customer_id: oldAllotment.customer_id, status: 'active', agreement_value: totalAgreementValue },
        new_value: { new_allotment_id: newAllotmentId, new_customer_id, status: 'transferred', remaining_value: remainingUnbilledValue, reason: transfer_reason },
        ip_address
      });

      const updatedOld = (await this.pcRepo.getById(project_customer_id))!;
      const createdNew = (await this.pcRepo.getById(newAllotmentId))!;
      return { old_allotment: updatedOld, new_allotment: createdNew };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Safely deletes an allotment IF AND ONLY IF zero invoices have been issued against it.
   * If invoices exist, hard deletion is blocked to prevent breaking tax ledger integrity.
   */
  async removeCustomerAllotment(projectCustomerId: number, userId: number, ipAddress?: string): Promise<{ deleted: boolean }> {
    const allotment = await this.pcRepo.getById(projectCustomerId);
    if (!allotment) throw new Error(`Allotment ID ${projectCustomerId} not found`);

    // Check for issued invoices
    const [invRows]: any = await dbPool.query(
      `SELECT COUNT(*) AS invoice_count FROM invoices WHERE project_customer_id = ?`,
      [projectCustomerId]
    );
    const invoiceCount = Number(invRows[0].invoice_count || 0);

    if (invoiceCount > 0) {
      throw new Error(
        `Cannot delete allotment for Unit '${allotment.unit_number}'. ` +
        `This customer has ${invoiceCount} historical invoice(s) issued. ` +
        `To preserve statutory GST and financial audit integrity, use the Transfer Allotment workflow instead.`
      );
    }

    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      // Remove co-applicants
      await connection.query(`DELETE FROM customer_co_applicants WHERE project_customer_id = ?`, [projectCustomerId]);
      // Remove pending schedules
      await connection.query(`DELETE FROM customer_payment_schedules WHERE project_customer_id = ?`, [projectCustomerId]);
      // Remove allotment
      await connection.query(`DELETE FROM project_customers WHERE id = ?`, [projectCustomerId]);

      await connection.commit();

      await AuditService.log({
        user_id: userId,
        action: 'DELETE_CUSTOMER_ALLOTMENT',
        module: 'customer_allocation',
        description: `Deleted unbilled allotment ID ${projectCustomerId} (Unit: ${allotment.unit_number}) for Customer ${allotment.customer_id}`,
        record_id: projectCustomerId,
        old_value: allotment,
        ip_address: ipAddress
      });

      return { deleted: true };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}
