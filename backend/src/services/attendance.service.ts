import { AttendanceRepository } from '../repositories/attendance.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { TaskRepository } from '../repositories/task.repository';
import { calculateDistanceMeters } from '../utils/distance';

export class AttendanceService {
  private formatLocalMysql(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  private attendanceRepo = new AttendanceRepository();
  private projectRepo = new ProjectRepository();
  private taskRepo = new TaskRepository();

  async checkIn(employeeId: number, data: { task_id?: number; latitude?: number; longitude?: number; address?: string }) {
    // 1. Check for existing open check-in session
    const openCheckIn = await this.attendanceRepo.findOpenCheckInByEmployee(employeeId);
    if (openCheckIn) {
      throw new Error(
        `Active check-in session already exists for this employee (ID: ${openCheckIn.attendance_id}). Please Check-Out first.`
      );
    }

    let inDistanceMeters: number | undefined;
    let projectRadiusMeters: number = 500;
    let inStatus: 'inside' | 'outside' = 'inside';
    let status: 'open' | 'outside_area' = 'open';

    const lat = data.latitude || 0;
    const lng = data.longitude || 0;

    // 2. Fetch task and project location coordinates
    if (data.task_id && data.latitude != null && data.longitude != null) {
      const task = await this.taskRepo.findById(data.task_id);
      if (task) {
        const project = await this.projectRepo.findById(task.project_id);
        if (project && project.latitude != null && project.longitude != null) {
          projectRadiusMeters = project.radius_meters || 500;
          inDistanceMeters = Math.round(
            calculateDistanceMeters(
              lat,
              lng,
              Number(project.latitude),
              Number(project.longitude)
            ) * 100
          ) / 100;

          if (inDistanceMeters > projectRadiusMeters) {
            inStatus = 'outside';
            status = 'outside_area';
          } else {
            inStatus = 'inside';
            status = 'open';
          }
        }
      }
    }

    const now = new Date();
    const attendanceDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const checkInTime = this.formatLocalMysql(now);

    const attendanceId = await this.attendanceRepo.createCheckIn({
      employee_id: employeeId,
      task_id: data.task_id,
      attendance_date: attendanceDate,
      check_in_time: checkInTime,
      in_latitude: lat,
      in_longitude: lng,
      in_address: data.address || (lat !== 0 ? `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Manual Punch'),
      in_distance_meters: inDistanceMeters,
      project_radius_meters: projectRadiusMeters,
      in_status: inStatus,
      status: status,
    });

    return await this.attendanceRepo.findById(attendanceId);
  }

  async checkOut(employeeId: number, data: { attendance_id: number; latitude?: number; longitude?: number; address?: string }, userRole?: string) {
    const record = await this.attendanceRepo.findById(data.attendance_id);
    if (!record) throw new Error('Attendance record not found');

    if (record.employee_id !== employeeId && userRole !== 'Admin' && userRole !== 'Super Admin' && userRole !== 'Manager') {
      throw new Error('Unauthorized to check out another employee record');
    }

    if (record.status !== 'open') {
      throw new Error(`Attendance record is not active (current status: '${record.status}')`);
    }

    let outDistanceMeters: number | undefined;
    let outStatus: 'inside' | 'outside' = 'inside';
    
    const lat = data.latitude || 0;
    const lng = data.longitude || 0;

    if (record.task_id && data.latitude != null && data.longitude != null) {
      const task = await this.taskRepo.findById(record.task_id);
      if (task) {
        const project = await this.projectRepo.findById(task.project_id);
        if (project && project.latitude != null && project.longitude != null) {
          const maxRadius = project.radius_meters || 500;
          outDistanceMeters = Math.round(
            calculateDistanceMeters(
              lat,
              lng,
              Number(project.latitude),
              Number(project.longitude)
            ) * 100
          ) / 100;
          outStatus = outDistanceMeters <= maxRadius ? 'inside' : 'outside';
        }
      }
    }

    const now = new Date();
    const checkOutTimeStr = this.formatLocalMysql(now);

    // Compute working hours server-side
    const checkInTime = new Date(record.check_in_time);
    const diffMs = now.getTime() - checkInTime.getTime();
    const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));
    const totalWorkingHours = Math.round(diffHours * 100) / 100;

    await this.attendanceRepo.checkOut({
      attendance_id: data.attendance_id,
      check_out_time: checkOutTimeStr,
      out_latitude: lat,
      out_longitude: lng,
      out_address: data.address || (lat !== 0 ? `GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Manual Punch'),
      out_distance_meters: outDistanceMeters,
      out_status: outStatus,
      total_working_hours: totalWorkingHours,
      status: 'completed',
    });

    return await this.attendanceRepo.findById(data.attendance_id);
  }

  async getAttendanceLogs(filters: any) {
    // Run automated missing checkouts update for past dates
    const now = new Date();
    const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    await this.attendanceRepo.markMissingCheckouts(today);

    return await this.attendanceRepo.findAll(filters);
  }

  async getActiveCheckIn(employeeId: number) {
    return await this.attendanceRepo.findOpenCheckInByEmployee(employeeId);
  }

  async updateAttendance(id: number, data: any) {
    const record = await this.attendanceRepo.findById(id);
    if (!record) throw new Error('Attendance record not found');

    const updatePayload = { ...data };
    if (data.check_in_time && data.check_out_time) {
      const inTime = new Date(data.check_in_time);
      const outTime = new Date(data.check_out_time);
      const diffHours = Math.max(0, (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60));
      updatePayload.total_working_hours = Math.round(diffHours * 100) / 100;
      updatePayload.status = 'completed';
    }

    await this.attendanceRepo.update(id, updatePayload);
    return await this.attendanceRepo.findById(id);
  }

  async deleteAttendance(id: number) {
    const record = await this.attendanceRepo.findById(id);
    if (!record) throw new Error('Attendance record not found');
    return await this.attendanceRepo.softDelete(id);
  }
}
