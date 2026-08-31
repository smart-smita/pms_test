import { WbsRepository } from '../repositories/wbs.repository';

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
}
