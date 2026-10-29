import { Router } from 'express';
import { ProcurementController } from '../controllers/procurement.controller';
import { ProcurementReportController } from '../controllers/procurementReport.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';
import { requireWorkCategory } from '../middleware/workCategory.middleware';

const router = Router();
const ctrl = new ProcurementController();
const reportCtrl = new ProcurementReportController();

router.use(authenticateJwt);
router.use(requireWorkCategory('material'));

// ── Stores ─────────────────────────────────────────────────────────────
router.get('/stores', requirePermission('stock', 'view'), ctrl.getStores);
router.post('/stores', requirePermission('stock', 'adjust'), ctrl.createStore);
router.put('/stores/:id', requirePermission('stock', 'adjust'), ctrl.updateStore);

// ── Indents ────────────────────────────────────────────────────────────
router.get('/indents', requirePermission('purchase_orders', 'view'), ctrl.getIndents);
router.get('/indents/:id', requirePermission('purchase_orders', 'view'), ctrl.getIndentById);
router.post('/indents', requirePermission('purchase_orders', 'create'), ctrl.createIndent);
router.patch('/indents/:id/status', requirePermission('purchase_orders', 'approve'), ctrl.updateIndentStatus);

// ── Purchase Orders ────────────────────────────────────────────────────
router.get('/purchase-orders', requirePermission('purchase_orders', 'view'), ctrl.getPurchaseOrders);
router.get('/purchase-orders/:id/receivable-lines', requirePermission('purchase_orders', 'view'), ctrl.getReceivablePoLines);
router.get('/purchase-orders/:id', requirePermission('purchase_orders', 'view'), ctrl.getPurchaseOrderById);
router.post('/purchase-orders', requirePermission('purchase_orders', 'create'), ctrl.createPurchaseOrder);
router.patch('/purchase-orders/:id/approve', requirePermission('purchase_orders', 'approve'), ctrl.approvePurchaseOrder);
router.patch('/purchase-orders/:id/cancel', requirePermission('purchase_orders', 'update'), ctrl.cancelPurchaseOrder);
router.patch('/purchase-orders/:id/override', requirePermission('purchase_orders', 'override'), ctrl.overrideRecommendation);

// ── Goods Receipt Notes (GRN) ──────────────────────────────────────────
router.get('/grn', requirePermission('grn', 'view'), ctrl.getGrns);
router.get('/grn/:id', requirePermission('grn', 'view'), ctrl.getGrnById);
router.post('/grn', requirePermission('grn', 'create'), ctrl.createDraftGrn);
router.post('/grn/:id/post', requirePermission('grn', 'post'), ctrl.postGrn);
router.post('/grn/:id/reverse', requirePermission('grn', 'reverse'), ctrl.reverseGrn);
router.patch('/grn/:id/cancel', requirePermission('grn', 'cancel'), ctrl.cancelGrn);

// ── Vendor Invoices ────────────────────────────────────────────────────
router.get('/vendor-invoices', requirePermission('vendor_invoices', 'view'), ctrl.getVendorInvoices);
router.post('/vendor-invoices/from-grn/:grnId', requirePermission('vendor_invoices', 'create'), ctrl.createVendorInvoiceFromGrn);

// ── Stock Management ───────────────────────────────────────────────────
router.get('/stock/balances', requirePermission('stock', 'view'), ctrl.getStockBalances);
router.get('/stock/ledger', requirePermission('stock', 'view'), ctrl.getStockLedger);
router.post('/stock/adjust', requirePermission('stock', 'adjust'), ctrl.adjustStock);
router.post('/stock/reverse/:ledgerId', requirePermission('stock', 'adjust'), ctrl.reverseStockEntry);
router.post('/stock/transfer', requirePermission('material_issue', 'transfer'), ctrl.transferStock);
router.post('/stock/damage', requirePermission('stock', 'adjust'), ctrl.recordDamage);

// ── Material Issues, Returns & Consumption ─────────────────────────────
router.get('/issue-context', requirePermission('material_issue', 'view'), ctrl.getIssueContext);
router.get('/issues', requirePermission('material_issue', 'view'), ctrl.getMaterialIssues);
router.get('/issues/:id', requirePermission('material_issue', 'view'), ctrl.getMaterialIssueById);
router.post('/issues', requirePermission('material_issue', 'create'), ctrl.createMaterialIssue);
router.post('/issues/return', requirePermission('material_issue', 'return'), ctrl.returnMaterial);
router.post('/consumption', requirePermission('material_issue', 'consume'), ctrl.recordConsumption);

// ── Procurement Reports & Analytics (Phase 7) ──────────────────────────
router.get('/reports/:reportType', requirePermission('stock', 'view'), reportCtrl.getReport);
router.get('/reports/:reportType/export', requirePermission('stock', 'view'), reportCtrl.exportReport);

export default router;
