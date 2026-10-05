import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
const controller = new DashboardController();

router.use(authenticateJwt);

router.get('/metrics', controller.getMetrics);

export default router;
