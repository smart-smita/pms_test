import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { InvoiceRow, InvoiceItemRow } from '../repositories/invoice.repository';
import fs from 'fs';
import path from 'path';

export const generateInvoicePDF = (invoice: InvoiceRow, res: Response) => {
  const doc = new PDFDocument({ margin: 50 });

  // Pipe the PDF directly to the response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`);
  doc.pipe(res);

  // ── Header ───────────────────────────────────────────────────────────────
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('INVOICE', { align: 'right' })
    .moveDown();

  // Company Information (Placeholder)
  doc
    .fontSize(10)
    .font('Helvetica')
    .text('HTCO Company Ltd.', 50, 50)
    .text('123 Business Avenue, Suite 100', 50, 65)
    .text('Dubai, UAE', 50, 80)
    .text('TRN: 123456789012345', 50, 95)
    .moveDown();

  // ── Invoice Details ──────────────────────────────────────────────────────
  const detailsTop = 150;
  doc.font('Helvetica-Bold').text('Invoice Details', 50, detailsTop);
  doc.font('Helvetica')
    .text(`Invoice Number: ${invoice.invoice_number}`, 50, detailsTop + 15)
    .text(`Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 50, detailsTop + 30)
    .text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 50, detailsTop + 45)
    .text(`Status: ${invoice.status.toUpperCase()}`, 50, detailsTop + 60);

  // ── Bill To ─────────────────────────────────────────────────────────────
  doc.font('Helvetica-Bold').text('Bill To', 300, detailsTop);
  doc.font('Helvetica')
    .text(`Customer ID: ${invoice.customer_id}`, 300, detailsTop + 15)
    .text(`Project ID: ${invoice.project_id}`, 300, detailsTop + 30);

  // ── Table Header ────────────────────────────────────────────────────────
  let tableTop = 270;
  doc
    .rect(50, tableTop, 500, 20)
    .fill('#f0f0f0')
    .stroke();
  
  doc
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('Description', 60, tableTop + 5)
    .text('Discipline', 260, tableTop + 5, { width: 100 })
    .text('Extra Work?', 360, tableTop + 5, { width: 80 })
    .text('Amount', 450, tableTop + 5, { width: 90, align: 'right' });

  // ── Table Content ───────────────────────────────────────────────────────
  doc.font('Helvetica');
  let itemTop = tableTop + 30;
  const currencySymbol = (invoice as any).symbol || '';

  const items: InvoiceItemRow[] = invoice.items || [];
  if (items.length === 0) {
    doc.text(`Monthly Billing Schedule ${invoice.schedule_id}`, 60, itemTop);
    const subtotalText = `${currencySymbol} ${Number(invoice.subtotal_amount).toFixed(2)}`;
    doc.text(subtotalText, 450, itemTop, { width: 90, align: 'right' });
    itemTop += 20;
  } else {
    for (const item of items) {
      // Basic wrapping
      doc.text(item.description || '', 60, itemTop, { width: 190 });
      doc.text(item.discipline_name || 'General', 260, itemTop, { width: 100 });
      doc.text(item.is_extra_work ? 'Yes' : 'No', 360, itemTop, { width: 80 });
      doc.text(`${currencySymbol} ${Number(item.amount).toFixed(2)}`, 450, itemTop, { width: 90, align: 'right' });
      itemTop += 25; // Space for potentially wrapped description
    }
  }

  // ── Totals ──────────────────────────────────────────────────────────────
  const totalTop = itemTop + 30;
  
  doc.moveTo(350, totalTop - 10).lineTo(550, totalTop - 10).stroke();

  const subtotalText = `${currencySymbol} ${Number(invoice.subtotal_amount).toFixed(2)}`;
  doc.font('Helvetica-Bold').text('Subtotal:', 350, totalTop);
  doc.font('Helvetica').text(subtotalText, 450, totalTop, { width: 90, align: 'right' });

  const taxPct = (invoice as any).tax_percentage || 0;
  const taxText = `${currencySymbol} ${Number(invoice.tax_amount).toFixed(2)}`;
  
  doc.font('Helvetica-Bold').text(`Tax (${taxPct}%):`, 350, totalTop + 20);
  doc.font('Helvetica').text(taxText, 450, totalTop + 20, { width: 90, align: 'right' });

  doc.moveTo(350, totalTop + 40).lineTo(550, totalTop + 40).stroke();

  const totalText = `${currencySymbol} ${Number(invoice.total_amount).toFixed(2)}`;
  doc.font('Helvetica-Bold').text('Total:', 350, totalTop + 50);
  doc.font('Helvetica-Bold').text(totalText, 450, totalTop + 50, { width: 90, align: 'right' });

  // ── Footer ──────────────────────────────────────────────────────────────
  doc.fontSize(10)
    .font('Helvetica')
    .text(
      'Thank you for your business. Please remit payment by the due date.',
      50,
      700,
      { align: 'center', width: 500 }
    );

  doc.end();
};

export const generateQuotationPDF = (quotation: any, res: Response) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Quotation-${quotation.quotation_code}.pdf"`);
  doc.pipe(res);

  // ── Header ───────────────────────────────────────────────────────────────
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('OFFICIAL QUOTATION', { align: 'right' })
    .moveDown();

  doc
    .fontSize(10)
    .font('Helvetica')
    .text('HTCO Construction & Engineering Ltd.', 50, 50)
    .text('Project Management & Contracting Division', 50, 65)
    .text('Dubai / Riyadh / New Delhi', 50, 80)
    .text(`Date: ${new Date(quotation.quotation_date).toLocaleDateString()}`, 50, 95)
    .moveDown();

  // ── Quotation & Customer Details ──────────────────────────────────────────
  const detailsTop = 140;
  doc.font('Helvetica-Bold').text('Quotation Information', 50, detailsTop);
  doc.font('Helvetica')
    .text(`Quotation Code: ${quotation.quotation_code}`, 50, detailsTop + 15)
    .text(`Revision No: ${quotation.revision_number || 1}`, 50, detailsTop + 30)
    .text(`Status: ${(quotation.status || 'draft').toUpperCase()}`, 50, detailsTop + 45)
    .text(`Validity Date: ${quotation.validity_date ? new Date(quotation.validity_date).toLocaleDateString() : 'N/A'}`, 50, detailsTop + 60);

  doc.font('Helvetica-Bold').text('Customer & Project', 300, detailsTop);
  doc.font('Helvetica')
    .text(`Customer: ${quotation.customer_name || 'N/A'} (${quotation.customer_code || ''})`, 300, detailsTop + 15)
    .text(`Contact: ${quotation.contact_person || 'N/A'}`, 300, detailsTop + 30)
    .text(`Project: ${quotation.project_name || 'N/A'} (${quotation.project_code || ''})`, 300, detailsTop + 45)
    .text(`Address: ${quotation.project_address || 'N/A'}`, 300, detailsTop + 60);

  // ── Table Header ────────────────────────────────────────────────────────
  let tableTop = 240;
  doc
    .rect(50, tableTop, 500, 20)
    .fill('#4f46e5')
    .stroke();

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .text('Discipline', 60, tableTop + 5)
    .text('Qty', 260, tableTop + 5, { width: 50, align: 'right' })
    .text('Unit', 320, tableTop + 5, { width: 50, align: 'right' })
    .text('Rate', 380, tableTop + 5, { width: 70, align: 'right' })
    .text('Amount', 460, tableTop + 5, { width: 80, align: 'right' });

  // ── Table Content ───────────────────────────────────────────────────────
  doc.fillColor('#000000').font('Helvetica');
  let itemTop = tableTop + 25;

  const disciplines = quotation.disciplines || [];
  if (disciplines.length === 0) {
    doc.text('No discipline line items listed.', 60, itemTop);
    itemTop += 20;
  } else {
    for (const d of disciplines) {
      doc.text(d.discipline_name || 'Discipline', 60, itemTop);
      doc.text(String(d.quantity || 1), 260, itemTop, { width: 50, align: 'right' });
      doc.text(d.unit || 'lump_sum', 320, itemTop, { width: 50, align: 'right' });
      doc.text(Number(d.rate || 0).toFixed(2), 380, itemTop, { width: 70, align: 'right' });
      doc.text(Number(d.amount || 0).toFixed(2), 460, itemTop, { width: 80, align: 'right' });
      itemTop += 20;
    }
  }

  // ── Totals Section ──────────────────────────────────────────────────────
  let totalTop = itemTop + 15;
  doc.moveTo(50, totalTop - 5).lineTo(550, totalTop - 5).stroke();

  doc.font('Helvetica-Bold').text('Subtotal:', 340, totalTop);
  doc.font('Helvetica').text(Number(quotation.subtotal_amount || 0).toFixed(2), 460, totalTop, { width: 80, align: 'right' });

  const taxPct = Number(quotation.tax_percentage || 0);
  doc.font('Helvetica-Bold').text(`Tax (${taxPct}%):`, 340, totalTop + 18);
  doc.font('Helvetica').text(Number(quotation.tax_amount || 0).toFixed(2), 460, totalTop + 18, { width: 80, align: 'right' });

  doc.font('Helvetica-Bold').text('Discount:', 340, totalTop + 36);
  doc.font('Helvetica').text(Number(quotation.discount_amount || 0).toFixed(2), 460, totalTop + 36, { width: 80, align: 'right' });

  doc.moveTo(340, totalTop + 54).lineTo(550, totalTop + 54).stroke();
  doc.font('Helvetica-Bold').fontSize(11).text('Grand Total:', 340, totalTop + 60);
  doc.font('Helvetica-Bold').fontSize(11).text(Number(quotation.total_amount || 0).toFixed(2), 460, totalTop + 60, { width: 80, align: 'right' });

  // ── Terms & Conditions ────────────────────────────────────────────────
  if (quotation.terms_conditions) {
    const termsTop = totalTop + 90;
    doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:', 50, termsTop);
    doc.fontSize(9).font('Helvetica').text(quotation.terms_conditions, 50, termsTop + 15, { width: 500 });
  }

  doc.fontSize(9).font('Helvetica').text('Thank you for choosing HTCO ERP for your project engineering requirements.', 50, 730, { align: 'center', width: 500 });

  doc.end();
};

export const generateSiteSurveyPDF = (survey: any, res: Response) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Survey-${survey.survey_code}.pdf"`);
  doc.pipe(res);

  // ── Header ───────────────────────────────────────────────────────────────
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('SITE SURVEY REPORT', { align: 'center' })
    .moveDown();

  doc
    .fontSize(10)
    .font('Helvetica')
    .text('HTCO Company Ltd.', 50, 50)
    .text('Dubai, UAE', 50, 65)
    .moveDown();

  // ── Survey Details ──────────────────────────────────────────────────────
  const detailsTop = 120;
  doc.font('Helvetica-Bold').text('Survey Information', 50, detailsTop);
  doc.font('Helvetica')
    .text(`Survey Code: ${survey.survey_code}`, 50, detailsTop + 15)
    .text(`Date: ${new Date(survey.survey_date).toLocaleDateString()}`, 50, detailsTop + 30)
    .text(`Status: ${(survey.status || '').toUpperCase()}`, 50, detailsTop + 45)
    .text(`Project: ${survey.project_name || 'N/A'}`, 50, detailsTop + 60)
    .text(`Conducted By: ${survey.conducted_by_name || 'N/A'}`, 50, detailsTop + 75)
    .text(`Location Details: ${survey.location_details || 'N/A'}`, 50, detailsTop + 90);

  let currentTop = detailsTop + 120;

  if (survey.comments) {
    doc.font('Helvetica-Bold').text('Comments / Observations:', 50, currentTop);
    doc.font('Helvetica').text(survey.comments, 50, currentTop + 15, { width: 500 });
    currentTop += 50;
  }

  if (survey.remarks) {
    doc.font('Helvetica-Bold').text('Inspector Remarks:', 50, currentTop);
    doc.font('Helvetica').text(survey.remarks, 50, currentTop + 15, { width: 500 });
    currentTop += 50;
  }

  // ── Photos Section ──────────────────────────────────────────────────────
  if (survey.photos && survey.photos.length > 0) {
    doc.addPage();
    doc.font('Helvetica-Bold').fontSize(16).text('Survey Evidence & Photos', 50, 50);
    
    let photoY = 80;
    
    for (const photo of survey.photos) {
      if (photoY > 600) {
        doc.addPage();
        photoY = 50;
      }

      // We attempt to resolve the physical path for the photo if possible
      const photoPath = path.join(process.cwd(), photo.file_path);
      if (fs.existsSync(photoPath)) {
        try {
          doc.image(photoPath, 50, photoY, { width: 250 });
        } catch (e) {
          doc.text(`[Image file corrupted or unsupported: ${photo.file_path}]`, 50, photoY);
        }
      } else {
        doc.text(`[Image file not found: ${photo.file_path}]`, 50, photoY);
      }

      doc.fontSize(10).font('Helvetica-Bold').text('Caption:', 320, photoY);
      doc.font('Helvetica').text(photo.caption || 'N/A', 320, photoY + 15, { width: 200 });
      
      let discNames = 'General / None';
      if (photo.disciplines && photo.disciplines.length > 0) {
        discNames = photo.disciplines.map((d: any) => d.name).join(', ');
      }
      
      doc.font('Helvetica-Bold').text('Mapped Disciplines:', 320, photoY + 50);
      doc.font('Helvetica').text(discNames, 320, photoY + 65, { width: 200 });

      photoY += 220;
    }
  }

  doc.end();
};

