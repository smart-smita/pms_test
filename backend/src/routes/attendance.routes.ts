import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const controller = new AttendanceController();

router.use(authenticateJwt);

router.post('/check-in', requirePermission('attendance', 'create'), controller.checkIn);
router.post('/check-out', requirePermission('attendance', 'create'), controller.checkOut);
router.get('/active', requirePermission('attendance', 'view'), controller.getActiveCheckIn);
router.get('/logs', requirePermission('attendance', 'view'), controller.getLogs);

export default router;
