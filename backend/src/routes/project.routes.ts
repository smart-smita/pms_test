import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';
import { WbsController } from '../controllers/wbs.controller';

const router = Router();
const controller = new ProjectController();

router.use(authenticateJwt);

router.get('/', requirePermission('projects', 'view'), controller.getAll);
router.get('/:id', requirePermission('projects', 'view'), controller.getById);
router.get('/:id/360', requirePermission('projects', 'view'), controller.get360Details);
router.post('/', requirePermission('projects', 'create'), controller.create);
router.put('/:id', requirePermission('projects', 'update'), controller.update);
router.patch('/:id/status', requirePermission('projects', 'update'), controller.updateStatus);
router.delete('/:id', requirePermission('projects', 'delete'), controller.delete);

const wbsController = new WbsController();
router.get('/:projectId/wbs', requirePermission('projects', 'view'), wbsController.getProjectWbs);

export default router;
