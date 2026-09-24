import { Router } from 'express';
import { MaterialController } from '../controllers/material.controller';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
const controller = new MaterialController();

router.use(authenticateJwt);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
