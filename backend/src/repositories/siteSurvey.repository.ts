import { dbPool } from '../config/db';
import { AuditService } from '../services/audit.service';
import fs from 'fs';
import path from 'path';

export interface CreateSiteSurveyDTO {
  survey_code?: string;
  project_id: number;
  customer_id?: number | null;
  discipline_id?: number | null;
  survey_date: string;
  conducted_by: number;
  entry_type?: 'system_entry' | 'report_attachment';
  location_details?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  comments?: string | null;
  remarks?: string | null;
  attached_report_path?: string | null;
  status?: 'draft' | 'completed' | 'verified' | 'rejected';
  created_by?: number | null;
}

export interface SiteSurveyPhotoDTO {
  photo_name?: string;
  file_path?: string;
  file_base64?: string;
  caption?: string;
  discipline_ids?: number[];
}

export class SiteSurveyRepository {
  static async getAll(filters: { project_id?: number; customer_id?: number; discipline_id?: number; status?: string } = {}) {
    let sql = `
      SELECT 
        ss.*,
        p.project_name,
        p.project_code,
        c.customer_name,
        d.discipline_name,
        d.discipline_code,
        e.name AS conducted_by_name,
        (SELECT COUNT(*) FROM site_survey_photos ssp WHERE ssp.survey_id = ss.survey_id) AS photo_count
      FROM site_surveys ss
      JOIN projects p ON ss.project_id = p.project_id
      LEFT JOIN customers c ON ss.customer_id = c.customer_id
      LEFT JOIN disciplines d ON ss.discipline_id = d.discipline_id
      JOIN employees e ON ss.conducted_by = e.employee_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.project_id) {
      sql += ` AND ss.project_id = ?`;
      params.push(filters.project_id);
    }
    if (filters.customer_id) {
      sql += ` AND ss.customer_id = ?`;
      params.push(filters.customer_id);
    }
    if (filters.discipline_id) {
      sql += ` AND ss.discipline_id = ?`;
      params.push(filters.discipline_id);
    }
    if (filters.status) {
      sql += ` AND ss.status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY ss.survey_date DESC, ss.survey_id DESC`;
    const [rows]: any = await dbPool.query(sql, params);
    return rows;
  }

  static async getById(id: number) {
    const [rows]: any = await dbPool.query(
      `
      SELECT 
        ss.*,
        p.project_name,
        p.project_code,
        p.project_address,
        c.customer_name,
        c.customer_code,
        d.discipline_name,
        d.discipline_code,
        e.name AS conducted_by_name,
        e.email AS conducted_by_email
      FROM site_surveys ss
      JOIN projects p ON ss.project_id = p.project_id
      LEFT JOIN customers c ON ss.customer_id = c.customer_id
      LEFT JOIN disciplines d ON ss.discipline_id = d.discipline_id
      JOIN employees e ON ss.conducted_by = e.employee_id
      WHERE ss.survey_id = ?
    `,
      [id]
    );

    if (rows.length === 0) return null;
    const survey = rows[0];

    // Fetch site photos with their mapped disciplines
    const [photos]: any = await dbPool.query(
      `
      SELECT ssp.*, 
        (
          SELECT JSON_ARRAYAGG(JSON_OBJECT('id', d.discipline_id, 'name', d.discipline_name))
          FROM site_survey_photo_disciplines spd
          JOIN disciplines d ON spd.discipline_id = d.discipline_id
          WHERE spd.photo_id = ssp.photo_id
        ) as disciplines
      FROM site_survey_photos ssp 
      WHERE ssp.survey_id = ? 
      ORDER BY ssp.photo_id ASC
      `,
      [id]
    );
    survey.photos = photos.map((p: any) => ({
      ...p,
      disciplines: p.disciplines ? JSON.parse(p.disciplines) : []
    }));

    return survey;
  }

  static async create(data: CreateSiteSurveyDTO, photos: SiteSurveyPhotoDTO[] = [], userId?: number, ipAddress?: string) {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      let code = data.survey_code;
      if (!code) {
        const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
        const [seqRow]: any = await connection.query(`SELECT COUNT(*) as count FROM site_surveys`);
        const nextSeq = (seqRow[0].count + 1).toString().padStart(4, '0');
        code = `SRV-${dateStr}-${nextSeq}`;
      }

      const [result]: any = await connection.query(
        `
        INSERT INTO site_surveys (
          survey_code, project_id, customer_id, discipline_id, survey_date,
          conducted_by, entry_type, location_details, latitude, longitude,
          comments, remarks, attached_report_path, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          code,
          data.project_id,
          data.customer_id || null,
          data.discipline_id || null,
          data.survey_date,
          data.conducted_by,
          data.entry_type || 'system_entry',
          data.location_details || null,
          data.latitude || null,
          data.longitude || null,
          data.comments || null,
          data.remarks || null,
          data.attached_report_path || null,
          data.status || 'completed',
          userId || data.created_by || null,
        ]
      );

      const surveyId = result.insertId;

      // Handle photos upload if provided
      if (photos && photos.length > 0) {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'surveys');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        for (const p of photos) {
          let targetFilePath = p.file_path || '';
          if (p.file_base64) {
            const matches = p.file_base64.match(/^data:(.+);base64,(.+)$/);
            let buffer: Buffer;
            if (matches) {
              buffer = Buffer.from(matches[2], 'base64');
            } else {
              buffer = Buffer.from(p.file_base64, 'base64');
            }

            const uniqueName = `survey_${surveyId}_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
            const fullPath = path.join(uploadsDir, uniqueName);
            fs.writeFileSync(fullPath, buffer);
            targetFilePath = `/uploads/surveys/${uniqueName}`;
          }

          if (targetFilePath) {
            const [photoResult]: any = await connection.query(
              `INSERT INTO site_survey_photos (survey_id, photo_name, file_path, caption) VALUES (?, ?, ?, ?)`,
              [surveyId, p.photo_name || 'Site Photo', targetFilePath, p.caption || null]
            );
            const photoId = photoResult.insertId;

            if (p.discipline_ids && p.discipline_ids.length > 0) {
              const values = p.discipline_ids.map(dId => [photoId, dId]);
              await connection.query(
                `INSERT IGNORE INTO site_survey_photo_disciplines (photo_id, discipline_id) VALUES ?`,
                [values]
              );
            }
          }
        }
      }

      await connection.commit();

      await AuditService.log({
        user_id: userId,
        action: 'CREATE_SITE_SURVEY',
        module: 'site_surveys',
        description: `Recorded site survey ${code} for project #${data.project_id}`,
        record_id: surveyId,
        ip_address: ipAddress,
      });

      return this.getById(surveyId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async update(id: number, data: Partial<CreateSiteSurveyDTO>, photos?: SiteSurveyPhotoDTO[], userId?: number, ipAddress?: string) {
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `
        UPDATE site_surveys SET
          discipline_id = COALESCE(?, discipline_id),
          survey_date = COALESCE(?, survey_date),
          conducted_by = COALESCE(?, conducted_by),
          entry_type = COALESCE(?, entry_type),
          location_details = ?,
          comments = ?,
          remarks = ?,
          attached_report_path = COALESCE(?, attached_report_path),
          status = COALESCE(?, status)
        WHERE survey_id = ?
      `,
        [
          data.discipline_id !== undefined ? data.discipline_id : null,
          data.survey_date,
          data.conducted_by,
          data.entry_type,
          data.location_details !== undefined ? data.location_details : null,
          data.comments !== undefined ? data.comments : null,
          data.remarks !== undefined ? data.remarks : null,
          data.attached_report_path,
          data.status,
          id,
        ]
      );

      if (photos && photos.length > 0) {
        const uploadsDir = path.join(process.cwd(), 'uploads', 'surveys');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        for (const p of photos) {
          let targetFilePath = p.file_path || '';
          if (p.file_base64) {
            const matches = p.file_base64.match(/^data:(.+);base64,(.+)$/);
            let buffer: Buffer;
            if (matches) buffer = Buffer.from(matches[2], 'base64');
            else buffer = Buffer.from(p.file_base64, 'base64');

            const uniqueName = `survey_${id}_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
            fs.writeFileSync(path.join(uploadsDir, uniqueName), buffer);
            targetFilePath = `/uploads/surveys/${uniqueName}`;
          }

          if (targetFilePath) {
            const [photoResult]: any = await connection.query(
              `INSERT INTO site_survey_photos (survey_id, photo_name, file_path, caption) VALUES (?, ?, ?, ?)`,
              [id, p.photo_name || 'Site Photo', targetFilePath, p.caption || null]
            );
            const photoId = photoResult.insertId;

            if (p.discipline_ids && p.discipline_ids.length > 0) {
              const values = p.discipline_ids.map(dId => [photoId, dId]);
              await connection.query(
                `INSERT IGNORE INTO site_survey_photo_disciplines (photo_id, discipline_id) VALUES ?`,
                [values]
              );
            }
          }
        }
      }

      await connection.commit();

      await AuditService.log({
        user_id: userId,
        action: 'UPDATE_SITE_SURVEY',
        module: 'site_surveys',
        description: `Updated site survey ID ${id}`,
        record_id: id,
        ip_address: ipAddress,
      });

      return this.getById(id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async delete(id: number, userId?: number, ipAddress?: string) {
    await dbPool.query(`DELETE FROM site_surveys WHERE survey_id = ?`, [id]);

    await AuditService.log({
      user_id: userId,
      action: 'DELETE_SITE_SURVEY',
      module: 'site_surveys',
      description: `Deleted site survey ID ${id}`,
      record_id: id,
      ip_address: ipAddress,
    });

    return true;
  }
}
