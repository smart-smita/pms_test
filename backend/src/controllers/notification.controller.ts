import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class NotificationController {
  private service = new NotificationService();

  getAll = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.employee_id || (req as any).user.userId || (req as any).user.id;
      const data = await this.service.getNotifications(userId);
      return sendSuccess(res, 'Notifications fetched successfully', data);
    } catch (error: any) {
      return sendError(res, 'Failed to fetch notifications', [], 500);
    }
  };

  getUnreadCount = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.employee_id || (req as any).user.userId || (req as any).user.id;
      const count = await this.service.getUnreadCount(userId);
      return sendSuccess(res, 'Unread count fetched', { count });
    } catch (error: any) {
      return sendError(res, 'Failed to fetch unread count', [], 500);
    }
  };

  markAsRead = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.employee_id || (req as any).user.userId || (req as any).user.id;
      const id = parseInt(req.params.id, 10);
      await this.service.markAsRead(id, userId);
      return sendSuccess(res, 'Marked as read');
    } catch (error: any) {
      return sendError(res, 'Failed to mark as read', [], 500);
    }
  };

  markAllAsRead = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.employee_id || (req as any).user.userId || (req as any).user.id;
      await this.service.markAllAsRead(userId);
      return sendSuccess(res, 'Marked all as read');
    } catch (error: any) {
      return sendError(res, 'Failed to mark all as read', [], 500);
    }
  };
}
