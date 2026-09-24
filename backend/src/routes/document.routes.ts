import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', DocumentController.getDocumentsByEntity);
router.get('/expiring', DocumentController.getExpiringDocuments);
router.get('/expiry-management', DocumentController.getExpiryManagementList);
router.get('/expiry-summary', DocumentController.getExpiryDashboardCounts);
router.get('/notification-history', DocumentController.getNotificationHistory);
router.post('/trigger-expiry-job', DocumentController.triggerExpiryJob);
router.post('/:id/renew', DocumentController.renewDocument);
router.get('/:id', DocumentController.getDocumentById);
router.post('/', DocumentController.uploadDocument);
router.delete('/:id', DocumentController.deleteDocument);

export default router;
