import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const ctrl = new CustomerController();

router.use(authenticateJwt);

router.get('/', requirePermission('customers', 'view'), ctrl.getAll);
router.get('/:id', requirePermission('customers', 'view'), ctrl.getById);
router.post('/', requirePermission('customers', 'create'), ctrl.create);
router.put('/:id', requirePermission('customers', 'update'), ctrl.update);
router.delete('/:id', requirePermission('customers', 'delete'), ctrl.delete);

// Customer Statement of Account Ledger
import { CustomerBillingController } from '../controllers/customerBilling.controller';
const billingCtrl = new CustomerBillingController();
router.get('/allotment/:projectCustomerId/statement-of-account', requirePermission('invoices', 'view'), billingCtrl.getStatementOfAccount);

export default router;
