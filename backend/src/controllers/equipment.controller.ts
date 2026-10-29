import { Request, Response } from 'express';
import { EquipmentRepository } from '../repositories/equipment.repository';

const repo = new EquipmentRepository();

export class EquipmentController {
  async getAll(req: Request, res: Response) {
    try {
      const { ownership_type, status, search } = req.query;
      const list = await repo.getAll({
        ownership_type: ownership_type as string,
        status: status as string,
        search: search as string
      });
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const item = await repo.getById(id);
      if (!item) return res.status(404).json({ success: false, message: 'Equipment not found' });
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { equipment_code, equipment_name, ownership_type, vendor_id, internal_hourly_rate, rental_rate_unit, rental_rate, status } = req.body;
      if (!equipment_code || !equipment_name || !ownership_type) {
        return res.status(400).json({ success: false, message: 'equipment_code, equipment_name, ownership_type are required' });
      }

      const created = await repo.create({
        equipment_code,
        equipment_name,
        ownership_type,
        vendor_id: vendor_id ? Number(vendor_id) : null,
        internal_hourly_rate: internal_hourly_rate ? Number(internal_hourly_rate) : 0,
        rental_rate_unit,
        rental_rate: rental_rate ? Number(rental_rate) : 0,
        status
      });
      res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await repo.update(id, req.body);
      if (!success) return res.status(404).json({ success: false, message: 'Equipment not found or no changes made' });
      const updated = await repo.getById(id);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async logUsage(req: Request, res: Response) {
    try {
      const {
        equipment_id, project_id, project_wbs_id, task_id,
        log_date, start_meter_hours, end_meter_hours,
        fuel_litres_consumed, charged_rate, remarks
      } = req.body;

      if (!equipment_id || !project_id || !project_wbs_id || !log_date || start_meter_hours === undefined || end_meter_hours === undefined) {
        return res.status(400).json({
          success: false,
          message: 'equipment_id, project_id, project_wbs_id, log_date, start_meter_hours, end_meter_hours are required'
        });
      }

      const userId = (req as any).user?.employee_id || null;

      const logged = await repo.logUsage({
        equipment_id: Number(equipment_id),
        project_id: Number(project_id),
        project_wbs_id: Number(project_wbs_id),
        task_id: task_id ? Number(task_id) : null,
        log_date,
        start_meter_hours: Number(start_meter_hours),
        end_meter_hours: Number(end_meter_hours),
        fuel_litres_consumed: fuel_litres_consumed ? Number(fuel_litres_consumed) : 0,
        charged_rate: charged_rate ? Number(charged_rate) : undefined,
        verified_by: userId,
        remarks
      });

      res.status(201).json({ success: true, data: logged });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getUsageLogsByProject(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const logs = await repo.getUsageLogsByProject(projectId);
      res.json({ success: true, data: logs });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
