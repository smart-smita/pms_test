import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
const controller = new NotificationController();

router.use(authenticateJwt);

router.get('/', controller.getAll);
router.get('/unread-count', controller.getUnreadCount);
router.put('/mark-all-read', controller.markAllAsRead);
router.put('/:id/read', controller.markAsRead);

export default router;
