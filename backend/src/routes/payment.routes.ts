import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const controller = new PaymentController();

router.use(authenticateJwt);
router.use(requirePermission('payments', 'view'));

router.get('/labour', controller.getLabourPayments);
router.get('/daily', controller.getDailyPayments);
router.get('/project', controller.getProjectPayments);
router.get('/task', controller.getTaskPayments);
router.get('/wbs', controller.getWBSPayments);

export default router;
