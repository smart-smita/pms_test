import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';
import { createEmployeeSchema, updateEmployeeSchema } from '../validators/employee.validator';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class EmployeeController {
  private employeeService = new EmployeeService();

  getAll = async (req: Request, res: Response) => {
    try {
      const { status, role_id, search } = req.query;
      const roleId = role_id ? parseInt(role_id as string, 10) : undefined;
      const user = (req as any).user;
      let managerId = undefined;
      let employeeId = undefined;
      const userId = user?.employee_id || user?.userId || user?.id;

      if (user) {
        if (user.role_name === 'Manager') {
          managerId = userId;
        }
        if (user.role_name === 'Employee') {
          employeeId = userId;
        }
      }

      const employees = await this.employeeService.getEmployees(
        status as string,
        roleId,
        search as string,
        managerId,
        employeeId
      );
      return sendSuccess(res, 'Employees retrieved successfully', employees);
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Server error', error: (error as Error).message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = (req as any).user;
      let managerId = undefined;
      let employeeId = undefined;
      const userId = user?.employee_id || user?.userId || user?.id;

      if (user) {
        if (user.role_name === 'Manager') {
          managerId = userId;
        }
        if (user.role_name === 'Employee') {
          employeeId = userId;
        }
      }

      // Check access via findAll
      const allAllowed = await this.employeeService.getEmployees(undefined, undefined, undefined, managerId, employeeId);
      const isAllowed = allAllowed.find(e => e.employee_id === id);

      if (!isAllowed) {
        return sendError(res, 'Employee not found or access denied', [], 403);
      }

      const employee = await this.employeeService.getEmployeeById(id);
      return sendSuccess(res, 'Employee retrieved successfully', employee);
    } catch (error: any) {
      return sendError(res, error.message || 'Employee not found', [], 404);
    }
  };

  create = async (req: Request, res: Response) => {
    const parseResult = createEmployeeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const uploadedBy = (req as any).user?.employee_id;
      const ipAddress = req.ip;
      const newEmployee = await this.employeeService.createEmployee(parseResult.data, uploadedBy, ipAddress);
      return sendSuccess(res, 'Employee created successfully', newEmployee, 201);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create employee', [], 400);
    }
  };

  update = async (req: Request, res: Response) => {
    const parseResult = updateEmployeeSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(res, 'Validation failed', parseResult.error.errors, 400);
    }

    try {
      const id = parseInt(req.params.id, 10);
      const updated = await this.employeeService.updateEmployee(id, parseResult.data);
      return sendSuccess(res, 'Employee updated successfully', updated);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to update employee', [], 400);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deletedBy = (req as any).user.id;
      const success = await this.employeeService.deleteEmployee(id, deletedBy);
      if (success) {
        res.json({ success: true, message: 'Employee deleted successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Employee not found' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  };

  getDetails = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = (req as any).user;
      let managerId = undefined;
      let employeeId = undefined;
      const userId = user?.employee_id || user?.userId || user?.id;

      if (user) {
        if (user.role_name === 'Manager') managerId = userId;
        if (user.role_name === 'Employee') employeeId = userId;
      }

      const allAllowed = await this.employeeService.getEmployees(undefined, undefined, undefined, managerId, employeeId);
      const isAllowed = allAllowed.find(e => e.employee_id === id);

      if (!isAllowed && user?.role_name !== 'Admin' && user?.role_name !== 'Super Admin') {
        return sendError(res, 'Employee not found or access denied', [], 403);
      }

      const details = await this.employeeService.getEmployeeDetails(id);
      return sendSuccess(res, 'Employee details retrieved successfully', details);
    } catch (error: any) {
      return sendError(res, error.message || 'Employee details not found', [], 404);
    }
  };
}
