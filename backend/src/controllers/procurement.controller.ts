import { Request, Response } from 'express';
import { ProcurementService } from '../services/procurement.service';
import { StockService } from '../services/stock.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class ProcurementController {
  private svc = new ProcurementService();
  private stockSvc = new StockService();

  // ── Stores ─────────────────────────────────────────────────────────────
  getStores = async (req: Request, res: Response) => {
    try {
      const pId = req.query.project_id ? Number(req.query.project_id) : undefined;
      const all = req.query.all === 'true';
      const data = await this.svc.getStores(pId, all);
      return sendSuccess(res, 'Stores retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  createStore = async (req: Request, res: Response) => {
    try {
      const id = await this.svc.createStore(req.body);
      return sendSuccess(res, 'Store created', { store_id: id }, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateStore = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const success = await this.svc.updateStore(id, req.body);
      if (!success) return sendError(res, 'Store not found or no changes made', [], 404);
      return sendSuccess(res, 'Store updated successfully', { store_id: id });
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Indents ────────────────────────────────────────────────────────────
  getIndents = async (req: Request, res: Response) => {
    try {
      const pId = req.query.project_id ? Number(req.query.project_id) : undefined;
      const status = req.query.status as string;
      const data = await this.svc.getIndents({ project_id: pId, status });
      return sendSuccess(res, 'Indents retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  getIndentById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = await this.svc.getIndentById(id);
      return sendSuccess(res, 'Indent details', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 404);
    }
  };

  createIndent = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.employee_id || 1;
      const id = await this.svc.createIndent(req.body, userId);
      return sendSuccess(res, 'Indent created successfully', { indent_id: id }, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  updateIndentStatus = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      const userId = (req as any).user?.employee_id || 1;
      await this.svc.updateIndentStatus(id, status, userId, req.ip);
      return sendSuccess(res, `Indent status updated to ${status}`);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Purchase Orders ────────────────────────────────────────────────────
  getPurchaseOrders = async (req: Request, res: Response) => {
    try {
      const pId = req.query.project_id ? Number(req.query.project_id) : undefined;
      const vId = req.query.vendor_id ? Number(req.query.vendor_id) : undefined;
      const status = req.query.status as string;
      const data = await this.svc.getPurchaseOrders({ project_id: pId, vendor_id: vId, status });
      return sendSuccess(res, 'Purchase orders retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  getPurchaseOrderById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = await this.svc.getPurchaseOrderById(id);
      return sendSuccess(res, 'Purchase order details', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 404);
    }
  };

  createPurchaseOrder = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.employee_id || 1;
      const id = await this.svc.createPurchaseOrder(req.body, userId);
      return sendSuccess(res, 'Purchase order created successfully', { po_id: id }, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  approvePurchaseOrder = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id || 1;
      await this.svc.approvePurchaseOrder(id, userId, req.ip);
      return sendSuccess(res, 'Purchase order approved');
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  cancelPurchaseOrder = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { reason } = req.body;
      const userId = (req as any).user?.employee_id || 1;
      await this.svc.cancelPurchaseOrder(id, reason, userId, req.ip);
      return sendSuccess(res, 'Purchase order cancelled');
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  overrideRecommendation = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { reason } = req.body;
      const userId = (req as any).user?.employee_id || 1;
      await this.svc.overrideRecommendation(id, reason, userId, req.ip);
      return sendSuccess(res, 'Purchase recommendation override logged successfully');
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Goods Receipt Notes (GRN) ──────────────────────────────────────────
  getGrns = async (req: Request, res: Response) => {
    try {
      const pId = req.query.project_id ? Number(req.query.project_id) : undefined;
      const status = req.query.status as string;
      const data = await this.svc.getGrns({ project_id: pId, status });
      return sendSuccess(res, 'Goods receipt notes retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  getGrnById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = await this.svc.getGrnById(id);
      return sendSuccess(res, 'GRN details', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 404);
    }
  };

  createDraftGrn = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.employee_id || 1;
      const id = await this.svc.createDraftGrn(req.body, userId);
      return sendSuccess(res, 'Draft GRN created successfully', { grn_id: id }, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  postGrn = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const userId = (req as any).user?.employee_id || 1;
      const result = await this.svc.postGrn(id, userId, req.ip);
      return sendSuccess(res, 'GRN posted successfully to stock ledger', result);
    } catch (e: any) {
      const statusCode = e.statusCode || 400;
      return sendError(res, e.message, [], statusCode);
    }
  };

  cancelGrn = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { reason } = req.body;
      const userId = (req as any).user?.employee_id || 1;
      await this.svc.cancelGrn(id, reason, userId, req.ip);
      return sendSuccess(res, 'GRN cancelled');
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Stock Management ───────────────────────────────────────────────────
  getStockBalances = async (req: Request, res: Response) => {
    try {
      const storeId = req.query.store_id ? Number(req.query.store_id) : undefined;
      const materialId = req.query.material_id ? Number(req.query.material_id) : undefined;
      const search = req.query.search as string;
      const data = await this.stockSvc.getStoreBalances({ store_id: storeId, material_id: materialId, search });
      return sendSuccess(res, 'Stock balances retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  getStockLedger = async (req: Request, res: Response) => {
    try {
      const storeId = req.query.store_id ? Number(req.query.store_id) : undefined;
      const materialId = req.query.material_id ? Number(req.query.material_id) : undefined;
      const projectId = req.query.project_id ? Number(req.query.project_id) : undefined;
      const txnType = req.query.txn_type as string;
      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;
      const limit = req.query.limit ? Number(req.query.limit) : 200;

      const data = await this.stockSvc.getStockLedger({
        store_id: storeId,
        material_id: materialId,
        project_id: projectId,
        txn_type: txnType,
        start_date: startDate,
        end_date: endDate,
        limit,
      });
      return sendSuccess(res, 'Stock ledger audit trail retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  adjustStock = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.employee_id || 1;
      const result = await this.stockSvc.adjustStock({
        ...req.body,
        user_id: userId,
        req_ip: req.ip,
      });
      return sendSuccess(res, 'Stock adjustment posted successfully', result);
    } catch (e: any) {
      const statusCode = e.statusCode || 400;
      return sendError(res, e.message, [], statusCode);
    }
  };

  reverseStockEntry = async (req: Request, res: Response) => {
    try {
      const ledgerId = Number(req.params.ledgerId);
      const { reason } = req.body;
      const userId = (req as any).user?.employee_id || 1;
      if (!reason) {
        return sendError(res, 'Reversal reason is required', [], 400);
      }
      const result = await this.stockSvc.reverse(ledgerId, userId, reason);
      return sendSuccess(res, 'Stock ledger entry reversed successfully', result);
    } catch (e: any) {
      const statusCode = e.statusCode || 400;
      return sendError(res, e.message, [], statusCode);
    }
  };

  // ── Material Issues ────────────────────────────────────────────────────
  getMaterialIssues = async (req: Request, res: Response) => {
    try {
      const pId = req.query.project_id ? Number(req.query.project_id) : undefined;
      const tId = req.query.task_id ? Number(req.query.task_id) : undefined;
      const data = await this.svc.getMaterialIssues({ project_id: pId, task_id: tId });
      return sendSuccess(res, 'Material issues retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  getMaterialIssueById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = await this.svc.getMaterialIssueById(id);
      return sendSuccess(res, 'Material issue details', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 404);
    }
  };

  createMaterialIssue = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.employee_id || 1;
      const result = await this.svc.createMaterialIssue({
        ...req.body,
        user_id: userId,
        req_ip: req.ip,
      });
      return sendSuccess(res, 'Material issued successfully', result, 201);
    } catch (e: any) {
      const statusCode = e.statusCode || 400;
      return sendError(res, e.message, [], statusCode);
    }
  };

  returnMaterial = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.employee_id || 1;
      const result = await this.svc.returnMaterial({
        ...req.body,
        user_id: userId,
        req_ip: req.ip,
      });
      return sendSuccess(res, 'Material returned to store successfully', result);
    } catch (e: any) {
      const statusCode = e.statusCode || 400;
      return sendError(res, e.message, [], statusCode);
    }
  };

  // ── Phase 4: PO Receivable Lines ─────────────────────────────────────
  getReceivablePoLines = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const data = await this.svc.getReceivablePoLines(id);
      return sendSuccess(res, 'Receivable lines retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  // ── Phase 4: GRN Reversal ─────────────────────────────────────────────
  reverseGrn = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { reason } = req.body;
      const userId = (req as any).user?.employee_id || 1;
      if (!reason || !reason.trim()) {
        return sendError(res, 'Reversal reason is required', [], 400);
      }
      const result = await this.svc.reverseGrn(id, reason, userId, req.ip);
      return sendSuccess(res, 'GRN reversed successfully', result);
    } catch (e: any) {
      const statusCode = e.statusCode || (e.message?.includes('Cannot reverse') ? 409 : 400);
      return sendError(res, e.message, [], statusCode);
    }
  };

  // ── Phase 4: Vendor Invoices ──────────────────────────────────────────
  createVendorInvoiceFromGrn = async (req: Request, res: Response) => {
    try {
      const grnId = Number(req.params.grnId);
      const userId = (req as any).user?.employee_id || 1;
      const result = await this.svc.createVendorInvoiceFromGrn(grnId, userId, req.ip);
      return sendSuccess(res, 'Vendor invoice created successfully from posted GRN', result, 201);
    } catch (e: any) {
      const statusCode = e.statusCode || 400;
      return sendError(res, e.message, [], statusCode);
    }
  };

  getVendorInvoices = async (req: Request, res: Response) => {
    try {
      const poId = req.query.po_id ? Number(req.query.po_id) : undefined;
      const grnId = req.query.grn_id ? Number(req.query.grn_id) : undefined;
      const projectId = req.query.project_id ? Number(req.query.project_id) : undefined;
      const data = await this.svc.getVendorInvoices({ po_id: poId, grn_id: grnId, project_id: projectId });
      return sendSuccess(res, 'Vendor invoices retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  // ── Phase 5: Issue Context & Consumption ──────────────────────────────
  getIssueContext = async (req: Request, res: Response) => {
    try {
      const projectId = Number(req.query.project_id);
      const wbsId = Number(req.query.wbs_id);
      const materialId = Number(req.query.material_id);
      const storeId = req.query.store_id ? Number(req.query.store_id) : 1;

      if (!projectId || !wbsId || !materialId) {
        return sendError(res, 'project_id, wbs_id, and material_id are required query parameters', [], 400);
      }

      const data = await this.svc.getIssueContext(projectId, wbsId, materialId, storeId);
      return sendSuccess(res, 'Issue context retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  recordConsumption = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.employee_id || 1;
      const result = await this.svc.recordConsumption({
        ...req.body,
        user_id: userId,
        req_ip: req.ip,
      });
      return sendSuccess(res, 'Material consumption recorded successfully', result, 201);
    } catch (e: any) {
      const statusCode = e.statusCode || 400;
      return sendError(res, e.message, [], statusCode);
    }
  };

  transferStock = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.employee_id || 1;
      const result = await this.svc.transferStock({
        ...req.body,
        user_id: userId,
        req_ip: req.ip,
      });
      return sendSuccess(res, 'Stock transferred successfully', result);
    } catch (e: any) {
      const statusCode = e.statusCode || 400;
      return sendError(res, e.message, [], statusCode);
    }
  };

  recordDamage = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.employee_id || 1;
      const result = await this.svc.recordDamage({
        ...req.body,
        user_id: userId,
        req_ip: req.ip,
      });
      return sendSuccess(res, 'Damaged stock written off successfully', result);
    } catch (e: any) {
      const statusCode = e.statusCode || 400;
      return sendError(res, e.message, [], statusCode);
    }
  };
}
