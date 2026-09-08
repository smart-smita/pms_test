import { Router } from 'express';
import { TimesheetController } from '../controllers/timesheet.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const controller = new TimesheetController();

router.use(authenticateJwt);

router.get('/', requirePermission('timesheets', 'view'), controller.getAll);
router.get('/task/:taskId/history', requirePermission('timesheets', 'view'), controller.getTaskHistory);
router.get('/:id', requirePermission('timesheets', 'view'), controller.getById);
router.post('/', requirePermission('timesheets', 'create'), controller.create);
router.put('/:id', requirePermission('timesheets', 'update'), controller.update);
router.delete('/:id', requirePermission('timesheets', 'delete'), controller.delete);

export default router;
