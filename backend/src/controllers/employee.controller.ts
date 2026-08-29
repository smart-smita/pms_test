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

      if (user) {
        if (user.role_name === 'Manager') {
          managerId = user.id;
        }
        if (user.role_name === 'Employee') {
          employeeId = user.id;
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
      return sendError(res, error.message || 'Failed to fetch employees', [], 500);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
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
      const newEmployee = await this.employeeService.createEmployee(parseResult.data);
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
}
