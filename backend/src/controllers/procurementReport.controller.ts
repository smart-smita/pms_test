import { Request, Response } from 'express';
import { ProcurementReportService } from '../services/procurementReport.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { ReportFilterOptions } from '../repositories/procurementReport.repository';

export class ProcurementReportController {
  private reportService = new ProcurementReportService();

  private parseFilters(req: Request): ReportFilterOptions {
    const {
      start_date,
      end_date,
      project_id,
      wbs_id,
      task_id,
      material_id,
      vendor_id,
      store_id,
      grn_id,
      po_id,
      search,
      page,
      limit,
    } = req.query;

    return {
      start_date: start_date ? String(start_date) : undefined,
      end_date: end_date ? String(end_date) : undefined,
      project_id: project_id ? Number(project_id) : undefined,
      wbs_id: wbs_id ? Number(wbs_id) : undefined,
      task_id: task_id ? Number(task_id) : undefined,
      material_id: material_id ? Number(material_id) : undefined,
      vendor_id: vendor_id ? Number(vendor_id) : undefined,
      store_id: store_id ? Number(store_id) : undefined,
      grn_id: grn_id ? Number(grn_id) : undefined,
      po_id: po_id ? Number(po_id) : undefined,
      search: search ? String(search).trim() : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
    };
  }

  getReport = async (req: Request, res: Response) => {
    try {
      const { reportType } = req.params;
      const filters = this.parseFilters(req);
      const data = await this.reportService.getReportData(reportType, filters);
      return sendSuccess(res, `${reportType} report generated successfully`, data);
    } catch (error: any) {
      console.error(`Error generating report ${req.params.reportType}:`, error);
      return sendError(res, error.message || 'Failed to generate procurement report', [], 500);
    }
  };

  exportReport = async (req: Request, res: Response) => {
    try {
      const { reportType } = req.params;
      const format = (req.query.format as string) || 'csv';
      const filters = this.parseFilters(req);

      if (format === 'pdf') {
        await this.reportService.exportPdf(reportType, filters, res);
        return;
      }

      // Default CSV export
      const { filename, csv } = await this.reportService.exportCsv(reportType, filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csv);
    } catch (error: any) {
      console.error(`Error exporting report ${req.params.reportType}:`, error);
      return sendError(res, error.message || 'Failed to export procurement report', [], 500);
    }
  };
}
