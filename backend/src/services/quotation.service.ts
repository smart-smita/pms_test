import { QuotationRepository, CreateQuotationDTO, QuotationDisciplineDTO } from '../repositories/quotation.repository';
import { CalculationService } from './calculation.service';
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
    if (!data.quotation_date) throw new Error('Quotation date is required');

    // Run unified decimal-safe calculations
    const lineItems: any[] = [];
    (disciplines || []).forEach((d) => {
      let lTotal = 0;
      let mTotal = 0;
      
      if (d.labours && d.labours.length > 0) {
        for (const l of d.labours) {
          lTotal += Number(l.hours || 0) * Number(l.rate || 0);
          lineItems.push({ wbs_type: 'labour', hours: l.hours, rate: l.rate, amount: Number(l.hours || 0) * Number(l.rate || 0) });
        }
      }
      
      if (d.materials && d.materials.length > 0) {
        for (const m of d.materials) {
          mTotal += Number(m.quantity || 0) * Number(m.rate || 0);
          lineItems.push({ wbs_type: 'material', quantity: m.quantity, rate: m.rate, amount: Number(m.quantity || 0) * Number(m.rate || 0) });
        }
      }

      d.amount = lTotal + mTotal;
      d.labour_cost = lTotal;
      d.material_cost = mTotal;

      const hasLabour = d.labours && d.labours.some(l => l.labour_id || l.labour_name || Number(l.hours || 0) > 0 || Number(l.rate || 0) > 0);
      const hasMaterial = d.materials && d.materials.some(m => m.material_id || m.material_name || Number(m.quantity || 0) > 0 || Number(m.rate || 0) > 0);
      if (hasLabour && !hasMaterial) d.wbs_type = 'labour';
      else if (!hasLabour && hasMaterial) d.wbs_type = 'material';
      else if (hasLabour && hasMaterial) d.wbs_type = 'both';
      else delete d.wbs_type;
    });

    const taxInputs = data.taxes && data.taxes.length > 0
      ? data.taxes
      : (data.tax_percentage ? [{
          tax_id: data.tax_id || 1,
          tax_name: data.tax_type || 'Tax',
          tax_code: null,
          tax_type: data.tax_type || null,
          tax_percentage: Number(data.tax_percentage),
        }] : []);

    const calcResult = CalculationService.calculate({
      lineItems,
      discountAmount: Number(data.discount_amount || 0),
      taxes: taxInputs,
    });

    data.subtotal_amount = calcResult.net_subtotal;
    data.discount_amount = calcResult.discount_amount;
    data.tax_amount = calcResult.total_tax_amount;
    data.total_amount = calcResult.grand_total;
    data.taxes = calcResult.taxes;

    return QuotationRepository.create(data, disciplines, userId, ipAddress);
  }

  static async update(id: number, data: Partial<CreateQuotationDTO>, disciplines?: QuotationDisciplineDTO[], userId?: number, ipAddress?: string) {
    const existing = await QuotationRepository.getById(id);
    if (!existing) throw new Error(`Quotation with ID ${id} not found`);

    if (existing.status === 'approved') {
      throw new Error('Approved quotations cannot be directly edited. Create a revision instead.');
    }

    if (disciplines && disciplines.length > 0) {
      const lineItems: any[] = [];
      disciplines.forEach((d) => {
        let lTotal = 0;
        let mTotal = 0;
        
        if (d.labours && d.labours.length > 0) {
          for (const l of d.labours) {
            lTotal += Number(l.hours || 0) * Number(l.rate || 0);
            lineItems.push({ wbs_type: 'labour', hours: l.hours, rate: l.rate, amount: Number(l.hours || 0) * Number(l.rate || 0) });
          }
        }
        
        if (d.materials && d.materials.length > 0) {
          for (const m of d.materials) {
            mTotal += Number(m.quantity || 0) * Number(m.rate || 0);
            lineItems.push({ wbs_type: 'material', quantity: m.quantity, rate: m.rate, amount: Number(m.quantity || 0) * Number(m.rate || 0) });
          }
        }
  
        d.amount = lTotal + mTotal;
        d.labour_cost = lTotal;
        d.material_cost = mTotal;

        const hasLabour = d.labours && d.labours.some(l => l.labour_id || l.labour_name || Number(l.hours || 0) > 0 || Number(l.rate || 0) > 0);
        const hasMaterial = d.materials && d.materials.some(m => m.material_id || m.material_name || Number(m.quantity || 0) > 0 || Number(m.rate || 0) > 0);
        if (hasLabour && !hasMaterial) d.wbs_type = 'labour';
        else if (!hasLabour && hasMaterial) d.wbs_type = 'material';
        else if (hasLabour && hasMaterial) d.wbs_type = 'both';
        else delete d.wbs_type;
      });

      const taxInputs = data.taxes && data.taxes.length > 0
        ? data.taxes
        : (data.tax_percentage !== undefined ? [{
            tax_id: data.tax_id || existing.tax_id || 1,
            tax_name: data.tax_type || existing.tax_type || 'Tax',
            tax_code: null,
            tax_type: data.tax_type || existing.tax_type || null,
            tax_percentage: Number(data.tax_percentage),
          }] : (existing.taxes || []));

      const calcResult = CalculationService.calculate({
        lineItems,
        discountAmount: data.discount_amount !== undefined ? Number(data.discount_amount) : Number(existing.discount_amount || 0),
        taxes: taxInputs,
      });

      data.subtotal_amount = calcResult.net_subtotal;
      data.discount_amount = calcResult.discount_amount;
      data.tax_amount = calcResult.total_tax_amount;
      data.total_amount = calcResult.grand_total;
      data.taxes = calcResult.taxes;
    }

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

  static async createProjectFromQuotation(
    quotationId: number,
    overrides: {
      project_code: string;
      project_name?: string;
      project_address?: string;
      project_type_id?: number | null;
      radius_meters?: number;
    },
    userId?: number,
    ipAddress?: string
  ) {
    return QuotationRepository.createProjectFromQuotation(quotationId, overrides, userId, ipAddress);
  }
}
