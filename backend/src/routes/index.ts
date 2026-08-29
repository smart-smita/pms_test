import { Router } from 'express';
import authRoutes from './auth.routes';
import employeeRoutes from './employee.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import attendanceRoutes from './attendance.routes';
import paymentRoutes from './payment.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

export default router;
