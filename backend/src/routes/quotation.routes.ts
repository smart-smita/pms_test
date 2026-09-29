import { Router } from 'express';
import { QuotationController } from '../controllers/quotation.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', requirePermission('quotations', 'view'), QuotationController.getAll);
router.get('/:id', requirePermission('quotations', 'view'), QuotationController.getById);
router.get('/:id/pdf', requirePermission('quotations', 'view'), QuotationController.downloadPdf);
router.post('/', requirePermission('quotations', 'create'), QuotationController.create);
router.put('/:id', requirePermission('quotations', 'update'), QuotationController.update);
router.patch('/:id/status', requirePermission('quotations', 'approve'), QuotationController.updateStatus);
router.delete('/:id', requirePermission('quotations', 'delete'), QuotationController.delete);

// Quotation → Project gate: POST /quotations/:id/create-project
// Creates a project from an approved quotation. Requires projects:create permission.
router.post('/:id/create-project', requirePermission('projects', 'create'), QuotationController.createProjectFromQuotation);

export default router;
