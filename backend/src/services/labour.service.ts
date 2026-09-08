import { LabourRepository, LabourRow } from '../repositories/labour.repository';

export class LabourService {
  private labourRepo = new LabourRepository();

  async getLabours(search?: string, labourType?: string): Promise<LabourRow[]> {
    return await this.labourRepo.findAll(search, labourType);
  }

  async getLabourById(id: number): Promise<LabourRow> {
    const labour = await this.labourRepo.findById(id);
    if (!labour) throw new Error('Labour record not found');
    return labour;
  }

  async createLabour(data: { name: string; contact_number?: string; aadhar_id?: string; labour_type?: 'contractor' | 'direct_labour' }): Promise<LabourRow> {
    if (!data.name || !data.name.trim()) throw new Error('Labour name is required');

    if (data.contact_number && data.contact_number.trim()) {
      const existingContact = await this.labourRepo.findByContact(data.contact_number);
      if (existingContact) {
        const err: any = new Error(`Labour with contact number '${data.contact_number}' already exists (${existingContact.name}).`);
        err.existingLabour = existingContact;
        err.statusCode = 409;
        throw err;
      }
    }

    if (data.aadhar_id && data.aadhar_id.trim()) {
      const existingAadhar = await this.labourRepo.findByAadhar(data.aadhar_id);
      if (existingAadhar) {
        const err: any = new Error(`Labour with Aadhaar ID '${data.aadhar_id}' already exists (${existingAadhar.name}).`);
        err.existingLabour = existingAadhar;
        err.statusCode = 409;
        throw err;
      }
    }

    const id = await this.labourRepo.create(data);
    return (await this.labourRepo.findById(id))!;
  }

  async updateLabour(id: number, data: { name?: string; contact_number?: string; aadhar_id?: string; labour_type?: 'contractor' | 'direct_labour' }): Promise<LabourRow> {
    const labour = await this.labourRepo.findById(id);
    if (!labour) throw new Error('Labour record not found');

    if (data.contact_number && data.contact_number.trim()) {
      const existingContact = await this.labourRepo.findByContact(data.contact_number, id);
      if (existingContact) {
        const err: any = new Error(`Another labour with contact number '${data.contact_number}' already exists (${existingContact.name}).`);
        err.existingLabour = existingContact;
        err.statusCode = 409;
        throw err;
      }
    }

    if (data.aadhar_id && data.aadhar_id.trim()) {
      const existingAadhar = await this.labourRepo.findByAadhar(data.aadhar_id, id);
      if (existingAadhar) {
        const err: any = new Error(`Another labour with Aadhaar ID '${data.aadhar_id}' already exists (${existingAadhar.name}).`);
        err.existingLabour = existingAadhar;
        err.statusCode = 409;
        throw err;
      }
    }

    await this.labourRepo.update(id, data);
    return (await this.labourRepo.findById(id))!;
  }

  async getDependencies(id: number): Promise<{ attendanceCount: number; subWorkersCount: number; canDelete: boolean }> {
    const deps = await this.labourRepo.getDependencies(id);
    return {
      ...deps,
      canDelete: deps.attendanceCount === 0 && deps.subWorkersCount === 0,
    };
  }

  async deleteLabour(id: number, force: boolean = false): Promise<boolean> {
    const labour = await this.labourRepo.findById(id);
    if (!labour) throw new Error('Labour record not found');

    const deps = await this.labourRepo.getDependencies(id);
    if (!force && (deps.attendanceCount > 0 || deps.subWorkersCount > 0)) {
      const err: any = new Error(
        `Cannot delete worker/contractor '${labour.name}' because it has active dependencies (${deps.attendanceCount} attendance logs, ${deps.subWorkersCount} sub-workers).`
      );
      err.dependencies = deps;
      err.statusCode = 409;
      throw err;
    }

    return await this.labourRepo.delete(id, force);
  }


}
