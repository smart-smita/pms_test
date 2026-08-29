import { NotificationRepository } from '../repositories/notification.repository';

export class NotificationService {
  private repo = new NotificationRepository();

  async getNotifications(userId: number) {
    return await this.repo.findByUserId(userId);
  }

  async getUnreadCount(userId: number) {
    return await this.repo.getUnreadCount(userId);
  }

  async createNotification(userId: number, title: string, message: string, type: string = 'info') {
    return await this.repo.create({ user_id: userId, title, message, type });
  }

  async markAsRead(id: number, userId: number) {
    return await this.repo.markAsRead(id, userId);
  }

  async markAllAsRead(userId: number) {
    return await this.repo.markAllAsRead(userId);
  }
}
