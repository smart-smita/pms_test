import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { MasterController } from '../controllers/master.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const ctrl = new InvoiceController();
const masterCtrl = new MasterController();

router.use(authenticateJwt);

// Currencies & Taxes (Placed BEFORE /:id to prevent route shadowing)
router.get('/currencies', masterCtrl.getCurrencies);
router.post('/currencies', requirePermission('currencies', 'manage'), masterCtrl.createCurrency);
router.get('/taxes', masterCtrl.getTaxes);
router.post('/taxes', requirePermission('taxes', 'manage'), masterCtrl.createTax);

// Billing Schedules
router.get('/schedules', requirePermission('invoices', 'view'), ctrl.getSchedules);
router.post('/schedules/generate/:projectId', requirePermission('invoices', 'create'), ctrl.generateSchedules);
router.post('/schedules', requirePermission('invoices', 'create'), ctrl.generateSchedules);

// Completed Work
router.get('/completed-work', requirePermission('invoices', 'view'), ctrl.getCompletedWork);
router.post('/completed-work', requirePermission('invoices', 'create'), ctrl.submitCompletedWork);
router.patch('/completed-work/:id/status', requirePermission('invoices', 'approve'), ctrl.updateCompletedWorkStatus);

// Invoices
router.get('/', requirePermission('invoices', 'view'), ctrl.getInvoices);
router.post('/', requirePermission('invoices', 'create'), ctrl.generateInvoice);
router.post('/:id/regenerate', requirePermission('invoices', 'update'), ctrl.regenerateDraftInvoice);
router.post('/:id/credit-note', requirePermission('invoices', 'create'), ctrl.createCreditNote);
router.post('/:id/revise', requirePermission('invoices', 'create'), ctrl.createRevision);
router.get('/:id/sources', requirePermission('invoices', 'view'), ctrl.getInvoiceSources);
router.patch('/:id/approve', requirePermission('invoices', 'approve'), ctrl.approveInvoice);
router.patch('/:id/status', requirePermission('invoices', 'approve'), ctrl.approveInvoice);
router.get('/:id/payments', requirePermission('invoices', 'view'), ctrl.getPayments);
router.post('/:id/payments', requirePermission('invoices', 'update'), ctrl.addPayment);

// Customer Receipt Vouchers (Towards-AV, GST split, Cheque/UTR, Bank, Words)
import { CustomerBillingController } from '../controllers/customerBilling.controller';
const customerBillingCtrl = new CustomerBillingController();
router.get('/:invoiceId/receipt-vouchers', requirePermission('invoices', 'view'), customerBillingCtrl.getReceiptsByInvoice);
router.post('/:invoiceId/receipt-vouchers', requirePermission('invoices', 'update'), customerBillingCtrl.createReceiptVoucher);
router.get('/receipt-vouchers/:id', requirePermission('invoices', 'view'), customerBillingCtrl.getReceiptById);
router.post('/tds-credits', requirePermission('invoices', 'update'), customerBillingCtrl.addTdsCredit);

router.get('/project-costs/:projectId', requirePermission('invoices', 'view'), ctrl.getProjectCosts);
router.get('/:id/pdf', requirePermission('invoices', 'view'), ctrl.downloadInvoicePDF);
router.post('/:id/send-email', requirePermission('invoices', 'view'), ctrl.sendEmail);
router.get('/:id', requirePermission('invoices', 'view'), ctrl.getInvoiceDetail);

export default router;
