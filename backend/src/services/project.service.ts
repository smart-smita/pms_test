import { ProjectRepository } from '../repositories/project.repository';
import { dbPool } from '../config/db';
import { WbsRepository } from '../repositories/wbs.repository';

export class ProjectService {
  private projectRepo = new ProjectRepository();
  private wbsRepo = new WbsRepository();

  async getProjects(status?: string, search?: string, managerId?: number, employeeId?: number) {
    return await this.projectRepo.findAll(status, search, managerId, employeeId);
  }

  async getProjectById(id: number, managerId?: number, employeeId?: number) {
    const project = await this.projectRepo.findById(id, managerId, employeeId);
    if (!project) throw new Error('Project not found');
    return project;
  }

  async createProject(data: any) {
    const connection = await dbPool.getConnection();
    await connection.beginTransaction();

    try {
      const existing = await this.projectRepo.findByCode(data.project_code);
      if (existing) throw new Error('Project code already exists');

      // Create project using connection (Wait, repo uses dbPool. Let's just use dbPool for repo if we don't change repo. But for transaction to work, repo must use connection. Actually, we can just use connection for everything here)
      const [result] = await connection.execute(
        `INSERT INTO projects (project_code, project_name, project_address, client_name, client_code, latitude, longitude, radius_meters, project_date, status, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.project_code,
          data.project_name,
          data.project_address || null,
          data.client_name || null,
          data.client_code || null,
          data.latitude || null,
          data.longitude || null,
          data.radius_meters || 500,
          data.project_date || null,
          data.status,
          data.note || null,
        ]
      );
      const projectId = (result as any).insertId;
      
      if (data.wbs_allocations && Array.isArray(data.wbs_allocations) && data.wbs_allocations.length > 0) {
        for (const wbs of data.wbs_allocations) {
          let wbsId = wbs.wbs_id;
          
          // If wbs_id is missing, but wbs_name is provided, we might need to create it on the fly
          // Since the user might enter a new WBS name
          if (!wbsId && wbs.wbs_name) {
             const [masterRes] = await connection.execute(
                `INSERT INTO work_breakdown_structures (wbs_code, wbs_name) VALUES (?, ?)`,
                [`WBS-TEMP-${Date.now()}-${Math.floor(Math.random()*1000)}`, wbs.wbs_name]
             );
             wbsId = (masterRes as any).insertId;
          }

          if (wbsId) {
            await this.wbsRepo.createProjectWbs(connection, {
              project_id: projectId,
              wbs_id: wbsId,
              start_date: wbs.start_date || undefined,
              end_date: wbs.end_date || undefined,
              total_hours: wbs.total_hours || 0,
              note: wbs.note || undefined
            });
          }
        }
      }

      await connection.commit();
      return await this.projectRepo.findById(projectId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async updateProject(id: number, data: any) {
    const connection = await dbPool.getConnection();
    await connection.beginTransaction();

    try {
      const project = await this.projectRepo.findById(id);
      if (!project) throw new Error('Project not found');

      // Update project master data using repo (Repo doesn't use connection. We will just use dbPool for repo since it's an isolated update, but wait, if it fails later, we want rollback. We must use connection.)
      const fields: string[] = [];
      const params: any[] = [];
      if (data.project_name !== undefined) { fields.push('project_name = ?'); params.push(data.project_name); }
      if (data.project_address !== undefined) { fields.push('project_address = ?'); params.push(data.project_address); }
      if (data.client_name !== undefined) { fields.push('client_name = ?'); params.push(data.client_name); }
      if (data.client_code !== undefined) { fields.push('client_code = ?'); params.push(data.client_code); }
      if (data.latitude !== undefined) { fields.push('latitude = ?'); params.push(data.latitude); }
      if (data.longitude !== undefined) { fields.push('longitude = ?'); params.push(data.longitude); }
      if (data.radius_meters !== undefined) { fields.push('radius_meters = ?'); params.push(data.radius_meters); }
      if (data.project_date !== undefined) { fields.push('project_date = ?'); params.push(data.project_date); }
      if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
      if (data.note !== undefined) { fields.push('note = ?'); params.push(data.note); }

      if (fields.length > 0) {
        params.push(id);
        await connection.execute(`UPDATE projects SET ${fields.join(', ')} WHERE project_id = ?`, params);
      }

      if (data.wbs_allocations && Array.isArray(data.wbs_allocations)) {
        // Fetch existing
        const [existingRows] = await connection.execute(
          `SELECT id FROM project_wbs WHERE project_id = ? AND deleted_at IS NULL`, [id]
        );
        const existingIds = (existingRows as any[]).map(r => r.id);
        const incomingIds = data.wbs_allocations.map((w: any) => w.id).filter(Boolean);

        // Delete removed allocations
        for (const extId of existingIds) {
          if (!incomingIds.includes(extId)) {
             await this.wbsRepo.softDeleteProjectWbs(connection, extId, 1); // using admin id 1
          }
        }

        for (const wbs of data.wbs_allocations) {
          if (wbs.id && wbs.id > 1000000000000) wbs.id = undefined; // Fix frontend temp ids
          
          if (wbs.id) {
            // Update existing
            await this.wbsRepo.updateProjectWbs(connection, wbs.id, {
              start_date: wbs.start_date || undefined,
              end_date: wbs.end_date || undefined,
              total_hours: wbs.total_hours || 0,
              note: wbs.note || undefined
            });
          } else {
            // Create new
            let wbsId = wbs.wbs_id;
            if (!wbsId && wbs.wbs_name) {
               const [masterRes] = await connection.execute(
                  `INSERT INTO work_breakdown_structures (wbs_code, wbs_name) VALUES (?, ?)`,
                  [`WBS-TEMP-${Date.now()}-${Math.floor(Math.random()*1000)}`, wbs.wbs_name]
               );
               wbsId = (masterRes as any).insertId;
            }
            if (wbsId) {
              await this.wbsRepo.createProjectWbs(connection, {
                project_id: id,
                wbs_id: wbsId,
                start_date: wbs.start_date || undefined,
                end_date: wbs.end_date || undefined,
                total_hours: wbs.total_hours || 0,
                note: wbs.note || undefined
              });
            }
          }
        }
      }

      await connection.commit();
      return await this.projectRepo.findById(id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async deleteProject(id: number, deletedBy: number) {
    const project = await this.projectRepo.findById(id);
    if (!project) throw new Error('Project not found');

    const [taskCount] = await import('../config/db').then(m => m.dbPool.query<any[]>(`SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND is_deleted = 0`, [id]));
    if (taskCount[0].count > 0) throw new Error('Cannot delete project: Contains active tasks.');

    const [wbsCount] = await import('../config/db').then(m => m.dbPool.query<any[]>(`SELECT COUNT(*) as count FROM project_wbs WHERE project_id = ? AND deleted_at IS NULL`, [id]));
    if (wbsCount[0].count > 0) throw new Error('Cannot delete project: Has active discipline allocations.');

    return await this.projectRepo.softDelete(id, deletedBy);
  }
}
