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

      // Create project using connection
      const [result]: any = await connection.execute(
        `INSERT INTO projects (
           project_code, project_name, customer_id, source_quotation_id, project_type_id,
           country_id, community_id, nationality_id, currency_id, budget_amount, project_address,
           client_name, client_code, contact_email, latitude, longitude, radius_meters,
           project_date, start_date, end_date, status, note
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.project_code,
          data.project_name,
          data.customer_id || null,
          data.source_quotation_id || null,
          data.project_type_id || null,
          data.country_id || null,
          data.community_id || null,
          data.nationality_id || null,
          data.currency_id || null,
          data.budget_amount || data.budget || 0,
          data.project_address || null,
          data.client_name || null,
          data.client_code || null,
          data.contact_email || null,
          data.latitude || null,
          data.longitude || null,
          data.radius_meters || 500,
          data.project_date || null,
          data.start_date || null,
          data.end_date || null,
          data.status,
          data.note || null,
        ]
      );
      const projectId = result.insertId;

      // Link quotation if source_quotation_id provided
      if (data.source_quotation_id) {
        await connection.execute(`UPDATE quotations SET project_id = ? WHERE quotation_id = ?`, [projectId, data.source_quotation_id]);
      }

      // Collect allocations from payload or source quotation
      let allocations = Array.isArray(data.wbs_allocations) ? [...data.wbs_allocations] : [];

      if (data.source_quotation_id) {
        const [qdRows]: any = await connection.execute(
          `SELECT * FROM quotation_disciplines WHERE quotation_id = ? AND status = 'active'`,
          [data.source_quotation_id]
        );
        for (const qd of qdRows) {
          const isMat = qd.wbs_type === 'material';
          const already = allocations.find(a => (a.quotation_discipline_id && a.quotation_discipline_id === qd.id) || (a.wbs_name && a.wbs_name.toLowerCase() === qd.discipline_name.toLowerCase()));
          if (!already) {
            allocations.push({
              quotation_discipline_id: qd.id,
              wbs_name: qd.discipline_name,
              wbs_type: isMat ? 'material' : 'labour',
              unit: qd.unit || (isMat ? 'Nos' : 'hours'),
              planned_quantity: Number(qd.quantity || 0),
              total_hours: isMat ? 0 : Number(qd.quantity || 0),
              rate: Number(qd.rate || 0),
              budget_amount: Number(qd.amount || 0),
              planned_labour_cost: isMat ? 0 : Number(qd.amount || 0),
              planned_material_cost: isMat ? Number(qd.amount || 0) : 0,
              start_date: qd.start_date || undefined,
              end_date: qd.end_date || undefined,
              note: qd.description || undefined,
            });
          }
        }
      }

      const createdWbsNames = new Set<string>();

      for (const wbs of allocations) {
        const wbsType = (wbs.wbs_type === 'both' || wbs.wbs_type === 'material') ? wbs.wbs_type : 'labour';
        const isMat = wbsType === 'material';
        const isBoth = wbsType === 'both';
        const normName = (wbs.wbs_name || '').trim().toLowerCase();
        if (normName && createdWbsNames.has(normName)) continue; // prevent duplicate WBS

        let wbsId = wbs.wbs_id;
        
        // Ensure wbsId actually exists in work_breakdown_structures, otherwise reset to null to fetch by name
        if (wbsId) {
          const [checkExist]: any = await connection.execute(
            `SELECT id FROM work_breakdown_structures WHERE id = ? LIMIT 1`,
            [wbsId]
          );
          if (checkExist.length === 0) {
            wbsId = null;
          }
        }

        if (!wbsId && wbs.wbs_name) {
          // Check if exists in master
          const [existMaster]: any = await connection.execute(
            `SELECT id FROM work_breakdown_structures WHERE LOWER(wbs_name) = LOWER(?) AND deleted_at IS NULL LIMIT 1`,
            [wbs.wbs_name]
          );
          if (existMaster.length > 0) {
            wbsId = existMaster[0].id;
          } else {
            const prefix = isMat ? 'MAT-WBS' : 'LAB-WBS';
            const [masterRes]: any = await connection.execute(
              `INSERT INTO work_breakdown_structures (wbs_code, wbs_name, wbs_type) VALUES (?, ?, ?)`,
              [`${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`, wbs.wbs_name, wbsType]
            );
            wbsId = masterRes.insertId;
          }
        }

        if (wbsId) {
          if (normName) createdWbsNames.add(normName);
          const plannedQty = Number(wbs.planned_quantity !== undefined ? wbs.planned_quantity : (isMat ? 0 : wbs.total_hours || 0));
          const rate = Number(wbs.rate || 0);
          const budget = Number(wbs.budget_amount !== undefined ? wbs.budget_amount : (plannedQty * rate) || 0);
          const totalHours = (isMat && !isBoth) ? 0 : Number(wbs.total_hours !== undefined ? wbs.total_hours : plannedQty);
          const plannedLabCost = isMat ? 0 : Number(wbs.planned_labour_cost !== undefined ? wbs.planned_labour_cost : (isBoth ? wbs.labour_cost || 0 : budget));
          const plannedMatCost = (isMat || isBoth) ? Number(wbs.planned_material_cost !== undefined ? wbs.planned_material_cost : (isBoth ? wbs.material_cost || 0 : budget)) : 0;

          await this.wbsRepo.createProjectWbs(connection, {
            project_id: projectId,
            wbs_id: wbsId,
            wbs_type: wbsType as 'labour' | 'material',
            unit: wbs.unit || (isMat ? 'Nos' : 'hours'),
            planned_quantity: plannedQty,
            rate: rate,
            total_hours: totalHours,
            budget_amount: budget,
            planned_labour_cost: plannedLabCost,
            planned_material_cost: plannedMatCost,
            quotation_discipline_id: wbs.quotation_discipline_id || null,
            start_date: wbs.start_date || undefined,
            end_date: wbs.end_date || undefined,
            note: wbs.note || undefined,
          });
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

      const fields: string[] = [];
      const params: any[] = [];
      if (data.project_name !== undefined) { fields.push('project_name = ?'); params.push(data.project_name); }
      if (data.customer_id !== undefined) { fields.push('customer_id = ?'); params.push(data.customer_id); }
      if (data.source_quotation_id !== undefined) { fields.push('source_quotation_id = ?'); params.push(data.source_quotation_id); }
      if (data.project_type_id !== undefined) { fields.push('project_type_id = ?'); params.push(data.project_type_id); }
      if (data.country_id !== undefined) { fields.push('country_id = ?'); params.push(data.country_id); }
      if (data.community_id !== undefined) { fields.push('community_id = ?'); params.push(data.community_id); }
      if (data.nationality_id !== undefined) { fields.push('nationality_id = ?'); params.push(data.nationality_id); }
      if (data.budget_amount !== undefined) { fields.push('budget_amount = ?'); params.push(data.budget_amount); }
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
        const [existingRows]: any = await connection.execute(
          `SELECT id, wbs_id FROM project_wbs WHERE project_id = ? AND deleted_at IS NULL`, [id]
        );
        const existingIds = existingRows.map((r: any) => r.id);
        const incomingIds = data.wbs_allocations.map((w: any) => w.id).filter(Boolean);

        // Delete removed allocations
        for (const extId of existingIds) {
          if (!incomingIds.includes(extId)) {
            await this.wbsRepo.softDeleteProjectWbs(connection, extId, 1);
          }
        }

        for (const wbs of data.wbs_allocations) {
          if (wbs.id && wbs.id > 1000000000000) wbs.id = undefined;
          const isMat = wbs.wbs_type === 'material';
          const wbsType = isMat ? 'material' : 'labour';
          const plannedQty = Number(wbs.planned_quantity !== undefined ? wbs.planned_quantity : (isMat ? 0 : wbs.total_hours || 0));
          const rate = Number(wbs.rate || 0);
          const budget = Number(wbs.budget_amount !== undefined ? wbs.budget_amount : (plannedQty * rate) || 0);
          const totalHours = isMat ? 0 : Number(wbs.total_hours !== undefined ? wbs.total_hours : plannedQty);
          const plannedLabCost = isMat ? 0 : Number(wbs.planned_labour_cost !== undefined ? wbs.planned_labour_cost : budget);
          const plannedMatCost = isMat ? Number(wbs.planned_material_cost !== undefined ? wbs.planned_material_cost : budget) : 0;

          if (wbs.id) {
            await this.wbsRepo.updateProjectWbs(connection, wbs.id, {
              wbs_type: wbsType,
              unit: wbs.unit || (isMat ? 'Nos' : 'hours'),
              planned_quantity: plannedQty,
              rate: rate,
              budget_amount: budget,
              planned_labour_cost: plannedLabCost,
              planned_material_cost: plannedMatCost,
              start_date: wbs.start_date || undefined,
              end_date: wbs.end_date || undefined,
              total_hours: totalHours,
              note: wbs.note || undefined
            });
          } else {
            let wbsId = wbs.wbs_id;

            if (wbsId) {
              const [checkMaster]: any = await connection.execute(
                `SELECT id FROM work_breakdown_structures WHERE id = ?`,
                [wbsId]
              );
              if (checkMaster.length === 0) {
                wbsId = null;
              }
            }

            if (!wbsId && wbs.wbs_name) {
              const [existMaster]: any = await connection.execute(
                `SELECT id FROM work_breakdown_structures WHERE LOWER(wbs_name) = LOWER(?) AND deleted_at IS NULL LIMIT 1`,
                [wbs.wbs_name]
              );
              if (existMaster.length > 0) {
                wbsId = existMaster[0].id;
              } else {
                const prefix = isMat ? 'MAT-WBS' : 'LAB-WBS';
                const [masterRes]: any = await connection.execute(
                  `INSERT INTO work_breakdown_structures (wbs_code, wbs_name, wbs_type) VALUES (?, ?, ?)`,
                  [`${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`, wbs.wbs_name, wbsType]
                );
                wbsId = masterRes.insertId;
              }
            }
            if (wbsId) {
              await this.wbsRepo.createProjectWbs(connection, {
                project_id: id,
                wbs_id: wbsId,
                wbs_type: wbsType,
                unit: wbs.unit || (isMat ? 'Nos' : 'hours'),
                planned_quantity: plannedQty,
                rate: rate,
                total_hours: totalHours,
                budget_amount: budget,
                planned_labour_cost: plannedLabCost,
                planned_material_cost: plannedMatCost,
                start_date: wbs.start_date || undefined,
                end_date: wbs.end_date || undefined,
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

  async getProject360Details(id: number, managerId?: number, employeeId?: number) {
    const details = await this.projectRepo.getProject360Details(id);
    if (!details) throw new Error('Project not found');
    return details;
  }
}
