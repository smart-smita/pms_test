import { Router } from 'express';
import { MasterController } from '../controllers/master.controller';
import { VendorController } from '../controllers/vendor.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const ctrl = new MasterController();
const vendorCtrl = new VendorController();

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
router.put('/communities/:id', requirePermission('masters', 'view'), ctrl.updateCommunity);

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

// Calendars
router.get('/calendars', ctrl.getCalendars);
router.post('/calendars', requirePermission('masters', 'manage'), ctrl.createCalendar);
router.put('/calendars/:id', requirePermission('masters', 'manage'), ctrl.updateCalendar);

// Holidays
router.get('/holidays', ctrl.getHolidays);
router.post('/holidays', requirePermission('masters', 'manage'), ctrl.createHoliday);
router.delete('/holidays/:id', requirePermission('masters', 'manage'), ctrl.deleteHoliday);

// Number Series
router.get('/number-series', requirePermission('number_series', 'view'), ctrl.getNumberSeries);
router.put('/number-series/:id', requirePermission('number_series', 'manage'), ctrl.updateNumberSeries);
router.get('/number-series/next/:seriesCode', requirePermission('number_series', 'view'), ctrl.getNextNumber);

// Measurement Units
router.get('/units', ctrl.getUnits);
router.post('/units', requirePermission('units', 'manage'), ctrl.createUnit);
router.put('/units/:id', requirePermission('units', 'manage'), ctrl.updateUnit);

// Contractors & Vendors
router.get('/contractors', requirePermission('contractors', 'view'), ctrl.getContractors);
router.post('/contractors', requirePermission('contractors', 'create'), ctrl.createContractor);
router.get('/vendors', (req, res) => vendorCtrl.getAll(req, res));

export default router;
