import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const ctrl = new CustomerController();

router.use(authenticateJwt);

router.get('/', requirePermission('customers', 'view'), ctrl.getAll);
router.get('/:id', requirePermission('customers', 'view'), ctrl.getById);
router.post('/', requirePermission('customers', 'create'), ctrl.create);
router.put('/:id', requirePermission('customers', 'update'), ctrl.update);
router.delete('/:id', requirePermission('customers', 'delete'), ctrl.delete);

export default router;
