import { Router } from 'express';
import { WbsController } from '../controllers/wbs.controller';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
const wbsController = new WbsController();

router.use(authenticateJwt);

router.get('/', wbsController.getMasterList);

export default router;
