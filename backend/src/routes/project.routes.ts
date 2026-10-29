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
router.post('/wbs', requirePermission('projects', 'create'), wbsController.addProjectWbs);
router.post('/:projectId/wbs', requirePermission('projects', 'create'), wbsController.addProjectWbs);

// Multi-Entity Customers & Co-Applicants
import { MultiCustomerController } from '../controllers/multiCustomer.controller';
import { CustomerBillingController } from '../controllers/customerBilling.controller';

const multiCustCtrl = new MultiCustomerController();
const billingCtrl = new CustomerBillingController();

router.get('/:projectId/customers', requirePermission('projects', 'view'), multiCustCtrl.getProjectCustomers);
router.post('/:projectId/customers', requirePermission('projects', 'update'), multiCustCtrl.addCustomerToProject);
router.put('/customers/:id', requirePermission('projects', 'update'), multiCustCtrl.updateCustomerAllocation);
router.post('/customers/:id/co-applicants', requirePermission('projects', 'update'), multiCustCtrl.addCoApplicant);
router.delete('/customers/co-applicants/:coApplicantId', requirePermission('projects', 'update'), multiCustCtrl.deleteCoApplicant);
router.get('/:projectId/shared-wbs-cost', requirePermission('projects', 'view'), multiCustCtrl.calculateSharedWbsCost);
router.post('/customer-allotments/:id/transfer', requirePermission('projects', 'update'), multiCustCtrl.transferCustomerAllotment);
router.delete('/customer-allotments/:id', requirePermission('projects', 'update'), multiCustCtrl.removeCustomerAllotment);

// Customer Milestone Schedules
router.get('/:projectId/customer-schedules', requirePermission('invoices', 'view'), billingCtrl.getSchedulesByProject);
router.get('/customer-allotments/:projectCustomerId/schedules', requirePermission('invoices', 'view'), billingCtrl.getSchedulesByProjectCustomer);
router.post('/customer-allotments/:projectCustomerId/generate-milestones', requirePermission('invoices', 'create'), billingCtrl.generateDefaultMilestones);

export default router;
