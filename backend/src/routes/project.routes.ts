import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const controller = new ProjectController();

router.use(authenticateJwt);

router.get('/', requirePermission('projects', 'view'), controller.getAll);
router.get('/:id', requirePermission('projects', 'view'), controller.getById);
router.post('/', requirePermission('projects', 'create'), controller.create);
router.put('/:id', requirePermission('projects', 'update'), controller.update);
router.delete('/:id', requirePermission('projects', 'delete'), controller.delete);

export default router;
