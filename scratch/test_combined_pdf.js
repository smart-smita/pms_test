const fs = require('fs');
const path = require('path');

// Run via ts-node or node after build
async function runTest() {
  const { dbPool } = require('../backend/dist/config/db');
  const { InvoiceRepository } = require('../backend/dist/repositories/invoice.repository');
  const { SiteSurveyRepository } = require('../backend/dist/repositories/siteSurvey.repository');
  const { generateInvoicePDF, generateSiteSurveyPDF } = require('../backend/dist/utils/pdfGenerator');

  console.log('Testing Combined Invoice & Site Survey PDF Generation...');

  const invoiceRepo = new InvoiceRepository();
  const invoice21 = await invoiceRepo.getInvoiceById(21);
  console.log('Invoice #21 retrieved:', {
    id: invoice21.id,
    invoice_number: invoice21.invoice_number,
    project_id: invoice21.project_id,
    project_name: invoice21.project_name
  });

  // Verify survey matching for Project 9
  const surveyForPrj9 = await SiteSurveyRepository.getMatchingSurveyForProject(invoice21.project_id, invoice21.survey_id);
  console.log('Matching survey for Project 9:', surveyForPrj9 ? {
    id: surveyForPrj9.id,
    survey_code: surveyForPrj9.survey_code,
    project_id: surveyForPrj9.project_id,
    status: surveyForPrj9.status
  } : 'None found');

  if (!surveyForPrj9) {
    throw new Error('Expected matching survey for Project 9 but none found!');
  }

  // 2. Stream to disk
  const outputPathPrj9 = path.join(__dirname, 'test_invoice_21_combined.pdf');
  const fileStreamPrj9 = fs.createWriteStream(outputPathPrj9);
  fileStreamPrj9.setHeader = () => {};

  await generateInvoicePDF(invoice21, fileStreamPrj9);

  await new Promise((resolve) => fileStreamPrj9.on('finish', resolve));

  const statsPrj9 = fs.statSync(outputPathPrj9);
  console.log(`Generated combined PDF for Invoice #21 at: ${outputPathPrj9} (${statsPrj9.size} bytes)`);

  // 3. Test an invoice that has NO matching survey (e.g. dummy project ID 99999 or project with no survey)
  const dummyInvoice = {
    ...invoice21,
    invoice_id: 9999,
    invoice_number: 'INV-TEST-NOSURVEY',
    project_id: 99999,
    project_name: 'Project With No Survey',
    survey_id: null
  };

  const surveyForPrjNone = await SiteSurveyRepository.getMatchingSurveyForProject(dummyInvoice.project_id, null);
  console.log('Matching survey for non-existent project 99999:', surveyForPrjNone);

  const outputPathNoSurvey = path.join(__dirname, 'test_invoice_nosurvey.pdf');
  const fileStreamNoSurvey = fs.createWriteStream(outputPathNoSurvey);
  fileStreamNoSurvey.setHeader = () => {};

  await generateInvoicePDF(dummyInvoice, fileStreamNoSurvey);
  await new Promise((resolve) => fileStreamNoSurvey.on('finish', resolve));

  const statsNoSurvey = fs.statSync(outputPathNoSurvey);
  console.log(`Generated standalone PDF for No-Survey Invoice at: ${outputPathNoSurvey} (${statsNoSurvey.size} bytes)`);

  // Compare sizes: Combined PDF with survey photos & tables should be substantially larger than standalone invoice
  console.log(`Size comparison: Combined (${statsPrj9.size} bytes) vs Invoice Only (${statsNoSurvey.size} bytes)`);
  if (statsPrj9.size <= statsNoSurvey.size) {
    throw new Error('Combined PDF should be significantly larger than invoice-only PDF!');
  }

  console.log('SUCCESS: All tests passed!');
  await dbPool.end();
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
