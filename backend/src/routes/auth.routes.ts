import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { loginRateLimiter } from '../middleware/rateLimiter';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
const controller = new AuthController();

router.post('/login', loginRateLimiter, controller.login);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.post('/logout', authenticateJwt, controller.logout);
router.put('/profile', authenticateJwt, controller.updateProfile);
router.put('/password', authenticateJwt, controller.updatePassword);
router.post('/support', authenticateJwt, controller.submitSupportTicket);

export default router;
