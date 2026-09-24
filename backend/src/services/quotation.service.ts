import { QuotationRepository, CreateQuotationDTO, QuotationDisciplineDTO } from '../repositories/quotation.repository';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { Response } from 'express';

export class QuotationService {
  static async getAll(filters: { customer_id?: number; project_id?: number; status?: string } = {}) {
    return QuotationRepository.getAll(filters);
  }

  static async getById(id: number) {
    const quotation = await QuotationRepository.getById(id);
    if (!quotation) {
      throw new Error(`Quotation with ID ${id} not found`);
    }
    return quotation;
  }

  static async create(data: CreateQuotationDTO, disciplines: QuotationDisciplineDTO[], userId?: number, ipAddress?: string) {
    if (!data.customer_id) throw new Error('Customer ID is required');
    if (!data.project_id) throw new Error('Project ID is required');
    if (!data.quotation_date) throw new Error('Quotation date is required');

    // Calculate subtotal from disciplines if provided
    let subtotal = 0;
    if (disciplines && disciplines.length > 0) {
      for (const d of disciplines) {
        d.amount = Number(d.quantity || 1) * Number(d.rate || 0);
        subtotal += d.amount;
      }
      data.subtotal_amount = subtotal;
    }

    const taxPct = data.tax_percentage || 0;
    data.tax_amount = (data.subtotal_amount * taxPct) / 100;
    const discount = data.discount_amount || 0;
    data.total_amount = data.subtotal_amount + data.tax_amount - discount;

    return QuotationRepository.create(data, disciplines, userId, ipAddress);
  }

  static async update(id: number, data: Partial<CreateQuotationDTO>, disciplines?: QuotationDisciplineDTO[], userId?: number, ipAddress?: string) {
    const existing = await QuotationRepository.getById(id);
    if (!existing) throw new Error(`Quotation with ID ${id} not found`);

    if (existing.status === 'approved') {
      throw new Error('Approved quotations cannot be directly edited. Create a revision instead.');
    }

    if (disciplines && disciplines.length > 0) {
      let subtotal = 0;
      for (const d of disciplines) {
        d.amount = Number(d.quantity || 1) * Number(d.rate || 0);
        subtotal += d.amount;
      }
      data.subtotal_amount = subtotal;
    }

    const subtotal = data.subtotal_amount !== undefined ? data.subtotal_amount : existing.subtotal_amount;
    const taxPct = data.tax_percentage !== undefined ? data.tax_percentage : existing.tax_percentage;
    data.tax_amount = (subtotal * taxPct) / 100;
    const discount = data.discount_amount !== undefined ? data.discount_amount : existing.discount_amount;
    data.total_amount = subtotal + data.tax_amount - discount;

    return QuotationRepository.update(id, data, disciplines, userId, ipAddress);
  }

  static async updateStatus(id: number, status: 'approved' | 'rejected' | 'pending_approval', approvedBy?: number, rejectionReason?: string, ipAddress?: string) {
    const existing = await QuotationRepository.getById(id);
    if (!existing) throw new Error(`Quotation with ID ${id} not found`);

    return QuotationRepository.updateStatus(id, status, approvedBy, rejectionReason, ipAddress);
  }

  static async delete(id: number, userId?: number, ipAddress?: string) {
    const existing = await QuotationRepository.getById(id);
    if (!existing) throw new Error(`Quotation with ID ${id} not found`);

    return QuotationRepository.softDelete(id, userId, ipAddress);
  }

  static async generatePdf(id: number, res: Response) {
    const quotation = await QuotationRepository.getById(id);
    if (!quotation) throw new Error(`Quotation with ID ${id} not found`);

    return generateQuotationPDF(quotation, res);
  }
}
