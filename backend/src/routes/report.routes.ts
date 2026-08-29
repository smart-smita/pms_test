import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const controller = new ReportController();

router.use(authenticateJwt);
router.use(requirePermission('reports', 'view'));

router.get('/attendance', controller.getAttendanceReport);
router.get('/project', controller.getProjectReport);
router.get('/task', controller.getTaskReport);
router.get('/payment', controller.getPaymentReport);

export default router;
