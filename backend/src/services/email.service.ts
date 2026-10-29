import nodemailer from 'nodemailer';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { SiteSurveyRepository } from '../repositories/siteSurvey.repository';
import { generateInvoicePDFBuffer, generateSiteSurveyPDFBuffer } from '../utils/pdfGenerator';
import { AuditService } from './audit.service';

export interface SendInvoiceEmailOptions {
  recipient_email?: string;
  include_survey_report?: boolean;
  subject?: string;
  message?: string;
}

export interface SendSurveyEmailOptions {
  recipient_email?: string;
  subject?: string;
  message?: string;
}

export class EmailService {
  private static getTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    if (user && pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }

    // Dev/Sandbox Fallback transport if SMTP credentials are not yet set in .env
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  /**
   * Send Customer Invoice with optional Photographic Site Survey Report attached
   */
  static async sendInvoiceEmail(
    invoiceId: number,
    options: SendInvoiceEmailOptions = {},
    userId?: number,
    ipAddress?: string
  ) {
    const invoice = await new InvoiceRepository().getInvoiceById(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice #${invoiceId} not found`);
    }

    const recipient = options.recipient_email || (invoice as any).customer_email || (invoice as any).client_email || 'client@example.com';
    const attachments: Array<{ filename: string; content: Buffer }> = [];

    // 1. Generate Invoice PDF Buffer
    const invoicePdfBuffer = await generateInvoicePDFBuffer(invoice);
    attachments.push({
      filename: `Tax-Invoice-${invoice.invoice_number || invoice.invoice_id}.pdf`,
      content: invoicePdfBuffer,
    });

    let surveyAttached = false;
    let surveyCode = '';

    // 2. Attach Photographic Report if requested and linked
    const targetSurveyId = invoice.survey_id;
    if (options.include_survey_report && targetSurveyId) {
      const survey = await SiteSurveyRepository.getById(Number(targetSurveyId));
      if (survey) {
        const surveyPdfBuffer = await generateSiteSurveyPDFBuffer(survey);
        const reportNum = survey.report_number || survey.survey_code || `SRV-${survey.survey_id}`;
        surveyCode = reportNum;
        attachments.push({
          filename: `Photographic-Report-${reportNum}.pdf`,
          content: surveyPdfBuffer,
        });
        surveyAttached = true;
      }
    }

    // 3. Compose Email
    const subject = options.subject || `Tax Invoice #${invoice.invoice_number} - ${invoice.project_name || 'Project Work Milestone'}${surveyAttached ? ' (With Site Photographic Report)' : ''}`;
    const defaultHtml = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; line-height: 1.6;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Tax Invoice #${invoice.invoice_number}</h2>
        <p>Dear ${invoice.customer_name || 'Valued Client'},</p>
        <p>Please find attached your Tax Invoice for work executed on project <strong>${invoice.project_name || 'Project'}</strong>.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td><strong>Invoice Date:</strong></td><td>${invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}</td></tr>
            <tr><td><strong>Total Amount:</strong></td><td>₹${Number(invoice.total_amount || 0).toLocaleString()}</td></tr>
            <tr><td><strong>Due Date:</strong></td><td>${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</td></tr>
            ${surveyAttached ? `<tr><td><strong>Attached Site Report:</strong></td><td>Photographic Report #${surveyCode}</td></tr>` : ''}
          </table>
        </div>
        ${options.message ? `<p style="padding: 10px; background: #eff6ff; border-left: 4px solid #3b82f6;">${options.message}</p>` : ''}
        <p>Kindly verify and proceed with payment clearance as per the milestone terms.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b;">This is an automated dispatch from PMS ERP Billing & Project Control System.</p>
      </div>
    `;

    const transporter = this.getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"PMS Billing" <billing@pmserp.com>',
      to: recipient,
      subject,
      html: defaultHtml,
      attachments,
    });

    // 4. Audit Log
    await AuditService.log({
      user_id: userId,
      action: 'SEND_INVOICE_EMAIL',
      module: 'invoices',
      record_id: invoiceId,
      description: `Dispatched Invoice #${invoice.invoice_number} to ${recipient}${surveyAttached ? ' with Photographic Report attached' : ''}`,
      ip_address: ipAddress,
    });

    return {
      success: true,
      recipient,
      subject,
      attachments_count: attachments.length,
      survey_attached: surveyAttached,
      message: `Invoice #${invoice.invoice_number} sent successfully to ${recipient}${surveyAttached ? ' along with Photographic Report' : ''}`,
    };
  }

  /**
   * Send Standalone Photographic Report to Customer without an Invoice
   */
  static async sendSurveyReportEmail(
    surveyId: number,
    options: SendSurveyEmailOptions = {},
    userId?: number,
    ipAddress?: string
  ) {
    const survey = await SiteSurveyRepository.getById(surveyId);
    if (!survey) {
      throw new Error(`Site Survey #${surveyId} not found`);
    }

    const recipient = options.recipient_email || survey.customer_email || 'client@example.com';
    const reportNum = survey.report_number || survey.survey_code || `SRV-${survey.survey_id}`;

    // 1. Generate Photographic Report PDF Buffer
    const surveyPdfBuffer = await generateSiteSurveyPDFBuffer(survey);
    const attachments = [
      {
        filename: `Photographic-Report-${reportNum}.pdf`,
        content: surveyPdfBuffer,
      },
    ];

    // 2. Compose Email
    const subject = options.subject || `Site Photographic Progress Report #${reportNum} - ${survey.project_name || 'Project Update'}`;
    const defaultHtml = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; line-height: 1.6;">
        <h2 style="color: #1e40af; margin-bottom: 8px;">Site Photographic Progress Report</h2>
        <p>Dear ${survey.customer_name || 'Valued Client'},</p>
        <p>We are pleased to share the latest photographic documentation of construction and site execution progress for project <strong>${survey.project_name || 'Project'}</strong>.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td><strong>Report Number:</strong></td><td>${reportNum}</td></tr>
            <tr><td><strong>Document Ref:</strong></td><td>${survey.document_number || 'PLN-03-F04'} (Rev ${survey.revision_number || 'R1'})</td></tr>
            <tr><td><strong>Inspection Date:</strong></td><td>${survey.survey_date ? new Date(survey.survey_date).toLocaleDateString() : 'N/A'}</td></tr>
            <tr><td><strong>Site Location:</strong></td><td>${survey.location_details || survey.project_address || 'On-Site'}</td></tr>
            <tr><td><strong>Photos Included:</strong></td><td>${survey.photos?.length || 0} Captures</td></tr>
          </table>
        </div>
        ${options.message ? `<p style="padding: 10px; background: #eff6ff; border-left: 4px solid #3b82f6;">${options.message}</p>` : ''}
        <p>Please review the attached formal Photographic Report PDF for full visual details.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b;">This is an automated site progress update from PMS Project Management & Engineering Services.</p>
      </div>
    `;

    const transporter = this.getTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"PMS Site Engineering" <engineering@pmserp.com>',
      to: recipient,
      subject,
      html: defaultHtml,
      attachments,
    });

    // 3. Audit Log
    await AuditService.log({
      user_id: userId,
      action: 'SEND_SURVEY_REPORT_EMAIL',
      module: 'site_surveys',
      record_id: surveyId,
      description: `Dispatched standalone Photographic Report #${reportNum} to ${recipient}`,
      ip_address: ipAddress,
    });

    return {
      success: true,
      recipient,
      subject,
      report_number: reportNum,
      message: `Photographic Report #${reportNum} sent successfully to ${recipient}`,
    };
  }
}
