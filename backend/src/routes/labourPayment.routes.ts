import { Router } from 'express';
import { LabourPaymentController } from '../controllers/labourPayment.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';
import { requireWorkCategory } from '../middleware/workCategory.middleware';

const router = Router();
const controller = new LabourPaymentController();

router.use(authenticateJwt);
router.use(requireWorkCategory('labour'));

router.get('/', requirePermission('labour_payments', 'view'), controller.getAll);
router.get('/:id', requirePermission('labour_payments', 'view'), controller.getById);
router.post('/', requirePermission('labour_payments', 'create'), controller.create);
router.put('/:id/status', requirePermission('labour_payments', 'update'), controller.updateStatus);

export default router;
