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
    const invDateStr = invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A';
    const dueDateStr = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A';

    doc.font('Helvetica').fontSize(8.5).fillColor('#334155')
      .text(`Invoice No: `, 50, detailsTop + 14, { continued: true })
      .font('Helvetica-Bold').text(invoice.invoice_number || '')
      .font('Helvetica')
      .text(`Date: ${invDateStr}`, 50, detailsTop + 27)
      .text(`Due Date: ${dueDateStr}`, 50, detailsTop + 40)
      .text(`Billing Period: ${(invoice as any).billing_month || 'Current Schedule'}`, 50, detailsTop + 53)
      .text(`Invoice Type: `, 50, detailsTop + 66, { continued: true })
      .font('Helvetica-Bold').text((invoice.invoice_type || 'Combined').toUpperCase())
      .font('Helvetica')
      .text(`Status: `, 50, detailsTop + 79, { continued: true })
      .font('Helvetica-Bold').fillColor(invoice.status === 'paid' ? '#16a34a' : (invoice.status === 'approved' ? '#2563eb' : '#d97706'))
      .text((invoice.status || 'draft').toUpperCase());

  // ── Bill To ─────────────────────────────────────────────────────────────
  doc.font('Helvetica-Bold').text('Bill To', 300, detailsTop);
  doc.font('Helvetica')
    .text(`Customer: ${invoice.customer_name || `Customer #${invoice.customer_id}`}`, 300, detailsTop + 15, { width: 220 })
    .text(`Project: ${invoice.project_name || `Project #${invoice.project_id}`}`, 300, detailsTop + 30, { width: 220 });

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
  doc.font('Helvetica');
  let itemTop = tableTop + 30;

  const items: InvoiceItemRow[] = invoice.items || [];
  let labourSubtotal = 0;
  let materialSubtotal = 0;

  if (items.length === 0) {
    doc.text(`Monthly Billing Schedule #${invoice.schedule_id}`, 60, itemTop);
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

  // ── Totals ──────────────────────────────────────────────────────────────
  let totalTop = itemTop + 30;

  doc.moveTo(350, totalTop - 10).lineTo(550, totalTop - 10).stroke();

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
  const taxLabel = (invoice as any).tax_name ? `Tax (${(invoice as any).tax_name}):` : `Tax (${taxPct}%):`;
  const taxText = `${currencySymbol} ${Number(invoice.tax_amount).toFixed(2)}`;

  doc.font('Helvetica-Bold').text(taxLabel, 350, totalTop + 20);
  doc.font('Helvetica').text(taxText, 450, totalTop + 20, { width: 90, align: 'right' });

  doc.moveTo(350, totalTop + 40).lineTo(550, totalTop + 40).stroke();

  const totalText = `${currencySymbol} ${Number(invoice.total_amount).toFixed(2)}`;
  doc.font('Helvetica-Bold').text('Total:', 350, totalTop + 50);
  doc.font('Helvetica-Bold').text(totalText, 450, totalTop + 50, { width: 90, align: 'right' });

  const paidAmt = Number((invoice as any).paid_amount || 0);
  if (paidAmt > 0) {
    const paidText = `${currencySymbol} ${paidAmt.toFixed(2)}`;
    doc.font('Helvetica-Bold').text('Paid Amount:', 350, totalTop + 70);
    doc.font('Helvetica').text(paidText, 450, totalTop + 70, { width: 90, align: 'right' });

    const balanceAmt = Math.max(0, Number(invoice.total_amount) - paidAmt);
    const balanceText = `${currencySymbol} ${balanceAmt.toFixed(2)}`;
    doc.font('Helvetica-Bold').text('Balance Due:', 350, totalTop + 90);
    doc.font('Helvetica-Bold').text(balanceText, 450, totalTop + 90, { width: 90, align: 'right' });
  }

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
    .text(`Project Type: ${quotation.project_type_name || 'General'}`, 300, detailsTop + 60)
    .text(`Address: ${quotation.project_address || quotation.customer_address || 'N/A'}`, 300, detailsTop + 75);

  // ── Table Header ────────────────────────────────────────────────────────
  let tableTop = 250;
  doc
    .rect(50, tableTop, 500, 20)
    .fill('#4f46e5')
    .stroke();

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .text('Discipline / Tasks', 60, tableTop + 5)
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
      if (itemTop > 680) {
        doc.addPage();
        itemTop = 50;
      }
      const typeTag = d.wbs_type === 'material' ? '[MAT]' : (d.wbs_type === 'both' ? '[BOTH]' : '[LAB]');
      doc.font('Helvetica-Bold').fontSize(9).text(`${typeTag} ${d.discipline_name || 'Item'}`, 60, itemTop, { width: 190 });
      doc.font('Helvetica').fontSize(9);
      const displayQty = d.wbs_type === 'material'
        ? (d.material_quantity != null ? d.material_quantity : d.quantity || 1)
        : (d.labour_hours != null ? d.labour_hours : d.quantity || 1);
      const displayRate = d.wbs_type === 'material'
        ? (d.material_rate != null ? d.material_rate : d.rate || 0)
        : (d.labour_rate != null ? d.labour_rate : d.rate || 0);

      doc.text(String(displayQty), 260, itemTop, { width: 50, align: 'right' });
      doc.text(d.unit || (d.wbs_type === 'material' ? 'Nos' : 'hours'), 320, itemTop, { width: 50, align: 'right' });
      doc.text(`${curSym} ${Number(displayRate).toFixed(2)}`, 380, itemTop, { width: 70, align: 'right' });
      doc.text(`${curSym} ${Number(d.amount || 0).toFixed(2)}`, 460, itemTop, { width: 80, align: 'right' });
      itemTop += 16;

      // Sub-line details if available
      const subParts: string[] = [];
      if (d.labour_name || (d.labours && d.labours.length > 0)) {
        const lName = d.labour_name || (d.labours || []).map((l: any) => l.labour_name).join(', ');
        subParts.push(`Labour: ${lName} (${d.labour_hours || 0} hrs @ ${curSym}${d.labour_rate || 0})`);
      }
      if (d.material_name || (d.materials && d.materials.length > 0)) {
        const mName = d.material_name || (d.materials || []).map((m: any) => m.material_name).join(', ');
        subParts.push(`Material: ${mName} (${d.material_quantity || 0} ${d.unit || 'Nos'} @ ${curSym}${d.material_rate || 0})`);
      }
      if (subParts.length > 0) {
        doc.fontSize(8).fillColor('#64748b').text(subParts.join(' | '), 70, itemTop, { width: 470 });
        doc.fontSize(9).fillColor('#000000');
        itemTop += 14;
      }
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
  // Use bufferPages: true to enable dynamic multi-page headers and footers (Page X of Y)
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: 35,
      bottom: 20,
      left: 40,
      right: 40,
    },
    bufferPages: true,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Survey-${survey.survey_code || 'Report'}.pdf"`);
  doc.pipe(res);

  // ── Color Palette & Geometry Tokens ─────────────────────────────────────────
  const colors = {
    primary: '#1e3a8a',      // Executive Navy Blue
    primaryDark: '#0f172a',  // Deep Slate / Navy
    primaryLight: '#3b82f6', // Bright Blue Accent
    indigo: '#4f46e5',       // Subtle branding indigo
    bgLight: '#f8fafc',      // Light Card Background
    cardBorder: '#e2e8f0',   // Clean Neutral Border
    borderMuted: '#cbd5e1',  // Divider Border
    textPrimary: '#0f172a',  // Darkest Charcoal
    textSecondary: '#475569',// Balanced Slate Body Text
    textMuted: '#64748b',    // Subtitle / Label Text
    badgeCompletedBg: '#dcfce7',
    badgeCompletedText: '#15803d',
    badgeVerifiedBg: '#dbeafe',
    badgeVerifiedText: '#1d4ed8',
    badgeDraftBg: '#fef3c7',
    badgeDraftText: '#b45309',
    badgeRejectedBg: '#fee2e2',
    badgeRejectedText: '#b91c1c',
  };

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginLeft = 40;
  const marginRight = 40;
  const contentWidth = pageWidth - marginLeft - marginRight; // 515.28 pt
  const pageBottomThreshold = 750;

  // Helper: check space and add page if needed
  const ensureSpace = (neededHeight: number): void => {
    if (curY + neededHeight > pageBottomThreshold) {
      doc.addPage();
      curY = 55; // start below top margin on continuation page
    }
  };

  // Helper: Format Dates cleanly
  const formatDate = (rawDate: any): string => {
    if (!rawDate) return 'Not Specified';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return String(rawDate);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
    } catch {
      return String(rawDate);
    }
  };

  // Helper: Clean Value Display
  const cleanVal = (val: any, fallback = 'Not provided'): string => {
    if (val === null || val === undefined || val === '') return fallback;
    const str = String(val).trim();
    return str.length > 0 ? str : fallback;
  };

  // ── 1. Top Decorative Brand Bar ───────────────────────────────────────────
  doc.rect(0, 0, pageWidth, 6).fill(colors.primary);

  // ── 2. Corporate Header ───────────────────────────────────────────────────
  let curY = 20;

  // Header background card
  doc.roundedRect(marginLeft, curY, contentWidth, 68, 4).fillAndStroke('#f8fafc', colors.cardBorder);

  // Decorative navy left stripe on header card
  doc.roundedRect(marginLeft, curY, 5, 68, 2).fill(colors.primary);

  // Company Branding (Left side)
  doc
    .fillColor(colors.primaryDark)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('PMS Company Ltd.', marginLeft + 16, curY + 10);

  doc
    .fillColor(colors.textMuted)
    .font('Helvetica')
    .fontSize(8)
    .text('Project Management & Engineering Solutions', marginLeft + 16, curY + 27)
    .text('Dubai, United Arab Emirates', marginLeft + 16, curY + 39)
    .text('Tel: +971 4 000 0000  |  support@pmserp.com', marginLeft + 16, curY + 50);

  // Document Title & Reference (Right side)
  doc
    .fillColor(colors.primary)
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('SITE SURVEY REPORT', marginLeft, curY + 10, { width: contentWidth - 16, align: 'right' });

  // Survey Code Pill on Right
  const surveyCodeStr = cleanVal(survey.survey_code, 'SRV-RECORD');
  doc
    .fillColor(colors.textSecondary)
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text(`Ref: ${surveyCodeStr}`, marginLeft, curY + 28, { width: contentWidth - 16, align: 'right' });

  // Date and Status badge right under Ref
  const surveyDateFormatted = formatDate(survey.survey_date);
  doc
    .fillColor(colors.textMuted)
    .font('Helvetica')
    .fontSize(8)
    .text(`Date: ${surveyDateFormatted}`, marginLeft, curY + 40, { width: contentWidth - 16, align: 'right' });

  // Status Badge
  const rawStatus = (survey.status || 'draft').toLowerCase();
  let stBg = colors.badgeDraftBg;
  let stColor = colors.badgeDraftText;
  if (rawStatus === 'completed') {
    stBg = colors.badgeCompletedBg;
    stColor = colors.badgeCompletedText;
  } else if (rawStatus === 'verified') {
    stBg = colors.badgeVerifiedBg;
    stColor = colors.badgeVerifiedText;
  } else if (rawStatus === 'rejected') {
    stBg = colors.badgeRejectedBg;
    stColor = colors.badgeRejectedText;
  }

  const badgeWidth = 68;
  const badgeHeight = 13;
  const badgeX = marginLeft + contentWidth - 16 - badgeWidth;
  const badgeY = curY + 50;

  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3).fill(stBg);
  doc
    .fillColor(stColor)
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .text(rawStatus.toUpperCase(), badgeX, badgeY + 2.5, { width: badgeWidth, align: 'center' });

  curY += 76;

  // Helper: Section Header
  const renderSectionHeader = (title: string, iconLetter?: string): void => {
    ensureSpace(24);
    const headerY = curY;

    // Background bar for section title
    doc.roundedRect(marginLeft, headerY, contentWidth, 18, 3).fill(colors.primary);

    if (iconLetter) {
      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(`[${iconLetter}]`, marginLeft + 8, headerY + 4.5);
      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(title.toUpperCase(), marginLeft + 24, headerY + 4.5, { characterSpacing: 0.5 });
    } else {
      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(title.toUpperCase(), marginLeft + 8, headerY + 4.5, { characterSpacing: 0.5 });
    }

    curY = headerY + 22;
  };

  // Helper: Render 2-Column Info Grid Card
  const renderInfoCard = (
    rows: Array<[string, string, string, string]>
  ): void => {
    const rowHeight = 19;
    const cardHeight = rows.length * rowHeight + 6;
    const colWidth = (contentWidth - 16) / 2;
    const col1X = marginLeft + 10;
    const col2X = marginLeft + 10 + colWidth + 8;

    const cardY = curY;

    // Draw Card Box
    doc.roundedRect(marginLeft, cardY, contentWidth, cardHeight, 4).fillAndStroke(colors.bgLight, colors.cardBorder);

    let rowY = cardY + 4;
    rows.forEach(([label1, val1, label2, val2], idx) => {
      // Alternate row shading for high readability
      if (idx % 2 === 1) {
        doc.rect(marginLeft + 2, rowY - 1, contentWidth - 4, rowHeight).fill('#f1f5f9');
      }

      // Col 1
      doc.fillColor(colors.textMuted).font('Helvetica-Bold').fontSize(8).text(label1, col1X, rowY + 2.5, { width: 105 });
      doc.fillColor(colors.textPrimary).font('Helvetica').fontSize(8.5).text(val1, col1X + 108, rowY + 2.5, { width: colWidth - 110, ellipsis: true });

      // Col 2
      if (label2) {
        doc.fillColor(colors.textMuted).font('Helvetica-Bold').fontSize(8).text(label2, col2X, rowY + 2.5, { width: 105 });
        doc.fillColor(colors.textPrimary).font('Helvetica').fontSize(8.5).text(val2, col2X + 108, rowY + 2.5, { width: colWidth - 110, ellipsis: true });
      }

      rowY += rowHeight;
    });

    curY = cardY + cardHeight;
  };

  // ── Section A: Survey & Project Overview ──────────────────────────────────
  renderSectionHeader('Section A — Survey Overview & General Information', 'A');

  const overviewRows: Array<[string, string, string, string]> = [
    [
      'Survey Code:',
      cleanVal(survey.survey_code),
      'Survey Date:',
      surveyDateFormatted,
    ],
    [
      'Project Name:',
      survey.project_name ? `${survey.project_name}${survey.project_code ? ` (${survey.project_code})` : ''}` : 'Not Specified',
      'Client / Customer:',
      survey.customer_name ? `${survey.customer_name}${survey.customer_code ? ` (${survey.customer_code})` : ''}` : 'Not Specified',
    ],
    [
      'Discipline / Trade:',
      cleanVal(survey.discipline_name, 'General Site Engineering'),
      'Survey Status:',
      rawStatus.toUpperCase(),
    ],
    [
      'Conducted By:',
      cleanVal(survey.conducted_by_name, 'System Administrator'),
      'Entry Mode:',
      survey.entry_type === 'report_attachment' ? 'Attached Report' : 'System Form Entry',
    ],
  ];

  renderInfoCard(overviewRows);
  curY += 8;

  // ── Section B: Site & Location Details ────────────────────────────────────
  renderSectionHeader('Section B — Project Location & Site Details', 'B');

  // Fallback for location details: use survey.location_details, otherwise project_address, otherwise Not provided
  let locationDisplay = cleanVal(survey.location_details, '');
  if (!locationDisplay && survey.project_address) {
    locationDisplay = `${survey.project_address} (From Project Record)`;
  }
  if (!locationDisplay) {
    locationDisplay = 'Not provided';
  }

  // Format GPS Coordinates
  let gpsDisplay = 'Not recorded';
  if (survey.latitude || survey.longitude) {
    const latStr = survey.latitude ? `${Number(survey.latitude).toFixed(6)}°` : 'N/A';
    const lngStr = survey.longitude ? `${Number(survey.longitude).toFixed(6)}°` : 'N/A';
    gpsDisplay = `Lat: ${latStr}, Long: ${lngStr}`;
  }

  const locationRows: Array<[string, string, string, string]> = [
    [
      'Site Location:',
      locationDisplay,
      'GPS Coordinates:',
      gpsDisplay,
    ],
    [
      'Project Address:',
      cleanVal(survey.project_address, 'Same as site location'),
      'Inspector Email:',
      cleanVal(survey.conducted_by_email, 'Not provided'),
    ],
  ];

  renderInfoCard(locationRows);
  curY += 8;

  // ── Section C: Survey Findings, Scope & Observations ───────────────────────
  // Collect populated technical findings & notes to only show needed data
  const observationsList: Array<{ title: string; text: string }> = [];
  if (survey.site_conditions && survey.site_conditions.trim()) {
    observationsList.push({ title: 'Site Conditions:', text: survey.site_conditions.trim() });
  }
  if (survey.measurements && survey.measurements.trim()) {
    observationsList.push({ title: 'Measurements & Specs:', text: survey.measurements.trim() });
  }
  if (survey.material_requirements && survey.material_requirements.trim()) {
    observationsList.push({ title: 'Material Requirements:', text: survey.material_requirements.trim() });
  }
  if (survey.labour_requirements && survey.labour_requirements.trim()) {
    observationsList.push({ title: 'Labour Requirements:', text: survey.labour_requirements.trim() });
  }
  if (survey.observations && survey.observations.trim()) {
    observationsList.push({ title: 'Field Observations:', text: survey.observations.trim() });
  }
  if (survey.comments && survey.comments.trim()) {
    observationsList.push({ title: 'Inspector Comments:', text: survey.comments.trim() });
  }
  if (survey.remarks && survey.remarks.trim()) {
    observationsList.push({ title: 'Management Remarks:', text: survey.remarks.trim() });
  }

  // Only render Section C if there are observations/notes
  if (observationsList.length > 0) {
    renderSectionHeader('Section C — Survey Findings, Scope & Technical Notes', 'C');

    // Build 2-column paired rows exactly matching Section A & Section B UI table design
    const observationRows: Array<[string, string, string, string]> = [];
    for (let i = 0; i < observationsList.length; i += 2) {
      const col1 = observationsList[i];
      const col2 = observationsList[i + 1];
      observationRows.push([
        col1.title,
        col1.text,
        col2 ? col2.title : '',
        col2 ? col2.text : '',
      ]);
    }

    renderInfoCard(observationRows);
    curY += 16; // Dedicated, noticeable clean space between Section C and Section D
  }

  // ── Section D: Photo Gallery & Site Evidence ──────────────────────────────
  const photos = survey.photos || [];
  if (photos.length > 0) {
    if (photos.length === 1) {
      // Single photo: centered on page with responsive size
      const singlePhoto = photos[0];
      const cardWidth = Math.min(contentWidth, 420); // clean ~420pt centered card
      const cardHeight = 195;
      const cardX = marginLeft + (contentWidth - cardWidth) / 2;

      // Group Section D header + photo card together so the header is never orphaned at bottom of page
      ensureSpace(cardHeight + 28);
      renderSectionHeader(`Section D — Site Survey Photos & Visual Evidence (1)`, 'D');

      const cardY = curY;

      // Card frame
      doc
        .roundedRect(cardX, cardY, cardWidth, cardHeight, 4)
        .fillAndStroke('#ffffff', colors.cardBorder);

      // Header strip
      doc.rect(cardX, cardY, cardWidth, 18).fill('#f1f5f9');
      doc
        .fillColor(colors.textSecondary)
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(`Photo #1: ${cleanVal(singlePhoto.photo_name, 'Site Capture')}`, cardX + 8, cardY + 4, {
          width: cardWidth - 16,
          ellipsis: true,
          align: 'center',
        });

      // Image Area (Centered & responsive: 400 x 135)
      const imgBoxW = cardWidth - 20;
      const imgBoxH = 135;
      const imgBoxX = cardX + 10;
      const imgBoxY = cardY + 23;

      let imageRendered = false;
      if (singlePhoto.file_path) {
        const cleanPath = singlePhoto.file_path.startsWith('/') ? singlePhoto.file_path.slice(1) : singlePhoto.file_path;
        const fullPath = path.join(process.cwd(), cleanPath);

        if (fs.existsSync(fullPath)) {
          try {
            doc.image(fullPath, imgBoxX, imgBoxY, {
              fit: [imgBoxW, imgBoxH],
              align: 'center',
              valign: 'center',
            });
            imageRendered = true;
          } catch (err) {
            imageRendered = false;
          }
        }
      }

      if (!imageRendered) {
        doc.rect(imgBoxX, imgBoxY, imgBoxW, imgBoxH).fill('#f8fafc');
        doc
          .fillColor(colors.textMuted)
          .font('Helvetica-Oblique')
          .fontSize(8.5)
          .text('[Image file preview not available on server]', imgBoxX, imgBoxY + imgBoxH / 2 - 5, {
            width: imgBoxW,
            align: 'center',
          });
      }

      // Caption & Discipline footer (centered)
      const captionText = singlePhoto.caption ? singlePhoto.caption : 'No caption provided';
      doc
        .fillColor(colors.textPrimary)
        .font('Helvetica')
        .fontSize(8)
        .text(`Caption: ${captionText}`, cardX + 10, cardY + 162, {
          width: cardWidth - 20,
          ellipsis: true,
          align: 'center',
        });

      let discNames = 'Discipline: General / None';
      if (singlePhoto.disciplines && singlePhoto.disciplines.length > 0) {
        discNames = `Discipline: ${singlePhoto.disciplines.map((d: any) => d.name).join(', ')}`;
      }
      doc
        .fillColor(colors.textMuted)
        .font('Helvetica')
        .fontSize(7.5)
        .text(discNames, cardX + 10, cardY + 176, {
          width: cardWidth - 20,
          ellipsis: true,
          align: 'center',
        });

      curY = cardY + cardHeight;
      curY += 10;
    } else {
      // Multiple photos (2-column balanced grid with enlarged image height)
      ensureSpace(210);
      renderSectionHeader(`Section D — Site Survey Photos & Visual Evidence (${photos.length})`, 'D');

      const photoBoxWidth = (contentWidth - 14) / 2; // ~250 pt
      const photoBoxHeight = 180;

      for (let i = 0; i < photos.length; i += 2) {
        ensureSpace(photoBoxHeight + 14);
        const rowY = curY;

        for (let j = 0; j < 2; j++) {
          const photoIndex = i + j;
          if (photoIndex >= photos.length) break;

          const photo = photos[photoIndex];
          const cardX = marginLeft + j * (photoBoxWidth + 14);

          // Frame
          doc
            .roundedRect(cardX, rowY, photoBoxWidth, photoBoxHeight, 4)
            .fillAndStroke('#ffffff', colors.cardBorder);

          // Header strip on photo card
          doc.rect(cardX, rowY, photoBoxWidth, 16).fill('#f1f5f9');
          doc
            .fillColor(colors.textSecondary)
            .font('Helvetica-Bold')
            .fontSize(7.5)
            .text(`Photo #${photoIndex + 1}: ${cleanVal(photo.photo_name, 'Site Capture')}`, cardX + 6, rowY + 4, {
              width: photoBoxWidth - 12,
              ellipsis: true,
            });

          // Resolve Image on disk (centered & responsive)
          let imageRendered = false;
          if (photo.file_path) {
            const cleanPath = photo.file_path.startsWith('/') ? photo.file_path.slice(1) : photo.file_path;
            const fullPath = path.join(process.cwd(), cleanPath);

            if (fs.existsSync(fullPath)) {
              try {
                doc.image(fullPath, cardX + 8, rowY + 22, {
                  fit: [photoBoxWidth - 16, 120],
                  align: 'center',
                  valign: 'center',
                });
                imageRendered = true;
              } catch (err) {
                imageRendered = false;
              }
            }
          }

          if (!imageRendered) {
            // Placeholder illustration box
            doc.rect(cardX + 8, rowY + 22, photoBoxWidth - 16, 120).fill('#f8fafc');
            doc
              .fillColor(colors.textMuted)
              .font('Helvetica-Oblique')
              .fontSize(8)
              .text('[Image file preview not available on server]', cardX + 12, rowY + 75, {
                width: photoBoxWidth - 24,
                align: 'center',
              });
          }

          // Caption & Discipline footer
          const captionText = photo.caption ? photo.caption : 'No caption provided';
          doc
            .fillColor(colors.textPrimary)
            .font('Helvetica')
            .fontSize(7.5)
            .text(`Caption: ${captionText}`, cardX + 8, rowY + 148, {
              width: photoBoxWidth - 16,
              ellipsis: true,
            });

          let discNames = 'Discipline: General / None';
          if (photo.disciplines && photo.disciplines.length > 0) {
            discNames = `Discipline: ${photo.disciplines.map((d: any) => d.name).join(', ')}`;
          }
          doc
            .fillColor(colors.textMuted)
            .font('Helvetica')
            .fontSize(7)
            .text(discNames, cardX + 8, rowY + 162, {
              width: photoBoxWidth - 16,
              ellipsis: true,
            });
        }

        curY = rowY + photoBoxHeight + 12;
      }
    }
  }

  // ── Section E: Sign-Off & Verification Block ──────────────────────────────
  ensureSpace(110);
  renderSectionHeader('Section E — Sign-Off & Approvals', 'E');

  const signBoxWidth = (contentWidth - 16) / 2;
  const signBoxHeight = 85;
  const signY = curY;

  // Box 1: Conducted by
  doc.roundedRect(marginLeft, signY, signBoxWidth, signBoxHeight, 4).fillAndStroke(colors.bgLight, colors.cardBorder);
  doc.fillColor(colors.primaryDark).font('Helvetica-Bold').fontSize(8.5).text('Conducted & Inspected By:', marginLeft + 10, signY + 8);
  doc.fillColor(colors.textPrimary).font('Helvetica').fontSize(8).text(`Name: ${cleanVal(survey.conducted_by_name, 'System Administrator')}`, marginLeft + 10, signY + 24);
  doc.fillColor(colors.textMuted).font('Helvetica').fontSize(8).text(`Date: ${surveyDateFormatted}`, marginLeft + 10, signY + 38);
  doc.moveTo(marginLeft + 10, signY + 68).lineTo(marginLeft + signBoxWidth - 10, signY + 68).strokeColor(colors.cardBorder).stroke();
  doc.fillColor(colors.textMuted).font('Helvetica-Oblique').fontSize(7.5).text('Inspector Signature & Stamp', marginLeft + 10, signY + 71, { align: 'center', width: signBoxWidth - 20 });

  // Box 2: Verified / Approved by
  const box2X = marginLeft + signBoxWidth + 16;
  doc.roundedRect(box2X, signY, signBoxWidth, signBoxHeight, 4).fillAndStroke(colors.bgLight, colors.cardBorder);
  doc.fillColor(colors.primaryDark).font('Helvetica-Bold').fontSize(8.5).text('Verified & Approved By:', box2X + 10, signY + 8);
  const approverStatusText = rawStatus === 'verified' ? 'Approved / Verified' : 'Pending Verification';
  doc.fillColor(colors.textPrimary).font('Helvetica').fontSize(8).text(`Status: ${approverStatusText}`, box2X + 10, signY + 24);
  doc.fillColor(colors.textMuted).font('Helvetica').fontSize(8).text(`Approval Date: ${rawStatus === 'verified' ? surveyDateFormatted : '—'}`, box2X + 10, signY + 38);
  doc.moveTo(box2X + 10, signY + 68).lineTo(box2X + signBoxWidth - 10, signY + 68).strokeColor(colors.cardBorder).stroke();
  doc.fillColor(colors.textMuted).font('Helvetica-Oblique').fontSize(7.5).text('Authorized Management Signature', box2X + 10, signY + 71, { align: 'center', width: signBoxWidth - 20 });

  curY = signY + signBoxHeight + 15;


  // ── Global Header & Footer Across All Pages (Dynamic Page X of Y) ─────────
  const pageRange = doc.bufferedPageRange();
  const totalPages = pageRange.count;
  const printTimestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);

    // If continuation page (Page 2+), render compact running header
    if (i > 0) {
      doc.rect(0, 0, pageWidth, 4).fill(colors.primary);

      doc.fillColor(colors.textMuted).font('Helvetica-Bold').fontSize(8);
      doc.text('PMS Company Ltd. — SITE SURVEY REPORT', marginLeft, 14, { width: 300, lineBreak: false });

      doc.font('Helvetica').fontSize(8);
      doc.text(`Ref: ${surveyCodeStr} | Project: ${survey.project_name || 'General'}`, marginLeft, 14, {
        width: contentWidth,
        align: 'right',
        lineBreak: false,
      });

      doc.moveTo(marginLeft, 26).lineTo(marginLeft + contentWidth, 26).strokeColor(colors.cardBorder).stroke();
    }

    // Running Footer on every page
    const footerTop = pageHeight - 28;

    // Temporarily zero out bottom margin so drawing the footer never triggers auto-pagination
    const prevBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    // Divider line
    doc.moveTo(marginLeft, footerTop).lineTo(marginLeft + contentWidth, footerTop).strokeColor(colors.cardBorder).stroke();

    // Footer Left: Company & Confidentiality
    doc
      .fillColor(colors.textMuted)
      .font('Helvetica')
      .fontSize(7.5)
      .text('PMS Company Ltd.  |  Confidential  |  Generated by PMS ERP', marginLeft, footerTop + 6, {
        lineBreak: false,
      });

    // Footer Center: Generated Timestamp
    doc
      .fillColor(colors.textMuted)
      .font('Helvetica')
      .fontSize(7.5)
      .text(`Generated: ${printTimestamp}`, marginLeft, footerTop + 6, {
        width: contentWidth,
        align: 'center',
        lineBreak: false,
      });

    // Footer Right: Dynamic Pagination (Page X of Y)
    doc
      .fillColor(colors.primaryDark)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text(`Page ${i + 1} of ${totalPages}`, marginLeft, footerTop + 6, {
        width: contentWidth,
        align: 'right',
        lineBreak: false,
      });

    // Restore bottom margin
    doc.page.margins.bottom = prevBottomMargin;
  }

  doc.end();
};

