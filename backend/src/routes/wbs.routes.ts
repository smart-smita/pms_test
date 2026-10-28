import { Router } from 'express';
import { WbsController } from '../controllers/wbs.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const wbsController = new WbsController();

router.use(authenticateJwt);

router.get('/', wbsController.getMasterList);
router.post('/project-wbs', requirePermission('projects', 'create'), wbsController.addProjectWbs);
router.get('/project-wbs/:id/dependencies', requirePermission('projects', 'view'), wbsController.getDependencies);
router.put('/project-wbs/:id', requirePermission('projects', 'update'), wbsController.updateProjectWbs);
router.delete('/project-wbs/:id', requirePermission('projects', 'delete'), wbsController.deleteProjectWbs);

export default router;
