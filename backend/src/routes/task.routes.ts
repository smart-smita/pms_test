import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const controller = new TaskController();

router.use(authenticateJwt);

router.get('/', requirePermission('tasks', 'view'), controller.getAll);
router.get('/:id', requirePermission('tasks', 'view'), controller.getById);
router.post('/', requirePermission('tasks', 'create'), controller.create);
router.put('/:id', requirePermission('tasks', 'update'), controller.update);
router.post('/:id/assign', requirePermission('tasks', 'assign'), controller.assignWorkers);
router.delete('/:id', requirePermission('tasks', 'delete'), controller.delete);

export default router;
