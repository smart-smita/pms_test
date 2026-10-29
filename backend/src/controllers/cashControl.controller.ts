import { Request, Response } from 'express';
import { CashControlService } from '../services/cashControl.service';

const cashService = new CashControlService();

export class CashControlController {
  async getProjectCashPosition(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      if (isNaN(projectId)) return res.status(400).json({ success: false, message: 'Invalid projectId' });

      const position = await cashService.getProjectCashPosition(projectId);
      res.json({ success: true, data: position });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async checkDisbursement(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const { amount, transaction_type, transaction_ref_id, override_reason, allow_deficit_buffer } = req.body;

      if (!amount || !transaction_type || !transaction_ref_id) {
        return res.status(400).json({
          success: false,
          message: 'amount, transaction_type, and transaction_ref_id are required'
        });
      }

      const userId = (req as any).user?.employee_id || 1;

      const check = await cashService.checkDisbursementAllowed({
        project_id: projectId,
        amount: Number(amount),
        transaction_type,
        transaction_ref_id: Number(transaction_ref_id),
        user_id: userId,
        override_reason,
        allow_deficit_buffer: allow_deficit_buffer ? Number(allow_deficit_buffer) : 0
      });

      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          blocked: true,
          message: check.message,
          deficit: check.deficit
        });
      }

      res.json({
        success: true,
        allowed: true,
        override_logged: check.override_logged || false
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
