/**
 * Frontend Calculation Engine for Quotations, Projects, and Invoices.
 * Mirrors backend calculation logic with decimal safety.
 */

export interface LineItemInput {
  wbs_type?: 'labour' | 'material' | 'both';
  quantity?: number;
  hours?: number;
  rate: number;
}

export interface TaxInput {
  tax_id: number;
  tax_name: string;
  tax_code?: string | null;
  tax_type?: string | null;
  tax_percentage: number;
}

export interface CalculatedTaxItem {
  tax_id: number;
  tax_name: string;
  tax_code?: string | null;
  tax_type?: string | null;
  tax_percentage: number;
  taxable_amount: number;
  tax_amount: number;
}

export interface CalculationResult {
  labour_subtotal: number;
  material_subtotal: number;
  net_subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  taxes: CalculatedTaxItem[];
  total_tax_amount: number;
  grand_total: number;
  currency_code: string;
  currency_symbol: string;
  exchange_rate: number;
}

export function roundDecimal(num: number, decimals: number = 2): number {
  if (isNaN(num) || !isFinite(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((Number(num) + Number.EPSILON) * factor) / factor;
}

export function calculateQuotation(params: {
  lineItems: LineItemInput[];
  discountAmount?: number;
  discountPercentage?: number;
  taxes: TaxInput[];
  currencySymbol?: string;
  currencyCode?: string;
  exchangeRate?: number;
  decimalPlaces?: number;
}): CalculationResult {
  const decimals = params.decimalPlaces !== undefined ? params.decimalPlaces : 2;
  const currencySymbol = params.currencySymbol || '₹';
  const currencyCode = params.currencyCode || 'INR';
  const exchangeRate = Number(params.exchangeRate || 1);

  let labourSubtotal = 0;
  let materialSubtotal = 0;

  for (const item of params.lineItems || []) {
    const type = item.wbs_type || 'labour';
    const qtyOrHrs = Number(
      item.hours !== undefined && item.hours > 0
        ? item.hours
        : (item.quantity !== undefined ? item.quantity : 1)
    );
    const rate = Number(item.rate || 0);
    const lineTotal = roundDecimal(qtyOrHrs * rate, decimals);

    if (type === 'material') {
      materialSubtotal = roundDecimal(materialSubtotal + lineTotal, decimals);
    } else {
      labourSubtotal = roundDecimal(labourSubtotal + lineTotal, decimals);
    }
  }

  const netSubtotal = roundDecimal(labourSubtotal + materialSubtotal, decimals);

  // Discount Calculation
  let discountAmount = 0;
  if (params.discountAmount !== undefined && params.discountAmount > 0) {
    discountAmount = roundDecimal(Math.min(params.discountAmount, netSubtotal), decimals);
  } else if (params.discountPercentage !== undefined && params.discountPercentage > 0) {
    discountAmount = roundDecimal((netSubtotal * Math.min(params.discountPercentage, 100)) / 100, decimals);
  }

  // Taxable Amount = Net Subtotal - Discount (non-negative)
  const taxableAmount = roundDecimal(Math.max(0, netSubtotal - discountAmount), decimals);

  // Multiple Taxes calculation on Taxable Amount
  let totalTaxAmount = 0;
  const calculatedTaxes: CalculatedTaxItem[] = [];

  for (const tax of params.taxes || []) {
    const pct = Number(tax.tax_percentage || 0);
    if (pct > 0) {
      const itemTax = roundDecimal((taxableAmount * pct) / 100, decimals);
      calculatedTaxes.push({
        tax_id: tax.tax_id,
        tax_name: tax.tax_name,
        tax_code: tax.tax_code || null,
        tax_type: tax.tax_type || null,
        tax_percentage: pct,
        taxable_amount: taxableAmount,
        tax_amount: itemTax,
      });
      totalTaxAmount = roundDecimal(totalTaxAmount + itemTax, decimals);
    }
  }

  // Grand Total = Taxable Amount + Total Tax
  const grandTotal = roundDecimal(taxableAmount + totalTaxAmount, decimals);

  return {
    labour_subtotal: labourSubtotal,
    material_subtotal: materialSubtotal,
    net_subtotal: netSubtotal,
    discount_amount: discountAmount,
    taxable_amount: taxableAmount,
    taxes: calculatedTaxes,
    total_tax_amount: totalTaxAmount,
    grand_total: grandTotal,
    currency_code: currencyCode,
    currency_symbol: currencySymbol,
    exchange_rate: exchangeRate,
  };
}

export function formatMoney(amount: number, symbol: string = '₹', decimals: number = 2): string {
  const val = roundDecimal(amount, decimals);
  return `${symbol} ${val.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
