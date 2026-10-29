import { Request, Response } from 'express';
import { QuotationCostSheetRepository } from '../repositories/quotationCostSheet.repository';

const repo = new QuotationCostSheetRepository();

export class QuotationCostSheetController {
  async getCostSheet(req: Request, res: Response) {
    try {
      const quotationId = parseInt(req.params.quotationId, 10);
      if (isNaN(quotationId)) return res.status(400).json({ success: false, message: 'Invalid quotationId' });
      const sheet = await repo.getByQuotationId(quotationId);
      res.json({ success: true, data: sheet });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async saveCostSheet(req: Request, res: Response) {
    try {
      const quotationId = parseInt(req.params.quotationId, 10);
      if (isNaN(quotationId)) return res.status(400).json({ success: false, message: 'Invalid quotationId' });

      const {
        basic_construction_value,
        development_charges,
        stamp_duty_percentage,
        registration_fee,
        gst_rate_percentage,
        land_abatement_fraction
      } = req.body;

      const saved = await repo.save({
        quotation_id: quotationId,
        basic_construction_value: Number(basic_construction_value || 0),
        development_charges: Number(development_charges || 0),
        stamp_duty_percentage: stamp_duty_percentage !== undefined ? Number(stamp_duty_percentage) : undefined,
        registration_fee: registration_fee !== undefined ? Number(registration_fee) : undefined,
        gst_rate_percentage: gst_rate_percentage !== undefined ? Number(gst_rate_percentage) : undefined,
        land_abatement_fraction: land_abatement_fraction !== undefined ? Number(land_abatement_fraction) : undefined
      });

      res.status(200).json({ success: true, data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
