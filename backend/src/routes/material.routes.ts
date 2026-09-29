import { Router } from 'express';
import { MaterialController } from '../controllers/material.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const ctrl = new MaterialController();

router.use(authenticateJwt);

// Master Materials
router.get('/master', requirePermission('materials', 'view'), ctrl.getMaterials);
router.get('/master/:id', requirePermission('materials', 'view'), ctrl.getMaterialById);
router.post('/master', requirePermission('materials', 'create'), ctrl.createMaterial);
router.put('/master/:id', requirePermission('materials', 'update'), ctrl.updateMaterial);
router.delete('/master/:id', requirePermission('materials', 'delete'), ctrl.deleteMaterial);

// Material Quotations (budget planning per project+WBS)
router.get('/quotations', requirePermission('materials', 'view'), ctrl.getQuotations);
router.get('/quotations/:id', requirePermission('materials', 'view'), ctrl.getQuotationById);
router.post('/quotations', requirePermission('materials', 'create'), ctrl.createQuotation);
router.patch('/quotations/:id/status', requirePermission('materials', 'approve'), ctrl.updateQuotationStatus);

// Monthly Material Surveys
router.get('/surveys', requirePermission('materials', 'view'), ctrl.getSurveys);
router.get('/surveys/:id', requirePermission('materials', 'view'), ctrl.getSurveyById);
router.post('/surveys', requirePermission('materials', 'create'), ctrl.createSurvey);
router.patch('/surveys/:id/status', requirePermission('materials', 'approve'), ctrl.updateSurveyStatus);

// Reports
router.get('/reports/project-material', requirePermission('materials', 'view'), ctrl.getProjectMaterialReport);
router.get('/reports/cost-summary/:projectId', requirePermission('materials', 'view'), ctrl.getProjectCostSummary);

export default router;
