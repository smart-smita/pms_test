import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const controller = new EmployeeController();

router.use(authenticateJwt);

router.get('/', requirePermission('employees', 'view'), controller.getAll);
router.get('/:id', requirePermission('employees', 'view'), controller.getById);
router.post('/', requirePermission('employees', 'create'), controller.create);
router.put('/:id', requirePermission('employees', 'update'), controller.update);
router.delete('/:id', requirePermission('employees', 'delete'), controller.delete);

export default router;
