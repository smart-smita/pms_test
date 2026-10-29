import { Router } from 'express';
import { EquipmentController } from '../controllers/equipment.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const ctrl = new EquipmentController();

router.use(authenticateJwt);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', requirePermission('stock', 'adjust'), ctrl.create);
router.put('/:id', requirePermission('stock', 'adjust'), ctrl.update);
router.post('/usage-log', requirePermission('timesheets', 'create'), ctrl.logUsage);
router.get('/project/:projectId/usage-logs', ctrl.getUsageLogsByProject);

export default router;
