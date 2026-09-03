import { Router } from 'express';
import { LabourController } from '../controllers/labour.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const controller = new LabourController();

router.use(authenticateJwt);

router.get('/attendance', requirePermission('labours', 'view'), controller.getAttendance);
router.post('/attendance', requirePermission('labours', 'create'), controller.createAttendance);
router.put('/attendance/:id', requirePermission('labours', 'update'), controller.updateAttendance);
router.delete('/attendance/:id', requirePermission('labours', 'delete'), controller.deleteAttendance);

router.get('/', requirePermission('labours', 'view'), controller.getAll);
router.get('/:id/dependencies', requirePermission('labours', 'view'), controller.getDependencies);
router.get('/:id', requirePermission('labours', 'view'), controller.getById);
router.post('/', requirePermission('labours', 'create'), controller.create);
router.put('/:id', requirePermission('labours', 'update'), controller.update);
router.delete('/:id', requirePermission('labours', 'delete'), controller.delete);

export default router;
