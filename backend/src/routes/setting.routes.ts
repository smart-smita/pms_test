import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller';
import { authenticateJwt } from '../middleware/auth';
import { requireAdmin } from '../middleware/workCategory.middleware';

const router = Router();
const ctrl = new SettingController();

router.use(authenticateJwt);

// Any authenticated user can read active work category to configure their UI
router.get('/work-category', ctrl.getWorkCategory);

// Only Admin can check impact and update work category
router.get('/work-category/impact', requireAdmin(), ctrl.getWorkCategoryImpact);
router.put('/work-category', requireAdmin(), ctrl.updateWorkCategory);
router.post('/work-category', requireAdmin(), ctrl.updateWorkCategory);

export default router;
