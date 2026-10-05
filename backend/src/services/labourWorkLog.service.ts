import { LabourWorkLogRepository, LabourWorkLogRow, LabourWorkLogFilters } from '../repositories/labourWorkLog.repository';

export class LabourWorkLogService {
  private repo = new LabourWorkLogRepository();

  async getWorkLogs(filters: LabourWorkLogFilters = {}): Promise<LabourWorkLogRow[]> {
    return await this.repo.findAll(filters);
  }

  async getWorkLogById(id: number): Promise<LabourWorkLogRow> {
    const log = await this.repo.findById(id);
    if (!log) throw new Error('Work log not found');
    return log;
  }

  async createWorkLog(data: {
    labour_id: number;
    project_id: number;
    wbs_id?: number | null;
    task_id: number;
    work_date: string;
    in_time?: string | null;
    out_time?: string | null;
    total_working_hours?: number;
    rate_type?: 'hourly' | 'daily';
    rate: number;
    work_description?: string | null;
    work_status?: 'pending' | 'in_progress' | 'completed';
    created_by?: number | null;
  }): Promise<LabourWorkLogRow> {
    if (!data.labour_id) throw new Error('Labour selection is required');
    if (!data.project_id) throw new Error('Project selection is required');
    if (!data.task_id) throw new Error('Task selection is required');
    if (!data.work_date) throw new Error('Work date is required');
    if (data.rate === undefined || data.rate < 0) throw new Error('Valid non-negative rate is required');

    // Auto-calculate working hours and check overlap if in_time & out_time provided
    let hours = data.total_working_hours || 0;
    const hasInTime = Boolean(data.in_time && data.in_time.trim());
    const hasOutTime = Boolean(data.out_time && data.out_time.trim());

    if (hasInTime && hasOutTime) {
      if (data.in_time! >= data.out_time!) {
        throw new Error('Out time must be strictly after In time');
      }
      const [inH, inM] = data.in_time!.split(':').map(Number);
      const [outH, outM] = data.out_time!.split(':').map(Number);
      const diffMs = (outH * 60 + outM) - (inH * 60 + inM);
      hours = Math.round((diffMs / 60) * 100) / 100;

      const overlap = await this.repo.checkOverlap(data.labour_id, data.work_date, data.in_time!, data.out_time!);
      if (overlap) {
        throw new Error(`Time range (${data.in_time} - ${data.out_time}) overlaps with existing work log for task "${overlap.task_name}" on ${data.work_date}`);
      }
    }

    if (hours <= 0) throw new Error('Total working hours must be greater than zero');

    const rateType = data.rate_type || 'hourly';
    let amount = 0;
    if (rateType === 'hourly') {
      amount = Math.round((hours * data.rate) * 100) / 100;
    } else {
      // Daily rate
      amount = Number(data.rate);
    }

    const id = await this.repo.create({
      ...data,
      total_working_hours: hours,
      rate_type: rateType,
      amount,
    });

    return (await this.repo.findById(id))!;
  }

  async updateWorkLog(id: number, data: Partial<LabourWorkLogRow>, userId?: number): Promise<LabourWorkLogRow> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error('Work log not found');

    const updatedLabourId = data.labour_id || existing.labour_id;
    const updatedProjectId = data.project_id || existing.project_id;
    const updatedTaskId = data.task_id || existing.task_id;
    const updatedWorkDate = data.work_date || existing.work_date;
    const updatedInTime = data.in_time !== undefined ? data.in_time : existing.in_time;
    const updatedOutTime = data.out_time !== undefined ? data.out_time : existing.out_time;
    const updatedRateType = data.rate_type || existing.rate_type;
    const updatedRate = data.rate !== undefined ? data.rate : existing.rate;

    let hours = data.total_working_hours !== undefined ? data.total_working_hours : existing.total_working_hours;
    const hasInTime = Boolean(updatedInTime && updatedInTime.trim());
    const hasOutTime = Boolean(updatedOutTime && updatedOutTime.trim());

    if (hasInTime && hasOutTime) {
      if (updatedInTime! >= updatedOutTime!) {
        throw new Error('Out time must be strictly after In time');
      }
      const [inH, inM] = updatedInTime!.split(':').map(Number);
      const [outH, outM] = updatedOutTime!.split(':').map(Number);
      const diffMs = (outH * 60 + outM) - (inH * 60 + inM);
      hours = Math.round((diffMs / 60) * 100) / 100;

      const overlap = await this.repo.checkOverlap(updatedLabourId, updatedWorkDate, updatedInTime!, updatedOutTime!, id);
      if (overlap) {
        throw new Error(`Time range (${updatedInTime} - ${updatedOutTime}) overlaps with existing work log for task "${overlap.task_name}" on ${updatedWorkDate}`);
      }
    }

    let amount = 0;
    if (updatedRateType === 'hourly') {
      amount = Math.round((hours * updatedRate) * 100) / 100;
    } else {
      amount = Number(updatedRate);
    }

    await this.repo.update(id, {
      ...data,
      labour_id: updatedLabourId,
      project_id: updatedProjectId,
      task_id: updatedTaskId,
      work_date: updatedWorkDate,
      in_time: updatedInTime,
      out_time: updatedOutTime,
      total_working_hours: hours,
      rate_type: updatedRateType,
      rate: updatedRate,
      amount,
    }, userId);

    return (await this.repo.findById(id))!;
  }

  async deleteWorkLog(id: number): Promise<boolean> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new Error('Work log not found');
    return await this.repo.softDelete(id);
  }
}
