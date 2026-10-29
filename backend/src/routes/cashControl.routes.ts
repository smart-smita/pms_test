import { Router } from 'express';
import { CashControlController } from '../controllers/cashControl.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const ctrl = new CashControlController();

router.use(authenticateJwt);

router.get('/project/:projectId', requirePermission('invoices', 'view'), ctrl.getProjectCashPosition);
router.post('/project/:projectId/check-disbursement', requirePermission('purchase_orders', 'approve'), ctrl.checkDisbursement);

export default router;
