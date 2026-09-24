import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateJwt } from '../middleware/auth';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();
const controller = new ReportController();

router.use(authenticateJwt);
router.use(requirePermission('reports', 'view'));

// Employee Reports
router.get('/employee-details', controller.getEmployeeDetailsReport);
router.get('/discipline-details', controller.getDisciplineDetailsReport);
router.get('/employee-attendance-1', controller.getEmployeeAttendanceReport1);
router.get('/employee-attendance-2', controller.getEmployeeAttendanceReport2);
router.get('/employee-attendance-daywise-2', controller.getEmployeeAttendanceDayWiseReport2);
router.get('/employee-attendance-summary-matrix', controller.getEmployeeAttendanceSummaryMatrix);
router.get('/employee-attendance-3', controller.getEmployeeAttendanceReport3);

// Labour Reports
router.get('/labour-details', controller.getLabourDetailsReport);
router.get('/labour-attendance-1', controller.getLabourAttendanceReport1);
router.get('/labour-attendance-2', controller.getLabourAttendanceReport2);
router.get('/labour-attendance-3', controller.getLabourAttendanceReport3);
router.get('/labour-cost-payment', controller.getLabourCostPaymentReport);

// Project Work & Financial Reports
router.get('/project-work', controller.getProjectWorkReport);
router.get('/project-budget', controller.getProjectBudgetReport);
router.get('/project-summary', controller.getProjectSummaryReport);
router.get('/project-profit-loss', controller.getProjectProfitLossReport);
router.get('/planned-vs-actual', controller.getPlannedVsActualReport);

export default router;
