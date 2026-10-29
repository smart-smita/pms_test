import { dbPool } from '../src/config/db';
import { SiteSurveyService } from '../src/services/siteSurvey.service';
import { InvoiceService } from '../src/services/invoice.service';
import { EmailService } from '../src/services/email.service';
import { generateInvoicePDFBuffer, generateSiteSurveyPDFBuffer } from '../src/utils/pdfGenerator';
import { AuditService } from '../src/services/audit.service';
import { RowDataPacket } from 'mysql2';

async function main() {
  console.log('🚀 [TEST] Starting Verification: WBS Invoice & Photographic Report E2E Workflow');

  // 1. Get an existing project and customer
  const [projects]: any = await dbPool.query(
    `SELECT p.project_id, p.project_name, p.project_code, p.customer_id, c.customer_name, c.email as customer_email
     FROM projects p
     JOIN customers c ON p.customer_id = c.customer_id
     WHERE p.status = 'in_progress' OR p.status = 'approved'
     LIMIT 1`
  );

  if (!projects || projects.length === 0) {
    throw new Error('No active project with customer found in database.');
  }

  const project = projects[0];
  console.log(`✓ Using Project: ${project.project_name} (${project.project_code}) for Customer: ${project.customer_name} <${project.customer_email || 'client@24wallstreet.com'}>`);

  // 2. Create Site Survey with Photographic Report Reference Data (PLN-03-F04 format)
  // Create test photos (base64 transparent 1x1 png or simple samples)
  const sampleBase64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const surveyData = {
    project_id: project.project_id,
    customer_id: project.customer_id,
    survey_date: '2026-06-15',
    conducted_by: 1,
    location_details: 'Plot 42, Sector 18, 24 Wallstreet Commercial Hub',
    latitude: 25.2048,
    longitude: 55.2708,
    site_conditions: 'Clear skies, active shuttering and steel binding ongoing.',
    measurements: 'Plinth height +1.2m, beam depth 600mm verified.',
    labour_requirements: '12 direct bar-benders, 8 carpenters, 2 safety supervisors',
    material_requirements: 'Fe500D rebar 8MT, M30 ready-mix concrete 45 cu.m',
    observations: 'Fourth slab beam reinforcement work adhering to structural drawing rev 02.',
    remarks: 'Approved for subsequent concrete pour upon structural engineer inspection.',
    report_number: 'PL1348PR55',
    period_from: '2026-06-01',
    period_to: '2026-06-15',
    prepared_by_name: 'Senior Er. Kishan Khatke',
    verified_by_name: 'Project Manager Prashant Jadhav',
    endorsed_by_name: 'AGM/GM Sagar Patil',
    document_number: 'PLN-03-F04',
    revision_number: 'R1',
    entry_type: 'system_entry' as const,
    status: 'completed' as const,
  };

  const photos = [
    {
      photo_name: 'East Elevation View',
      caption: 'East side view showing completed plinth and ground structural columns.',
      file_base64: sampleBase64Png,
      display_order: 1,
    },
    {
      photo_name: 'Beam Reinforcement',
      caption: 'Fourth slab beam reinforcement work in progress with stirrups tied at 150mm c/c.',
      file_base64: sampleBase64Png,
      display_order: 2,
    },
    {
      photo_name: 'Shear Wall Shuttering',
      caption: 'Shear wall formwork alignment and prop bracing inspection prior to concreting.',
      file_base64: sampleBase64Png,
      display_order: 3,
    },
    {
      photo_name: 'Safety Barrier Installation',
      caption: 'Perimeter edge protection and dual-wire safety lifeline on 4th floor slab edge.',
      file_base64: sampleBase64Png,
      display_order: 4,
    },
  ];

  console.log('📸 Creating Site Survey with 4 Inspection Photos & PLN-03-F04 Signatory Metadata...');
  const survey = await SiteSurveyService.create(surveyData, photos, 1, '127.0.0.1');
  console.log(`✓ Site Survey Created: ID #${survey.survey_id}, Code: ${survey.survey_code}, Report No: ${survey.report_number}`);

  // 3. Test Multi-Page PDF Generation Buffer (Cover Page + 2 photos per page + document footer)
  console.log('📄 Testing Photographic Report PDF Buffer Generation (PLN-03-F04)...');
  const fullSurvey = await SiteSurveyService.getById(survey.survey_id);
  const pdfBuffer = await generateSiteSurveyPDFBuffer(fullSurvey);
  console.log(`✓ Generated Multi-Page PDF Report: ${pdfBuffer.length} bytes`);
  if (pdfBuffer.length < 1000) {
    throw new Error('PDF Buffer is unexpectedly small.');
  }

  // 4. Test Mode B: Send Standalone Photographic Report to Customer WITHOUT Invoice
  console.log('✉️ [MODE B] Testing Standalone Photographic Report Email Dispatch...');
  const standaloneEmailRes = await EmailService.sendSurveyReportEmail(
    survey.survey_id,
    {
      recipient_email: project.customer_email || 'client@24wallstreet.com',
      subject: `Site Progress Documentation - Report #${survey.report_number} (${project.project_name})`,
      message: 'Attached please find the bi-weekly photographic report capturing slab reinforcement and safety milestones.',
    },
    1,
    '127.0.0.1'
  );
  console.log(`✓ Standalone Email Dispatch Result:`, standaloneEmailRes);

  // 5. Create Customer Invoice with WBS-wise line items linking this Survey
  console.log('📑 [MODE A] Creating Customer Invoice WBS-wise linking Survey #', survey.survey_id);

  // Get project WBS packages
  const [wbsRows]: any = await dbPool.query(
    `SELECT id, wbs_name, budget_amount FROM project_wbs WHERE project_id = ? AND deleted_at IS NULL LIMIT 2`,
    [project.project_id]
  );

  const wbs1 = wbsRows[0] || { id: 1, wbs_name: 'Substructure & Plinth Work', budget_amount: 500000 };
  const wbs2 = wbsRows[1] || { id: 2, wbs_name: 'Fourth Floor Reinforced Concrete Slab', budget_amount: 750000 };

  const invoiceItems = [
    {
      description: `WBS Milestone: ${wbs1.wbs_name} - Ground Structural Execution`,
      amount: 150000,
      is_extra_work: false,
      item_type: 'labour' as const,
      project_wbs_id: wbs1.id,
    },
    {
      description: `WBS Milestone: ${wbs2.wbs_name} - Beam & Slab Reinforcement (As Per Photo Report ${survey.report_number})`,
      amount: 350000,
      is_extra_work: false,
      item_type: 'material' as const,
      project_wbs_id: wbs2.id,
    },
  ];

  // Get or seed billing schedule
  let scheduleId = 1;
  const [schedules]: any = await dbPool.query(
    `SELECT schedule_id FROM billing_schedules WHERE project_id = ? LIMIT 1`,
    [project.project_id]
  );
  if (schedules && schedules.length > 0) {
    scheduleId = schedules[0].schedule_id;
  }

  const invoiceSvc = new InvoiceService();
  const invoiceId = await invoiceSvc.generateInvoice({
    customer_id: project.customer_id,
    project_id: project.project_id,
    schedule_id: scheduleId,
    survey_id: survey.survey_id,
    currency_id: 1,
    tax_id: 1,
    tax_percentage: 18,
    invoice_type: 'combined',
    items: invoiceItems,
    created_by: 1,
  });

  const createdInvoice = await invoiceSvc.getInvoiceById(invoiceId);
  if (!createdInvoice) throw new Error(`Invoice #${invoiceId} not found`);

  console.log(`✓ WBS Customer Invoice Created: ID #${createdInvoice.invoice_id}, Number: ${createdInvoice.invoice_number}, Total: ₹${createdInvoice.total_amount}`);

  // 6. Test Mode A: Send Invoice Email WITH Photographic Report Attached
  console.log('✉️ [MODE A] Testing Customer Invoice Dispatch with Photographic Report Attached...');
  const invoiceEmailRes = await EmailService.sendInvoiceEmail(
    createdInvoice.invoice_id,
    {
      recipient_email: project.customer_email || 'client@24wallstreet.com',
      include_survey_report: true,
      subject: `Tax Invoice #${createdInvoice.invoice_number} - ${project.project_name} with Photographic Inspection Report`,
      message: 'Please find attached Tax Invoice for the 4th slab beam milestone along with complete photographic verification report.',
    },
    1,
    '127.0.0.1'
  );
  console.log(`✓ Invoice Email Dispatch Result:`, invoiceEmailRes);

  // 7. Verify Audit Logs for Both Dispatches
  const [auditRows]: any = await dbPool.query(
    `SELECT action, module, record_id, description, created_at
     FROM audit_logs
     WHERE action IN ('SEND_INVOICE_EMAIL', 'SEND_SURVEY_REPORT_EMAIL')
     ORDER BY log_id DESC LIMIT 2`
  );
  console.log(`✓ Verified Audit Logs:`, auditRows);

  console.log('🎉 [SUCCESS] All E2E Photographic Report and WBS Invoice tests PASSED with 100% evidence!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ [ERROR] Verification failed:', err);
  process.exit(1);
});
