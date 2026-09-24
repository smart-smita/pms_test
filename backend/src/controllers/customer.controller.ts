import { Response } from 'express';
import { CustomerService } from '../services/customer.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export class CustomerController {
  private svc = new CustomerService();

  getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { search, status } = req.query;
      const data = await this.svc.getCustomers({
        search: search as string,
        status: status as string,
      });
      return sendSuccess(res, 'Customers retrieved successfully', data);
    } catch (e: any) {
      return sendError(res, e.message || 'Failed to retrieve customers', [], 500);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await this.svc.getCustomerById(id);
      return sendSuccess(res, 'Customer retrieved successfully', data);
    } catch (e: any) {
      return sendError(res, e.message || 'Customer not found', [], 404);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.employee_id;
      const ip = req.ip || req.socket?.remoteAddress;
      const customer = await this.svc.createCustomer(req.body, userId, ip);
      return sendSuccess(res, 'Customer created successfully', customer, 201);
    } catch (e: any) {
      return sendError(res, e.message || 'Failed to create customer', [], 400);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user?.employee_id;
      const ip = req.ip || req.socket?.remoteAddress;
      const customer = await this.svc.updateCustomer(id, req.body, userId, ip);
      return sendSuccess(res, 'Customer updated successfully', customer);
    } catch (e: any) {
      return sendError(res, e.message || 'Failed to update customer', [], 400);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user?.employee_id;
      const ip = req.ip || req.socket?.remoteAddress;
      await this.svc.deleteCustomer(id, userId, ip);
      return sendSuccess(res, 'Customer deleted successfully');
    } catch (e: any) {
      return sendError(res, e.message || 'Failed to delete customer', [], 400);
    }
  };
}
