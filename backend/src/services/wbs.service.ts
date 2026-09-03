import { WbsRepository } from '../repositories/wbs.repository';
import { dbPool } from '../config/db';

export class WbsService {
  private wbsRepo = new WbsRepository();

  async getMasterWbsList() {
    return await this.wbsRepo.findAllMaster();
  }

  async createMasterWbs(data: { wbs_code: string; wbs_name: string; description?: string }) {
    const existing = await this.wbsRepo.findMasterByCode(data.wbs_code);
    if (existing) throw new Error('WBS code already exists');
    const id = await this.wbsRepo.createMaster(data);
    return await this.wbsRepo.findMasterById(id);
  }

  async getProjectWbsAllocations(projectId: number) {
    return await this.wbsRepo.findProjectWbsByProjectId(projectId);
  }

  async addProjectWbsAllocation(data: {
    project_id: number;
    wbs_id: number;
    start_date?: string;
    end_date?: string;
    total_hours?: number;
    note?: string;
  }) {
    const existingList = await this.wbsRepo.findProjectWbsByProjectId(data.project_id);
    const alreadyAllocated = existingList.find((item) => item.wbs_id === data.wbs_id);
    if (alreadyAllocated) {
      throw new Error('This WBS discipline is already allocated to the project');
    }

    const id = await this.wbsRepo.createProjectWbs(null, data);
    return await this.wbsRepo.findProjectWbsById(id);
  }

  async updateProjectWbsAllocation(id: number, data: { start_date?: string; end_date?: string; total_hours?: number; note?: string }) {
    const success = await this.wbsRepo.updateProjectWbs(dbPool, id, data);
    if (!success) throw new Error('Project WBS allocation not found');
    return true;
  }

  async checkWbsDependencies(id: number) {
    return await this.wbsRepo.checkDependencies(id);
  }

  async deleteProjectWbsAllocation(id: number, deletedBy: number, force = false) {
    const deps = await this.wbsRepo.checkDependencies(id);
    if (deps.hasDependencies && !force) {
      const parts = [];
      if (deps.taskCount > 0) parts.push(`${deps.taskCount} task(s)`);
      if (deps.timesheetCount > 0) parts.push(`${deps.timesheetCount} timesheet log(s)`);
      if (deps.labourAttendanceCount > 0) parts.push(`${deps.labourAttendanceCount} labour attendance log(s)`);
      throw new Error(`Cannot delete WBS discipline because active dependencies exist: ${parts.join(', ')}.`);
    }

    const success = await this.wbsRepo.softDeleteProjectWbs(null, id, deletedBy);
    if (!success) throw new Error('Project WBS allocation not found or already deleted');
    return true;
  }
}
