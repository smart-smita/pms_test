import { Router } from 'express';
import { TermsTemplateController } from '../controllers/termsTemplate.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('terms_templates', 'view'), TermsTemplateController.getAll);
router.get('/:id', requirePermission('terms_templates', 'view'), TermsTemplateController.getById);
router.post('/', requirePermission('terms_templates', 'manage'), TermsTemplateController.create);
router.put('/:id', requirePermission('terms_templates', 'manage'), TermsTemplateController.update);
router.delete('/:id', requirePermission('terms_templates', 'manage'), TermsTemplateController.delete);

export default router;
