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

  const rawSymbol = (invoice as any).currency_symbol || (invoice as any).symbol || (invoice as any).currency_code || 'INR';
  // Built-in PDFKit fonts (Helvetica) use WinAnsiEncoding which does not contain '₹' (U+20B9)
  const currencySymbol = rawSymbol === '₹' ? 'Rs.' : rawSymbol;
  const invoiceTypeTitle = invoice.invoice_type === 'labour' 
    ? 'LABOUR INVOICE' 
    : (invoice.invoice_type === 'material' ? 'MATERIAL INVOICE' : 'MONTHLY INVOICE');

  // ── Header ───────────────────────────────────────────────────────────────
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor('#2563eb')
    .text(invoiceTypeTitle, { align: 'right' })
    .moveDown(0.2);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(`Tax Invoice #${invoice.invoice_number}`, { align: 'right' })
    .moveDown(0.5);

  // Company Information
  doc
    .fillColor('#0f172a')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('PMS ERP & Construction Ltd.', 50, 50)
    .fontSize(8.5)
    .font('Helvetica')
    .fillColor('#475569')
    .text('Workforce & Project Management System', 50, 66)
    .text('Engineering, Infrastructure & Contracting Division', 50, 78)
    .text('GSTIN / TRN: 27AABCP1234F1Z9', 50, 90);

  doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#e2e8f0').stroke();

  // ── Invoice Details & Bill To ──────────────────────────────────────────────
  const detailsTop = 122;
  
  // Left Column: Invoice Meta
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b').text('Invoice Metadata', 50, detailsTop);
  doc.font('Helvetica').fontSize(8.5).fillColor('#334155')
    .text(`Invoice No: `, 50, detailsTop + 14, { continued: true })
    .font('Helvetica-Bold').text(invoice.invoice_number)
    .font('Helvetica')
    .text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 50, detailsTop + 27)
    .text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 50, detailsTop + 40)
    .text(`Billing Period: ${(invoice as any).billing_month || 'Current Schedule'}`, 50, detailsTop + 53)
    .text(`Invoice Type: `, 50, detailsTop + 66, { continued: true })
    .font('Helvetica-Bold').text((invoice.invoice_type || 'Combined').toUpperCase())
    .font('Helvetica')
    .text(`Status: `, 50, detailsTop + 79, { continued: true })
    .font('Helvetica-Bold').fillColor(invoice.status === 'paid' ? '#16a34a' : (invoice.status === 'approved' ? '#2563eb' : '#d97706'))
    .text(invoice.status.toUpperCase());

  // Right Column: Client & Project Info
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b').text('Billed To & Project Details', 300, detailsTop);
  doc.font('Helvetica').fontSize(8.5).fillColor('#334155')
    .text(`Client: `, 300, detailsTop + 14, { continued: true })
    .font('Helvetica-Bold').text((invoice as any).customer_name || 'N/A')
    .font('Helvetica')
    .text(`Project: ${(invoice as any).project_name || 'N/A'}`, 300, detailsTop + 27)
    .text(`Project Code: ${(invoice as any).project_code || 'PRJ-' + invoice.project_id}`, 300, detailsTop + 40)
    .text(`Quotation Ref: ${(invoice as any).quotation_code || 'N/A'}`, 300, detailsTop + 53)
    .text(`Site Address: `, 300, detailsTop + 66, { continued: true })
    .text(((invoice as any).project_address || (invoice as any).customer_address || 'Site Office').slice(0, 45), { width: 240 });

  // ── Table Header ────────────────────────────────────────────────────────
  let tableTop = 230;
  doc
    .rect(50, tableTop, 500, 22)
    .fill('#f1f5f9')
    .strokeColor('#cbd5e1')
    .stroke();
  
  doc
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text('#', 55, tableTop + 6, { width: 20 })
    .text('Description / Task & WBS', 80, tableTop + 6, { width: 220 })
    .text('Type', 305, tableTop + 6, { width: 55 })
    .text('Qty / Hrs', 365, tableTop + 6, { width: 45, align: 'right' })
    .text('Rate', 415, tableTop + 6, { width: 55, align: 'right' })
    .text('Amount', 475, tableTop + 6, { width: 70, align: 'right' });

  // ── Table Content ───────────────────────────────────────────────────────
  doc.font('Helvetica').fontSize(8);
  let itemTop = tableTop + 28;

  const items: InvoiceItemRow[] = invoice.items || [];
  let labourSubtotal = 0;
  let materialSubtotal = 0;

  if (items.length === 0) {
    doc.fillColor('#64748b').text(`Monthly Milestone Billing Schedule #${invoice.schedule_id}`, 80, itemTop);
    const subtotalText = `${currencySymbol} ${Number(invoice.subtotal_amount).toFixed(2)}`;
    doc.fillColor('#0f172a').text(subtotalText, 475, itemTop, { width: 70, align: 'right' });
    itemTop += 22;
  } else {
    items.forEach((item, index) => {
      if (itemTop > 690) {
        doc.addPage();
        tableTop = 40;
        doc
          .rect(50, tableTop, 500, 22)
          .fill('#f1f5f9')
          .strokeColor('#cbd5e1')
          .stroke();
        doc
          .fillColor('#1e293b')
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .text('#', 55, tableTop + 6, { width: 20 })
          .text('Description / Task & WBS', 80, tableTop + 6, { width: 220 })
          .text('Type', 305, tableTop + 6, { width: 55 })
          .text('Qty / Hrs', 365, tableTop + 6, { width: 45, align: 'right' })
          .text('Rate', 415, tableTop + 6, { width: 55, align: 'right' })
          .text('Amount', 475, tableTop + 6, { width: 70, align: 'right' });
        itemTop = tableTop + 28;
        doc.font('Helvetica').fontSize(8);
      }

      const isLabour = (item as any).item_type === 'labour' || item.description.startsWith('Labour:');
      const isMaterial = (item as any).item_type === 'material' || item.description.startsWith('Material:');
      const itemAmt = Number(item.amount || 0);
      if (isLabour) labourSubtotal += itemAmt;
      if (isMaterial) materialSubtotal += itemAmt;

      const typeLabel = isLabour ? 'LABOUR' : (isMaterial ? 'MATERIAL' : 'GENERAL');
      const qtyStr = (item as any).quantity ? String(Number((item as any).quantity)) : '-';
      const rateStr = (item as any).rate ? `${currencySymbol} ${Number((item as any).rate).toFixed(2)}` : '-';

      doc.fillColor('#64748b').text(String(index + 1), 55, itemTop, { width: 20 });
      doc.fillColor('#0f172a').text(item.description || '', 80, itemTop, { width: 220 });
      doc.fillColor('#475569').text(typeLabel, 305, itemTop, { width: 55 });
      doc.text(qtyStr, 365, itemTop, { width: 45, align: 'right' });
      doc.text(rateStr, 415, itemTop, { width: 55, align: 'right' });
      doc.fillColor('#0f172a').font('Helvetica-Bold')
        .text(`${currencySymbol} ${itemAmt.toFixed(2)}`, 475, itemTop, { width: 70, align: 'right' });
      doc.font('Helvetica');

      // Thin separator line
      doc.moveTo(50, itemTop + 18).lineTo(550, itemTop + 18).strokeColor('#f1f5f9').stroke();
      itemTop += 22;
    });
  }

  // ── Totals Section ──────────────────────────────────────────────────────
  let totalTop = Math.max(itemTop + 10, 480);
  if (totalTop > 650) {
    doc.addPage();
    totalTop = 60;
  }
  
  doc.moveTo(300, totalTop - 5).lineTo(550, totalTop - 5).strokeColor('#cbd5e1').stroke();

  // Category Subtotals if both or either exists
  if (labourSubtotal > 0 && materialSubtotal > 0) {
    doc.fontSize(8.5).font('Helvetica').fillColor('#64748b')
      .text('Labour Subtotal:', 300, totalTop)
      .text(`${currencySymbol} ${labourSubtotal.toFixed(2)}`, 450, totalTop, { width: 95, align: 'right' });
    totalTop += 15;
    
    doc.text('Material Subtotal:', 300, totalTop)
      .text(`${currencySymbol} ${materialSubtotal.toFixed(2)}`, 450, totalTop, { width: 95, align: 'right' });
    totalTop += 15;
  }

  // Gross Subtotal
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b')
    .text('Subtotal:', 300, totalTop)
    .text(`${currencySymbol} ${Number(invoice.subtotal_amount).toFixed(2)}`, 450, totalTop, { width: 95, align: 'right' });
  totalTop += 16;

  // Tax breakdown
  const cgst = Number(invoice.cgst_amount || 0);
  const sgst = Number(invoice.sgst_amount || 0);
  const igst = Number(invoice.igst_amount || 0);
  const taxPct = (invoice as any).tax_percentage || 0;

  if (cgst > 0 || sgst > 0) {
    doc.fontSize(8.5).font('Helvetica').fillColor('#475569')
      .text(`CGST (${taxPct ? (taxPct / 2).toFixed(1) : '9'}%):`, 300, totalTop)
      .text(`${currencySymbol} ${cgst.toFixed(2)}`, 450, totalTop, { width: 95, align: 'right' });
    totalTop += 14;

    doc.text(`SGST (${taxPct ? (taxPct / 2).toFixed(1) : '9'}%):`, 300, totalTop)
      .text(`${currencySymbol} ${sgst.toFixed(2)}`, 450, totalTop, { width: 95, align: 'right' });
    totalTop += 14;
  } else if (igst > 0) {
    doc.fontSize(8.5).font('Helvetica').fillColor('#475569')
      .text(`IGST (${taxPct}%):`, 300, totalTop)
      .text(`${currencySymbol} ${igst.toFixed(2)}`, 450, totalTop, { width: 95, align: 'right' });
    totalTop += 14;
  } else {
    doc.fontSize(8.5).font('Helvetica').fillColor('#475569')
      .text(`Tax (${taxPct}%):`, 300, totalTop)
      .text(`${currencySymbol} ${Number(invoice.tax_amount || 0).toFixed(2)}`, 450, totalTop, { width: 95, align: 'right' });
    totalTop += 14;
  }

  doc.moveTo(300, totalTop).lineTo(550, totalTop).strokeColor('#2563eb').stroke();
  totalTop += 6;

  // Final Total
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#2563eb')
    .text('Total Payable:', 300, totalTop)
    .text(`${currencySymbol} ${Number(invoice.total_amount).toFixed(2)}`, 450, totalTop, { width: 95, align: 'right' });

  // ── Footer & Bank Details ────────────────────────────────────────────────
  const footerTop = 720;
  doc.moveTo(50, footerTop).lineTo(550, footerTop).strokeColor('#e2e8f0').stroke();
  
  doc.fontSize(8)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text(
      'Payment terms: 30 days net. Please quote the invoice number when making payment.',
      50,
      footerTop + 8,
      { align: 'center', width: 500 }
    )
    .text(
      'PMS ERP Systems • Generated on ' + new Date().toLocaleString(),
      50,
      footerTop + 20,
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
    .text('PMS Construction & Engineering Ltd.', 50, 50)
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

  const rawCurSym = quotation.currency_symbol || quotation.currency_code || 'INR';
  const curSym = rawCurSym === '₹' ? 'Rs.' : rawCurSym;
  const disciplines = quotation.disciplines || [];
  
  let labourSub = 0;
  let materialSub = 0;
  for (const d of disciplines) {
    const isMat = d.wbs_type === 'material';
    const lineAmt = Number(d.amount || 0);
    if (isMat) materialSub += lineAmt;
    else labourSub += lineAmt;
  }
  const netSub = labourSub + materialSub;
  const discountAmt = Number(quotation.discount_amount || 0);
  const taxableAmt = Math.max(0, netSub - discountAmt);

  // ── Table Content ───────────────────────────────────────────────────────
  doc.fillColor('#000000').font('Helvetica');
  let itemTop = tableTop + 25;

  if (disciplines.length === 0) {
    doc.text('No WBS line items listed.', 60, itemTop);
    itemTop += 20;
  } else {
    for (const d of disciplines) {
      const typeTag = d.wbs_type === 'material' ? '[MAT]' : (d.wbs_type === 'both' ? '[BOTH]' : '[LAB]');
      doc.text(`${typeTag} ${d.discipline_name || 'Item'}`, 60, itemTop, { width: 190 });
      doc.text(String(d.quantity || 1), 260, itemTop, { width: 50, align: 'right' });
      doc.text(d.unit || 'Nos', 320, itemTop, { width: 50, align: 'right' });
      doc.text(`${curSym} ${Number(d.rate || 0).toFixed(2)}`, 380, itemTop, { width: 70, align: 'right' });
      doc.text(`${curSym} ${Number(d.amount || 0).toFixed(2)}`, 460, itemTop, { width: 80, align: 'right' });
      itemTop += 20;
    }
  }

  // ── Totals Section ──────────────────────────────────────────────────────
  let totalTop = itemTop + 15;
  doc.moveTo(50, totalTop - 5).lineTo(550, totalTop - 5).stroke();

  doc.font('Helvetica').text('Labour Subtotal:', 300, totalTop);
  doc.text(`${curSym} ${labourSub.toFixed(2)}`, 460, totalTop, { width: 80, align: 'right' });

  doc.text('Material Subtotal:', 300, totalTop + 15);
  doc.text(`${curSym} ${materialSub.toFixed(2)}`, 460, totalTop + 15, { width: 80, align: 'right' });

  doc.font('Helvetica-Bold').text('Net Subtotal:', 300, totalTop + 30);
  doc.font('Helvetica').text(`${curSym} ${netSub.toFixed(2)}`, 460, totalTop + 30, { width: 80, align: 'right' });

  doc.text('Discount:', 300, totalTop + 45);
  doc.text(`- ${curSym} ${discountAmt.toFixed(2)}`, 460, totalTop + 45, { width: 80, align: 'right' });

  doc.font('Helvetica-Bold').text('Taxable Amount:', 300, totalTop + 60);
  doc.font('Helvetica').text(`${curSym} ${taxableAmt.toFixed(2)}`, 460, totalTop + 60, { width: 80, align: 'right' });

  // Taxes breakdown
  let taxOffset = totalTop + 75;
  const qTaxes = quotation.taxes || [];
  if (qTaxes.length > 0) {
    for (const t of qTaxes) {
      doc.font('Helvetica').text(`${t.tax_name} (${t.tax_percentage}%):`, 300, taxOffset);
      doc.text(`${curSym} ${Number(t.tax_amount || 0).toFixed(2)}`, 460, taxOffset, { width: 80, align: 'right' });
      taxOffset += 15;
    }
  } else {
    const taxPct = Number(quotation.tax_percentage || 0);
    doc.font('Helvetica').text(`Tax (${taxPct}%):`, 300, taxOffset);
    doc.text(`${curSym} ${Number(quotation.tax_amount || 0).toFixed(2)}`, 460, taxOffset, { width: 80, align: 'right' });
    taxOffset += 15;
  }

  doc.moveTo(300, taxOffset).lineTo(550, taxOffset).stroke();
  taxOffset += 6;

  doc.font('Helvetica-Bold').fontSize(11).text('Grand Total:', 300, taxOffset);
  doc.font('Helvetica-Bold').fontSize(11).text(`${curSym} ${Number(quotation.total_amount || 0).toFixed(2)}`, 460, taxOffset, { width: 80, align: 'right' });

  // ── Terms & Conditions ────────────────────────────────────────────────
  let termsTop = taxOffset + 25;
  const snapshots = quotation.terms_snapshots || [];
  if (snapshots.length > 0 || quotation.terms_conditions) {
    doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:', 50, termsTop);
    termsTop += 15;

    // Group terms snapshots by template_name
    const grouped: { [key: string]: typeof snapshots } = {};
    for (const s of snapshots) {
      const grp = s.template_name || 'Custom & General Conditions';
      if (!grouped[grp]) grouped[grp] = [];
      grouped[grp].push(s);
    }

    let groupIdx = 1;
    for (const [groupName, groupTerms] of Object.entries(grouped)) {
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#334155').text(`${groupIdx}. ${groupName}`, 50, termsTop);
      termsTop += 13;

      for (const s of groupTerms) {
        const mandTag = s.is_mandatory ? '[Mandatory]' : '[Optional]';
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#000000').text(`   • ${s.title} ${mandTag}: `, 50, termsTop, { continued: true });
        doc.font('Helvetica').text(s.description || '', { width: 480 });
        termsTop += 13;
      }
      groupIdx++;
      termsTop += 4;
    }

    if (quotation.terms_conditions && Object.keys(grouped).length === 0) {
      doc.fontSize(9).font('Helvetica').text(quotation.terms_conditions, 50, termsTop, { width: 500 });
    }
  }

  doc.fontSize(9).font('Helvetica').text('Thank you for choosing PMS ERP for your project engineering requirements.', 50, 740, { align: 'center', width: 500 });

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
    .text('PMS Company Ltd.', 50, 50)
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

