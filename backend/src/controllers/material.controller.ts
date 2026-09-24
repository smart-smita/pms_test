import { Request, Response } from 'express';
import { MaterialService } from '../services/material.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class MaterialController {
  private service = new MaterialService();

  getAll = async (req: Request, res: Response) => {
    try {
      const data = await this.service.getMaterials();
      return sendSuccess(res, 'Materials retrieved', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 500);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const data = await this.service.createMaterial(req.body);
      return sendSuccess(res, 'Material created', data, 201);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const data = await this.service.updateMaterial(Number(req.params.id), req.body);
      return sendSuccess(res, 'Material updated', data);
    } catch (e: any) {
      return sendError(res, e.message, [], 400);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.service.deleteMaterial(Number(req.params.id));
      res.json({ success: true, message: 'Material deleted' });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  };
}
