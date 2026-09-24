import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', DocumentController.getDocumentsByEntity);
router.get('/expiring', DocumentController.getExpiringDocuments);
router.get('/:id', DocumentController.getDocumentById);
router.post('/', DocumentController.uploadDocument);
router.post('/trigger-expiry-job', DocumentController.triggerExpiryJob);
router.delete('/:id', DocumentController.deleteDocument);

export default router;
