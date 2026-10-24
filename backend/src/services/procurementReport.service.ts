import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { ProcurementReportRepository, ReportFilterOptions } from '../repositories/procurementReport.repository';

export class ProcurementReportService {
  private reportRepo = new ProcurementReportRepository();

  async getReportData(reportType: string, filters: ReportFilterOptions): Promise<any> {
    switch (reportType) {
      case 'purchased-vs-ordered':
        return await this.reportRepo.getPurchasedVsOrderedReport(filters);
      case 'qc-inspection':
        return await this.reportRepo.getInspectionReport(filters);
      case 'stock-on-hand':
        return await this.reportRepo.getStockOnHandReport(filters);
      case 'project-usage':
        return await this.reportRepo.getProjectUsageReport(filters);
      case 'remaining-requirement':
        return await this.reportRepo.getRemainingRequirementReport(filters);
      case 'purchase-vs-consumption':
        return await this.reportRepo.getPurchaseVsConsumptionReport(filters);
      case 'stock-movement':
        return await this.reportRepo.getStockMovementReport(filters);
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  // ── CSV Export Generator ──────────────────────────────────────────────────
  async exportCsv(reportType: string, filters: ReportFilterOptions): Promise<{ filename: string; csv: string }> {
    // For export, fetch up to 10000 records
    const exportFilters = { ...filters, page: 1, limit: 10000 };
    const data: any = await this.getReportData(reportType, exportFilters);
    const dateStr = new Date().toISOString().split('T')[0];

    const filename = `procurement_${reportType}_${dateStr}.csv`;
    let headers: string[] = [];
    let rows: any[][] = [];

    const escape = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    switch (reportType) {
      case 'purchased-vs-ordered': {
        headers = ['PO Number', 'PO Date', 'Status', 'Vendor', 'Project', 'Material', 'Unit', 'Unit Rate', 'Ordered Qty', 'Received Qty (Ledger)', 'Pending Qty', 'Total Cost'];
        rows = (data.items || []).map((r: any) => [
          r.po_number,
          r.po_date,
          r.po_status,
          r.vendor_name,
          r.project_name || 'Central Store',
          r.material_name,
          r.unit,
          r.unit_rate,
          r.ordered_quantity,
          r.received_quantity,
          r.pending_quantity,
          r.total_ordered_cost,
        ]);
        if (data.totals) {
          rows.push([
            'TOTALS', '', '', '', '', '', '', '',
            data.totals.total_ordered_qty,
            data.totals.total_received_qty,
            data.totals.total_pending_qty,
            data.totals.total_ordered_amount,
          ]);
        }
        break;
      }

      case 'qc-inspection': {
        headers = ['GRN Number', 'Delivery Date', 'Status', 'PO Number', 'Vendor', 'Material', 'Ordered Qty', 'Received Qty', 'Accepted Qty', 'Rejected Qty', 'Damaged Qty', 'Accepted Value', 'Remarks'];
        rows = (data.items || []).map((r: any) => [
          r.grn_number,
          r.delivery_date,
          r.grn_status,
          r.po_number || '-',
          r.vendor_name,
          r.material_name,
          r.ordered_quantity,
          r.received_quantity,
          r.accepted_quantity,
          r.rejected_quantity,
          r.damaged_quantity,
          r.total_accepted_value,
          r.remarks || '',
        ]);
        if (data.totals) {
          rows.push([
            'TOTALS', '', '', '', '', '', '',
            data.totals.total_received_qty,
            data.totals.total_accepted_qty,
            data.totals.total_rejected_qty,
            data.totals.total_damaged_qty,
            data.totals.total_accepted_value,
            '',
          ]);
        }
        break;
      }

      case 'stock-on-hand': {
        headers = ['Store Name', 'Material Code', 'Material Name', 'Category', 'Unit', 'Unit Rate', 'On Hand Qty (Ledger)', 'Reserved Qty', 'Available Qty', 'Total Valuation'];
        rows = (data.items || []).map((r: any) => [
          r.store_name,
          r.material_code,
          r.material_name,
          r.category,
          r.unit,
          r.unit_rate,
          r.on_hand_qty,
          r.reserved_qty,
          r.available_qty,
          r.total_valuation,
        ]);
        if (data.totals) {
          rows.push([
            'TOTALS', '', '', '', '', '',
            data.totals.total_on_hand,
            data.totals.total_reserved,
            data.totals.total_available,
            data.totals.total_valuation,
          ]);
        }
        break;
      }

      case 'project-usage': {
        headers = ['Txn Date', 'Txn Type', 'Project', 'WBS', 'Task', 'Store', 'Material', 'Unit', 'Rate', 'Issued Qty', 'Consumed Qty', 'Returned Qty', 'Net Used Qty', 'Net Cost', 'Logged By', 'Remarks'];
        rows = (data.items || []).map((r: any) => [
          r.txn_date,
          r.txn_type,
          r.project_name,
          r.wbs_name,
          r.task_name,
          r.store_name,
          r.material_name,
          r.unit,
          r.rate,
          r.issued_qty,
          r.consumed_qty,
          r.returned_qty,
          r.net_used_qty,
          r.net_cost,
          r.created_by_name,
          r.remarks || '',
        ]);
        if (data.totals) {
          rows.push([
            'TOTALS', '', '', '', '', '', '', '', '',
            data.totals.total_issued_qty,
            data.totals.total_consumed_qty,
            data.totals.total_returned_qty,
            data.totals.total_net_used_qty,
            data.totals.total_net_cost,
            '', '',
          ]);
        }
        break;
      }

      case 'remaining-requirement': {
        headers = ['Project', 'WBS', 'Material', 'Unit', 'Unit Rate', 'Planned Qty', 'Actual Consumed (Ledger)', 'Remaining Requirement', 'Extra Qty', 'Planned Cost', 'Actual Cost'];
        rows = (data.items || []).map((r: any) => [
          r.project_name,
          r.wbs_name,
          r.material_name,
          r.unit,
          r.unit_rate,
          r.planned_quantity,
          r.actual_consumed_qty,
          r.remaining_requirement,
          r.extra_quantity,
          r.planned_cost,
          r.actual_cost,
        ]);
        if (data.totals) {
          rows.push([
            'TOTALS', '', '', '', '',
            data.totals.total_planned_qty,
            data.totals.total_consumed_qty,
            data.totals.total_remaining_qty,
            data.totals.total_extra_qty,
            data.totals.total_planned_cost,
            data.totals.total_actual_cost,
          ]);
        }
        break;
      }

      case 'purchase-vs-consumption': {
        headers = ['Material Code', 'Material Name', 'Category', 'Unit', 'Unit Rate', 'Purchased Qty', 'Purchased Cost', 'Consumed Qty (Ledger)', 'Consumed Cost', 'In-Stock Valuation'];
        rows = (data.items || []).map((r: any) => [
          r.material_code,
          r.material_name,
          r.category,
          r.unit,
          r.unit_rate,
          r.purchased_qty,
          r.purchased_cost,
          r.consumed_qty,
          r.consumed_cost,
          r.in_stock_valuation,
        ]);
        if (data.totals) {
          rows.push([
            'TOTALS', '', '', '', '', '',
            data.totals.total_purchased_cost,
            '',
            data.totals.total_consumed_cost,
            data.totals.total_in_stock_valuation,
          ]);
        }
        break;
      }

      case 'stock-movement': {
        headers = ['Ledger ID', 'Txn Date', 'Txn Type', 'Ref Type', 'Ref ID', 'Store', 'Material', 'Unit', 'Rate', 'Qty In', 'Qty Out', 'Total Value', 'Project', 'WBS', 'By', 'Remarks'];
        rows = (data.items || []).map((r: any) => [
          r.ledger_id,
          r.txn_date,
          r.txn_type,
          r.ref_type,
          r.ref_id,
          r.store_name,
          r.material_name,
          r.unit,
          r.rate,
          r.qty_in,
          r.qty_out,
          r.total_value,
          r.project_name || '-',
          r.wbs_name || '-',
          r.created_by_name,
          r.remarks || '',
        ]);
        if (data.totals) {
          rows.push([
            'TOTALS', '', '', '', '', '', '', '', '',
            data.totals.total_qty_in,
            data.totals.total_qty_out,
            data.totals.total_amount,
            '', '', '', '',
          ]);
        }
        break;
      }
    }

    const csvContent = [
      headers.map(escape).join(','),
      ...rows.map((row) => row.map(escape).join(',')),
    ].join('\r\n');

    return { filename, csv: csvContent };
  }

  // ── Tabular PDF Export Generator ───────────────────────────────────────────
  async exportPdf(reportType: string, filters: ReportFilterOptions, res: Response): Promise<void> {
    const exportFilters = { ...filters, page: 1, limit: 1000 };
    const data: any = await this.getReportData(reportType, exportFilters);
    const dateStr = new Date().toISOString().split('T')[0];

    const reportTitles: Record<string, string> = {
      'purchased-vs-ordered': 'Purchased vs Ordered vs Received vs Pending Report',
      'qc-inspection': 'QC / Inspection (Accepted vs Rejected vs Damaged) Report',
      'stock-on-hand': 'Stock On Hand by Store & Valuation Report',
      'project-usage': 'Material Issue / Consumption / Return per Project Report',
      'remaining-requirement': 'Remaining Requirement (Planned vs Actual Consumption) Report',
      'purchase-vs-consumption': 'Purchase Cost vs Consumption Cost Analysis Report',
      'stock-movement': 'Stock Movement Audit History Report',
    };

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="procurement_${reportType}_${dateStr}.pdf"`);
    doc.pipe(res);

    // Header
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text(reportTitles[reportType] || 'Procurement Report', 30, 30);

    doc
      .fontSize(8.5)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(`Generated on: ${new Date().toLocaleString()} | Source: Append-Only Stock Ledger & Procurement Engine`, 30, 52);

    doc.moveTo(30, 68).lineTo(812, 68).strokeColor('#cbd5e1').stroke();

    let startY = 80;

    // Pick top columns for PDF rendering based on report type
    let colDefinitions: { title: string; width: number; key: string }[] = [];

    switch (reportType) {
      case 'purchased-vs-ordered':
        colDefinitions = [
          { title: 'PO #', width: 70, key: 'po_number' },
          { title: 'Date', width: 60, key: 'po_date' },
          { title: 'Vendor', width: 120, key: 'vendor_name' },
          { title: 'Material', width: 130, key: 'material_name' },
          { title: 'Unit', width: 40, key: 'unit' },
          { title: 'Rate (Rs.)', width: 65, key: 'unit_rate' },
          { title: 'Ordered', width: 60, key: 'ordered_quantity' },
          { title: 'Recv (Ledger)', width: 75, key: 'received_quantity' },
          { title: 'Pending', width: 60, key: 'pending_quantity' },
          { title: 'Total (Rs.)', width: 90, key: 'total_ordered_cost' },
        ];
        break;

      case 'qc-inspection':
        colDefinitions = [
          { title: 'GRN #', width: 80, key: 'grn_number' },
          { title: 'Date', width: 65, key: 'delivery_date' },
          { title: 'PO #', width: 75, key: 'po_number' },
          { title: 'Vendor', width: 130, key: 'vendor_name' },
          { title: 'Material', width: 130, key: 'material_name' },
          { title: 'Received', width: 60, key: 'received_quantity' },
          { title: 'Accepted', width: 60, key: 'accepted_quantity' },
          { title: 'Rejected', width: 60, key: 'rejected_quantity' },
          { title: 'Damaged', width: 55, key: 'damaged_quantity' },
          { title: 'Val (Rs.)', width: 65, key: 'total_accepted_value' },
        ];
        break;

      case 'stock-on-hand':
        colDefinitions = [
          { title: 'Store', width: 120, key: 'store_name' },
          { title: 'Code', width: 75, key: 'material_code' },
          { title: 'Material', width: 170, key: 'material_name' },
          { title: 'Category', width: 95, key: 'category' },
          { title: 'Unit', width: 45, key: 'unit' },
          { title: 'Rate (Rs.)', width: 65, key: 'unit_rate' },
          { title: 'On Hand', width: 65, key: 'on_hand_qty' },
          { title: 'Reserved', width: 65, key: 'reserved_qty' },
          { title: 'Available', width: 65, key: 'available_qty' },
          { title: 'Val (Rs.)', width: 85, key: 'total_valuation' },
        ];
        break;

      case 'project-usage':
        colDefinitions = [
          { title: 'Date', width: 65, key: 'txn_date' },
          { title: 'Type', width: 75, key: 'txn_type' },
          { title: 'Project', width: 130, key: 'project_name' },
          { title: 'WBS', width: 100, key: 'wbs_name' },
          { title: 'Store', width: 90, key: 'store_name' },
          { title: 'Material', width: 130, key: 'material_name' },
          { title: 'Unit', width: 40, key: 'unit' },
          { title: 'Rate (Rs.)', width: 60, key: 'rate' },
          { title: 'Net Used', width: 60, key: 'net_used_qty' },
          { title: 'Net Cost (Rs.)', width: 80, key: 'net_cost' },
        ];
        break;

      case 'remaining-requirement':
        colDefinitions = [
          { title: 'Project', width: 140, key: 'project_name' },
          { title: 'WBS', width: 120, key: 'wbs_name' },
          { title: 'Material', width: 150, key: 'material_name' },
          { title: 'Unit', width: 45, key: 'unit' },
          { title: 'Rate', width: 55, key: 'unit_rate' },
          { title: 'Planned', width: 60, key: 'planned_quantity' },
          { title: 'Consumed', width: 60, key: 'actual_consumed_qty' },
          { title: 'Remaining', width: 65, key: 'remaining_requirement' },
          { title: 'Planned Cost', width: 75, key: 'planned_cost' },
          { title: 'Actual Cost', width: 75, key: 'actual_cost' },
        ];
        break;

      case 'purchase-vs-consumption':
        colDefinitions = [
          { title: 'Code', width: 80, key: 'material_code' },
          { title: 'Material Name', width: 180, key: 'material_name' },
          { title: 'Category', width: 100, key: 'category' },
          { title: 'Unit', width: 50, key: 'unit' },
          { title: 'Purchased Qty', width: 75, key: 'purchased_qty' },
          { title: 'Purchased Cost', width: 85, key: 'purchased_cost' },
          { title: 'Consumed Qty', width: 75, key: 'consumed_qty' },
          { title: 'Consumed Cost', width: 85, key: 'consumed_cost' },
          { title: 'In-Stock Val', width: 85, key: 'in_stock_valuation' },
        ];
        break;

      case 'stock-movement':
      default:
        colDefinitions = [
          { title: 'ID', width: 45, key: 'ledger_id' },
          { title: 'Date', width: 65, key: 'txn_date' },
          { title: 'Type', width: 75, key: 'txn_type' },
          { title: 'Store', width: 95, key: 'store_name' },
          { title: 'Material', width: 150, key: 'material_name' },
          { title: 'Unit', width: 40, key: 'unit' },
          { title: 'Rate (Rs.)', width: 60, key: 'rate' },
          { title: 'Qty In', width: 55, key: 'qty_in' },
          { title: 'Qty Out', width: 55, key: 'qty_out' },
          { title: 'Total (Rs.)', width: 75, key: 'total_value' },
          { title: 'Project', width: 105, key: 'project_name' },
        ];
        break;
    }

    // Render Table Header Bar
    doc.rect(30, startY, 782, 20).fill('#f1f5f9');
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8);

    let curX = 35;
    for (const col of colDefinitions) {
      doc.text(col.title, curX, startY + 5, { width: col.width - 6, lineBreak: false });
      curX += col.width;
    }

    startY += 22;
    doc.font('Helvetica').fontSize(7.5).fillColor('#334155');

    // Rows
    const items = data.items || [];
    for (const item of items) {
      if (startY > 520) {
        doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
        startY = 40;
        // Repeat Header
        doc.rect(30, startY, 782, 20).fill('#f1f5f9');
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8);
        let hX = 35;
        for (const col of colDefinitions) {
          doc.text(col.title, hX, startY + 5, { width: col.width - 6, lineBreak: false });
          hX += col.width;
        }
        startY += 22;
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
      }

      curX = 35;
      for (const col of colDefinitions) {
        let val = item[col.key];
        if (val === null || val === undefined) val = '-';
        doc.text(String(val), curX, startY + 3, { width: col.width - 6, lineBreak: false });
        curX += col.width;
      }

      doc.moveTo(30, startY + 16).lineTo(812, startY + 16).strokeColor('#f1f5f9').stroke();
      startY += 17;
    }

    // Totals row at the end
    if (data.totals) {
      if (startY > 510) {
        doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
        startY = 40;
      }
      doc.rect(30, startY, 782, 22).fill('#e2e8f0');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
      doc.text('TOTALS (Strict Ledger Verification):', 35, startY + 6);

      const summaryText = Object.entries(data.totals)
        .map(([k, v]) => `${k.replace('total_', '').replace(/_/g, ' ')}: ${typeof v === 'number' ? (v as number).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : v}`)
        .join('  |  ');
      doc.font('Helvetica').fontSize(8).text(summaryText, 240, startY + 6, { width: 560, lineBreak: false });
    }

    doc.end();
  }
}
