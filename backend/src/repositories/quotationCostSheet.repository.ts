import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';
import { roundDecimal } from '../services/calculation.service';

export interface QuotationCostSheetRow {
  id: number;
  quotation_id: number;
  basic_construction_value: number;
  development_charges: number;
  agreement_value: number;
  stamp_duty_percentage: number;
  stamp_duty_amount: number;
  registration_fee: number;
  gst_rate_percentage: number;
  land_abatement_fraction: number;
  effective_gst_rate: number;
  gst_amount: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
}

export class QuotationCostSheetRepository {
  async getByQuotationId(quotationId: number): Promise<QuotationCostSheetRow | null> {
    const sql = `SELECT * FROM quotation_cost_sheets WHERE quotation_id = ? LIMIT 1`;
    const [rows] = await dbPool.query<RowDataPacket[]>(sql, [quotationId]);
    if (rows.length === 0) return null;
    const r = rows[0] as any;
    return {
      ...r,
      basic_construction_value: Number(r.basic_construction_value),
      development_charges: Number(r.development_charges),
      agreement_value: Number(r.agreement_value),
      stamp_duty_percentage: Number(r.stamp_duty_percentage),
      stamp_duty_amount: Number(r.stamp_duty_amount),
      registration_fee: Number(r.registration_fee),
      gst_rate_percentage: Number(r.gst_rate_percentage),
      land_abatement_fraction: Number(r.land_abatement_fraction),
      effective_gst_rate: Number(r.effective_gst_rate),
      gst_amount: Number(r.gst_amount),
      grand_total: Number(r.grand_total)
    };
  }

  async save(data: {
    quotation_id: number;
    basic_construction_value: number;
    development_charges?: number;
    stamp_duty_percentage?: number;
    registration_fee?: number;
    gst_rate_percentage?: number;
    land_abatement_fraction?: number;
  }): Promise<QuotationCostSheetRow> {
    const basicVal = Number(data.basic_construction_value || 0);
    const devCharges = Number(data.development_charges || 0);
    const av = roundDecimal(basicVal + devCharges);

    const sdPct = Number(data.stamp_duty_percentage !== undefined ? data.stamp_duty_percentage : 6.00);
    const sdAmount = roundDecimal((av * sdPct) / 100);

    const regFee = Number(data.registration_fee !== undefined ? data.registration_fee : 30000.00);

    const gstPct = Number(data.gst_rate_percentage !== undefined ? data.gst_rate_percentage : 12.00);
    const abatement = Number(data.land_abatement_fraction !== undefined ? data.land_abatement_fraction : 0.3333);
    const effectiveGstRate = roundDecimal(gstPct * (1 - abatement));
    const gstAmount = roundDecimal((av * effectiveGstRate) / 100);

    const grandTotal = roundDecimal(av + sdAmount + regFee + gstAmount);

    const sql = `
      INSERT INTO quotation_cost_sheets (
        quotation_id, basic_construction_value, development_charges, agreement_value,
        stamp_duty_percentage, stamp_duty_amount, registration_fee,
        gst_rate_percentage, land_abatement_fraction, effective_gst_rate,
        gst_amount, grand_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        basic_construction_value = VALUES(basic_construction_value),
        development_charges = VALUES(development_charges),
        agreement_value = VALUES(agreement_value),
        stamp_duty_percentage = VALUES(stamp_duty_percentage),
        stamp_duty_amount = VALUES(stamp_duty_amount),
        registration_fee = VALUES(registration_fee),
        gst_rate_percentage = VALUES(gst_rate_percentage),
        land_abatement_fraction = VALUES(land_abatement_fraction),
        effective_gst_rate = VALUES(effective_gst_rate),
        gst_amount = VALUES(gst_amount),
        grand_total = VALUES(grand_total),
        updated_at = CURRENT_TIMESTAMP
    `;

    await dbPool.query<ResultSetHeader>(sql, [
      data.quotation_id,
      basicVal,
      devCharges,
      av,
      sdPct,
      sdAmount,
      regFee,
      gstPct,
      abatement,
      effectiveGstRate,
      gstAmount,
      grandTotal
    ]);

    const result = await this.getByQuotationId(data.quotation_id);
    return result!;
  }
}
