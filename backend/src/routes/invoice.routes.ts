import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const ctrl = new InvoiceController();

router.use(authenticateJwt);

// Billing Schedules
router.get('/schedules', requirePermission('invoices', 'view'), ctrl.getSchedules);
router.post('/schedules', requirePermission('invoices', 'create'), ctrl.generateSchedules);

// Completed Work
router.get('/completed-work', requirePermission('invoices', 'view'), ctrl.getCompletedWork);
router.post('/completed-work', requirePermission('invoices', 'create'), ctrl.submitCompletedWork);

// Invoices
router.get('/', requirePermission('invoices', 'view'), ctrl.getInvoices);
router.get('/:id', requirePermission('invoices', 'view'), ctrl.getInvoiceDetail);
router.post('/', requirePermission('invoices', 'create'), ctrl.generateInvoice);
router.patch('/:id/approve', requirePermission('invoices', 'approve'), ctrl.approveInvoice);
router.get('/:id/payments', requirePermission('invoices', 'view'), ctrl.getPayments);
router.post('/:id/payments', requirePermission('invoices', 'update'), ctrl.addPayment);
router.get('/:id/pdf', requirePermission('invoices', 'view'), ctrl.downloadInvoicePDF);

export default router;
