import { LabourRepository, LabourRow, LabourAttendanceRow } from '../repositories/labour.repository';

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

  async getLabourAttendance(projectId?: number, startDate?: string, endDate?: string, managerId?: number) {
    return await this.labourRepo.findAttendance(projectId, startDate, endDate, managerId);
  }

  async createLabourAttendance(data: {
    labour_id: number;
    project_id?: number | null;
    wbs_id?: number | null;
    task_id?: number | null;
    attendance_date: string;
    in_time?: string | null;
    out_time?: string | null;
    daily_pay_amount: number;
    worker_count: number;
    comment?: string | null;
  }): Promise<any> {
    if (!data.labour_id) throw new Error('Labour selection is required');
    if (!data.attendance_date) throw new Error('Attendance date is required');
    if (data.daily_pay_amount < 0) throw new Error('Daily payment amount cannot be negative');
    if (data.worker_count < 1) throw new Error('Worker count must be at least 1');

    if (data.in_time && data.out_time && data.in_time >= data.out_time) {
      throw new Error('Check-in time must be earlier than Check-out time');
    }

    let projectId = data.project_id || null;
    let wbsId = data.wbs_id || null;

    if (data.task_id) {
      const { TaskRepository } = await import('../repositories/task.repository');
      const taskRepo = new TaskRepository();
      const task = await taskRepo.findById(data.task_id);
      if (task) {
        if (!projectId) projectId = task.project_id;
        if (!wbsId) wbsId = task.wbs_id || null;
      }

      const isDuplicate = await this.labourRepo.checkDuplicateAttendance(data.labour_id, data.task_id, data.attendance_date);
      if (isDuplicate) {
        throw new Error('Attendance for this labour on the selected task and date already exists');
      }
    }

    const id = await this.labourRepo.createAttendance({
      ...data,
      project_id: projectId,
      wbs_id: wbsId,
    });
    return { id, message: 'Labour attendance logged successfully' };
  }

  async updateLabourAttendance(id: number, data: any) {
    const success = await this.labourRepo.updateAttendance(id, data);
    if (!success) throw new Error('Labour attendance record not found');
    return { id, message: 'Labour attendance updated successfully' };
  }

  async deleteLabourAttendance(id: number) {
    const success = await this.labourRepo.softDeleteAttendance(id);
    if (!success) throw new Error('Labour attendance record not found');
    return { id, message: 'Labour attendance deleted successfully' };
  }
}
