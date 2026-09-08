import { Router } from 'express';
import { LabourWorkLogController } from '../controllers/labourWorkLog.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const controller = new LabourWorkLogController();

router.use(authenticateJwt);

router.get('/', requirePermission('labour_work_logs', 'view'), controller.getAll);
router.get('/:id', requirePermission('labour_work_logs', 'view'), controller.getById);
router.post('/', requirePermission('labour_work_logs', 'create'), controller.create);
router.put('/:id', requirePermission('labour_work_logs', 'update'), controller.update);
router.delete('/:id', requirePermission('labour_work_logs', 'delete'), controller.delete);

export default router;
