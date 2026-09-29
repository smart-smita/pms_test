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
router.patch('/:id/approve', requirePermission('invoices', 'approve'), ctrl.approveInvoice);
router.patch('/:id/status', requirePermission('invoices', 'approve'), ctrl.approveInvoice);
router.get('/:id/payments', requirePermission('invoices', 'view'), ctrl.getPayments);
router.post('/:id/payments', requirePermission('invoices', 'update'), ctrl.addPayment);
router.get('/:id/pdf', requirePermission('invoices', 'view'), ctrl.downloadInvoicePDF);
router.get('/:id', requirePermission('invoices', 'view'), ctrl.getInvoiceDetail);

export default router;
