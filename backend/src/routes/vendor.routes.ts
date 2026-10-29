import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const ctrl = new VendorController();

router.use(authenticateJwt);

router.get('/', requirePermission('vendors', 'view'), ctrl.getAll);
router.get('/:id', requirePermission('vendors', 'view'), ctrl.getById);
router.post('/', requirePermission('vendors', 'create'), ctrl.create);
router.put('/:id', requirePermission('vendors', 'update'), ctrl.update);
router.delete('/:id', requirePermission('vendors', 'delete'), ctrl.delete);

export default router;
