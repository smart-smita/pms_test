import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { dbPool } from '../config/db';

export class NotificationRepository {
  async findByUserId(userId: number): Promise<any[]> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return rows;
  }

  async getUnreadCount(userId: number): Promise<number> {
    const [rows] = await dbPool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return rows[0].count;
  }

  async create(data: { user_id: number; title: string; message: string; type?: string }): Promise<number> {
    const [result] = await dbPool.execute<ResultSetHeader>(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [data.user_id, data.title, data.message, data.type || 'info']
    );
    return result.insertId;
  }

  async markAsRead(id: number, userId: number): Promise<void> {
    await dbPool.execute(`UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?`, [id, userId]);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await dbPool.execute(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [userId]);
  }
}
