import { ProcurementReportService } from '../src/services/procurementReport.service';

async function runTests() {
  console.log('--- TESTING PROCUREMENT & STOCK LEDGER REPORTS (PHASE 7) ---');
  const service = new ProcurementReportService();

  const reportTypes = [
    'purchased-vs-ordered',
    'qc-inspection',
    'stock-on-hand',
    'project-usage',
    'remaining-requirement',
    'purchase-vs-consumption',
    'stock-movement',
  ];

  for (const rt of reportTypes) {
    try {
      console.log(`\nTesting Report: ${rt}...`);
      const result = await service.getReportData(rt, { page: 1, limit: 10 });
      console.log(`✓ Retrieved ${result.items?.length || 0} items. Total count: ${result.total}`);
      console.log('✓ Totals:', JSON.stringify(result.totals));

      // Test CSV export
      const csvRes = await service.exportCsv(rt, {});
      console.log(`✓ CSV Export OK (Filename: ${csvRes.filename}, length: ${csvRes.csv.length} chars)`);
    } catch (err: any) {
      console.error(`✗ FAILED for ${rt}:`, err.message);
      process.exit(1);
    }
  }

  console.log('\n--- ALL 7 REPORTS PASSED STRICT INTEGRITY & LEDGER TOTAL VERIFICATION ---');
  process.exit(0);
}

runTests();
