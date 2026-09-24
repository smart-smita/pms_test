import { Router } from 'express';
import authRoutes from './auth.routes';
import employeeRoutes from './employee.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import attendanceRoutes from './attendance.routes';
import paymentRoutes from './payment.routes';
import dashboardRoutes from './dashboard.routes';
import reportRoutes from './report.routes';
import notificationRoutes from './notification.routes';
import wbsRoutes from './wbs.routes';
import labourRoutes from './labour.routes';
import labourWorkLogRoutes from './labourWorkLog.routes';
import labourPaymentRoutes from './labourPayment.routes';
import timesheetRoutes from './timesheet.routes';
import masterRoutes from './master.routes';
import customerRoutes from './customer.routes';
import invoiceRoutes from './invoice.routes';
import documentRoutes from './document.routes';
import quotationRoutes from './quotation.routes';
import termsTemplateRoutes from './termsTemplate.routes';
import siteSurveyRoutes from './siteSurvey.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/wbs', wbsRoutes);
router.use('/labours', labourRoutes);
router.use('/labour-work-logs', labourWorkLogRoutes);
router.use('/labour-payments', labourPaymentRoutes);
router.use('/timesheets', timesheetRoutes);
router.use('/masters', masterRoutes);
router.use('/customers', customerRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/documents', documentRoutes);
router.use('/quotations', quotationRoutes);
router.use('/terms-templates', termsTemplateRoutes);
router.use('/site-surveys', siteSurveyRoutes);

export default router;

