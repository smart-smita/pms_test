import { Router } from 'express';
import { PlanningController } from '../controllers/planning.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('projects', 'view'), PlanningController.getAll);
router.get('/:id', requirePermission('projects', 'view'), PlanningController.getById);

router.post('/from-quotation/:quotationId', requirePermission('projects', 'create'), PlanningController.createFromQuotation);
router.post('/:id/save-draft', requirePermission('projects', 'update'), PlanningController.saveDraft);
router.put('/:id', requirePermission('projects', 'update'), PlanningController.saveDraft);
router.post('/:id/validate', requirePermission('projects', 'view'), PlanningController.validate);
router.post('/:id/submit', requirePermission('projects', 'update'), PlanningController.submit);
router.post('/:id/approve', requirePermission('projects', 'create'), PlanningController.approve);
router.post('/:id/reject', requirePermission('projects', 'create'), PlanningController.reject);
router.post('/:id/calculate', requirePermission('projects', 'update'), PlanningController.calculate);
router.post('/:id/apply-quotation-changes', requirePermission('projects', 'update'), PlanningController.applyQuotationChanges);

export default router;
