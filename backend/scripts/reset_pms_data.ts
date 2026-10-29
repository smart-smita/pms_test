import { dbPool } from '../src/config/db';
import * as fs from 'fs';
import * as path from 'path';

async function resetPmsData() {
  console.log('=====================================================');
  console.log('🚀 STARTING SAFE DEPENDENCY-AWARE PMS DATA RESET');
  console.log('=====================================================\n');

  const connection = await dbPool.getConnection();

  try {
    await connection.beginTransaction();

    // Disable foreign key checks for clean deletion
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Clear Financial & Operational Transactions
    console.log('--- 1. Purging Financial & Operational Transactions ---');
    const transTables = [
      'invoice_item_sources',
      'invoice_items',
      'invoice_payments',
      'customer_receipt_vouchers',
      'customer_tds_credits',
      'invoices',
      'customer_payment_schedules',
      'billing_schedules',
      'monthly_completed_work',
      'site_survey_photos',
      'site_survey_photo_disciplines',
      'site_surveys',
      'task_checklists',
      'task_dependencies',
      'task_assignments',
      'task_labour_assignments',
      'task_used_materials',
      'attendance_logs',
      'timesheets',
      'labour_attendance',
      'labour_payment_items',
      'labour_payments',
      'labour_work_logs',
      'equipment_usage_logs',
      'tasks',
      'grn_items',
      'goods_receipt_notes',
      'purchase_order_items',
      'purchase_orders',
      'vendor_payments',
      'vendor_invoices',
      'material_issues',
      'material_indent_items',
      'material_indents',
      'material_quotation_items',
      'material_quotations',
      'material_reservations',
      'material_surveys',
      'material_survey_items',
      'stock_ledger',
      'material_store_balances',
      'project_material_logs',
      'project_materials',
      'project_cash_overdraft_overrides'
    ];

    for (const t of transTables) {
      await connection.query(`DELETE FROM \`${t}\``);
      await connection.query(`ALTER TABLE \`${t}\` AUTO_INCREMENT = 1`);
      console.log(`  ✓ Cleared ${t}`);
    }

    // 2. Clear Planning & Quotations
    console.log('\n--- 2. Purging Planning & Quotations ---');
    const planQuotTables = [
      'planning_task_dependencies',
      'planning_tasks',
      'planning_wbs_material',
      'planning_wbs_labour',
      'planning_wbs',
      'planning_taxes',
      'planning_terms_snapshots',
      'planning_terms_templates',
      'planning_revisions',
      'planning_resources',
      'planning',
      'quotation_wbs_material',
      'quotation_wbs_labour',
      'quotation_wbs_items',
      'quotation_cost_sheets',
      'quotation_disciplines',
      'quotation_snapshots',
      'quotation_taxes',
      'quotation_terms_snapshots',
      'quotation_required_documents',
      'project_taxes',
      'project_terms_snapshots',
      'project_terms_templates',
      'project_selected_templates',
      'work_breakdown_structures',
      'project_wbs'
    ];

    for (const t of planQuotTables) {
      await connection.query(`DELETE FROM \`${t}\``);
      await connection.query(`ALTER TABLE \`${t}\` AUTO_INCREMENT = 1`);
      console.log(`  ✓ Cleared ${t}`);
    }

    // 3. Clear Projects & Quotations (breaking circular FK)
    console.log('\n--- 3. Purging Projects & Quotations ---');
    await connection.query('UPDATE projects SET source_quotation_id = NULL');
    await connection.query('DELETE FROM quotations');
    await connection.query('ALTER TABLE quotations AUTO_INCREMENT = 1');
    console.log('  ✓ Cleared quotations');

    await connection.query('DELETE FROM customer_co_applicants');
    await connection.query('ALTER TABLE customer_co_applicants AUTO_INCREMENT = 1');
    console.log('  ✓ Cleared customer_co_applicants');

    await connection.query('DELETE FROM project_customers');
    await connection.query('ALTER TABLE project_customers AUTO_INCREMENT = 1');
    console.log('  ✓ Cleared project_customers');

    await connection.query('DELETE FROM projects');
    await connection.query('ALTER TABLE projects AUTO_INCREMENT = 1');
    console.log('  ✓ Cleared projects');

    // 4. Clear Test Master Records
    console.log('\n--- 4. Purging Test Master Records ---');
    const masterTables = [
      'stores',
      'equipment_master',
      'materials',
      'labours',
      'vendors',
      'customers'
    ];

    for (const t of masterTables) {
      await connection.query(`DELETE FROM \`${t}\``);
      await connection.query(`ALTER TABLE \`${t}\` AUTO_INCREMENT = 1`);
      console.log(`  ✓ Cleared ${t}`);
    }

    // 5. Clear Documents, Notifications & Non-Admin Employees
    console.log('\n--- 5. Purging Test Employees & Logs (Preserving Admin employee_id = 1) ---');
    await connection.query('DELETE FROM employee_documents');
    await connection.query('ALTER TABLE employee_documents AUTO_INCREMENT = 1');
    await connection.query('DELETE FROM entity_documents');
    await connection.query('ALTER TABLE entity_documents AUTO_INCREMENT = 1');
    await connection.query('DELETE FROM expiry_notifications_log');
    await connection.query('ALTER TABLE expiry_notifications_log AUTO_INCREMENT = 1');
    await connection.query('DELETE FROM notifications');
    await connection.query('ALTER TABLE notifications AUTO_INCREMENT = 1');
    await connection.query('DELETE FROM password_reset_tokens');
    await connection.query('DELETE FROM manager_employees');
    await connection.query('DELETE FROM manager_projects');
    await connection.query('DELETE FROM audit_logs');
    await connection.query('ALTER TABLE audit_logs AUTO_INCREMENT = 1');

    // Delete dummy employees, preserving employee_id = 1
    await connection.query('DELETE FROM employees WHERE employee_id > 1');
    await connection.query('ALTER TABLE employees AUTO_INCREMENT = 2');
    console.log('  ✓ Cleared test employees (Administrator preserved)');

    // 6. Reset Number Series to 1
    console.log('\n--- 6. Resetting Number Series ---');
    await connection.query('UPDATE number_series SET next_number = 1');
    console.log('  ✓ Reset all number_series next_number = 1');

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    await connection.commit();
    console.log('\n✅ Database Transaction Committed Successfully!');

    // 7. Clean Uploaded Test Files
    console.log('\n--- 7. Cleaning Uploaded Test Files ---');
    const docsDir = path.resolve(__dirname, '../uploads/documents');
    const surveysDir = path.resolve(__dirname, '../uploads/surveys');

    const cleanFolder = (dir: string, preserveFiles: string[]) => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      let removedCount = 0;
      for (const f of files) {
        if (!preserveFiles.includes(f) && !f.startsWith('.')) {
          const filePath = path.join(dir, f);
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            removedCount++;
          }
        }
      }
      console.log(`  ✓ Removed ${removedCount} test file(s) from ${dir}`);
    };

    cleanFolder(docsDir, ['demo_specification.pdf']);
    cleanFolder(surveysDir, ['demo_inspection_photo.jpg']);

    console.log('\n🎉 PMS DATA RESET COMPLETED SUCCESSFULLY! System is clean and ready.\n');
  } catch (err) {
    await connection.rollback();
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error('❌ Reset failed! Transaction rolled back:', err);
    throw err;
  } finally {
    connection.release();
  }
}

resetPmsData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
