import { Router } from 'express';
import { SiteSurveyController } from '../controllers/siteSurvey.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('site_surveys', 'view'), SiteSurveyController.getAll);
router.get('/:id', requirePermission('site_surveys', 'view'), SiteSurveyController.getById);
router.post('/', requirePermission('site_surveys', 'create'), SiteSurveyController.create);
router.put('/:id', requirePermission('site_surveys', 'update'), SiteSurveyController.update);
router.delete('/:id', requirePermission('site_surveys', 'delete'), SiteSurveyController.delete);
router.get('/:id/pdf', requirePermission('site_surveys', 'view'), SiteSurveyController.downloadPDF);

export default router;
