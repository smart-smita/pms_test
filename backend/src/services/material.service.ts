import { MaterialRepository } from '../repositories/material.repository';

export class MaterialService {
  private repo = new MaterialRepository();

  async getMaterials() {
    return await this.repo.findAll();
  }

  async getMaterialById(id: number) {
    const m = await this.repo.findById(id);
    if (!m) throw new Error('Material not found');
    return m;
  }

  async createMaterial(data: any) {
    const id = await this.repo.create(data);
    return await this.repo.findById(id);
  }

  async updateMaterial(id: number, data: any) {
    await this.repo.update(id, data);
    return await this.repo.findById(id);
  }

  async deleteMaterial(id: number) {
    const m = await this.repo.findById(id);
    if (!m) throw new Error('Material not found');
    return await this.repo.delete(id);
  }
}
