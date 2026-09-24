import { Router } from 'express';
import { MasterController } from '../controllers/master.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const ctrl = new MasterController();

// All master routes require JWT authentication
router.use(authenticateJwt);

// Read endpoints
router.get('/countries', ctrl.getCountries);
router.get('/nationalities', ctrl.getNationalities);
router.get('/communities', ctrl.getCommunities);
router.get('/project-types', ctrl.getProjectTypes);
router.get('/document-types', ctrl.getDocumentTypes);
router.get('/disciplines', ctrl.getDisciplines);
router.get('/currencies', ctrl.getCurrencies);
router.get('/taxes', ctrl.getTaxes);

// Write / Manage endpoints (Requires master / project_types / document_types / disciplines permission)
router.post('/communities', requirePermission('masters', 'view'), ctrl.createCommunity);

router.post('/project-types', requirePermission('project_types', 'manage'), ctrl.createProjectType);
router.put('/project-types/:id', requirePermission('project_types', 'manage'), ctrl.updateProjectType);

router.post('/document-types', requirePermission('document_types', 'manage'), ctrl.createDocumentType);
router.put('/document-types/:id', requirePermission('document_types', 'manage'), ctrl.updateDocumentType);

router.post('/disciplines', requirePermission('disciplines', 'manage'), ctrl.createDiscipline);
router.put('/disciplines/:id', requirePermission('disciplines', 'manage'), ctrl.updateDiscipline);

router.post('/currencies', requirePermission('currencies', 'manage'), ctrl.createCurrency);
router.put('/currencies/:id', requirePermission('currencies', 'manage'), ctrl.updateCurrency);

router.post('/taxes', requirePermission('taxes', 'manage'), ctrl.createTax);
router.put('/taxes/:id', requirePermission('taxes', 'manage'), ctrl.updateTax);

export default router;
