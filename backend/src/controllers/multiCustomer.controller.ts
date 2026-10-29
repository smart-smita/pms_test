import { Request, Response } from 'express';
import { ProjectCustomerRepository } from '../repositories/projectCustomer.repository';

const repo = new ProjectCustomerRepository();

export class MultiCustomerController {
  async getProjectCustomers(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      if (isNaN(projectId)) return res.status(400).json({ success: false, message: 'Invalid projectId' });
      const customers = await repo.getByProjectId(projectId);
      res.json({ success: true, data: customers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async addCustomerToProject(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const {
        customer_id, unit_number, allocated_area_sqft,
        ownership_percentage, split_rule, agreement_value, is_primary_billing_contact
      } = req.body;

      if (!customer_id) return res.status(400).json({ success: false, message: 'customer_id is required' });

      const insertId = await repo.create({
        project_id: projectId,
        customer_id: Number(customer_id),
        unit_number,
        allocated_area_sqft: allocated_area_sqft ? Number(allocated_area_sqft) : 0,
        ownership_percentage: ownership_percentage !== undefined ? Number(ownership_percentage) : 100,
        split_rule,
        agreement_value: agreement_value ? Number(agreement_value) : 0,
        is_primary_billing_contact
      });

      const created = await repo.getById(insertId);
      res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateCustomerAllocation(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await repo.update(id, req.body);
      if (!success) return res.status(404).json({ success: false, message: 'Allocation not found or unchanged' });
      const updated = await repo.getById(id);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async addCoApplicant(req: Request, res: Response) {
    try {
      const projectCustomerId = parseInt(req.params.id, 10);
      const { co_applicant_name, pan_number, aadhar_number, contact_number, email, relationship } = req.body;
      if (!co_applicant_name) return res.status(400).json({ success: false, message: 'co_applicant_name is required' });

      const insertId = await repo.addCoApplicant({
        project_customer_id: projectCustomerId,
        co_applicant_name,
        pan_number,
        aadhar_number,
        contact_number,
        email,
        relationship
      });

      const updated = await repo.getById(projectCustomerId);
      res.status(201).json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteCoApplicant(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.coApplicantId, 10);
      const success = await repo.deleteCoApplicant(id);
      res.json({ success, message: success ? 'Co-applicant deleted' : 'Not found' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async calculateSharedWbsCost(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const wbsCost = parseFloat(req.query.wbs_cost as string || '0');
      const splitRule = req.query.split_rule as any;

      const { CustomerAllocationService } = await import('../services/customerAllocation.service');
      const service = new CustomerAllocationService();
      const result = await service.calculateSharedWbsCost(projectId, wbsCost, splitRule);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async transferCustomerAllotment(req: Request, res: Response) {
    try {
      const projectCustomerId = parseInt(req.params.id, 10);
      const { new_customer_id, transfer_reason } = req.body;
      if (!new_customer_id || !transfer_reason?.trim()) {
        return res.status(400).json({ success: false, message: 'new_customer_id and transfer_reason are required' });
      }

      const userId = (req as any).user?.employee_id || 1;
      const ip = req.ip || '127.0.0.1';

      const { CustomerAllocationService } = await import('../services/customerAllocation.service');
      const service = new CustomerAllocationService();
      const result = await service.transferCustomerAllotment({
        project_customer_id: projectCustomerId,
        new_customer_id: Number(new_customer_id),
        transfer_reason: transfer_reason.trim(),
        user_id: userId,
        ip_address: ip
      });

      res.status(200).json({ success: true, message: 'Allotment transferred successfully', data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async removeCustomerAllotment(req: Request, res: Response) {
    try {
      const projectCustomerId = parseInt(req.params.id, 10);
      const userId = (req as any).user?.employee_id || 1;
      const ip = req.ip || '127.0.0.1';

      const { CustomerAllocationService } = await import('../services/customerAllocation.service');
      const service = new CustomerAllocationService();
      const result = await service.removeCustomerAllotment(projectCustomerId, userId, ip);

      res.json({ success: true, message: 'Allotment removed successfully', data: result });
    } catch (err: any) {
      // Return 409 Conflict if blocked by invoice audit integrity
      const status = err.message.includes('historical invoice') ? 409 : 500;
      res.status(status).json({ success: false, message: err.message });
    }
  }
}
