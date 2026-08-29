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

  async checkIn(employeeId: number, data: { task_id?: number; latitude: number; longitude: number; address?: string }) {
    // 1. Check for existing open check-in
    const openCheckIn = await this.attendanceRepo.findOpenCheckInByEmployee(employeeId);
    if (openCheckIn) {
      throw new Error(
        `Active Check-In already exists for this employee (ID: ${openCheckIn.attendance_id}). Please Check-Out first.`
      );
    }

    // 2. If task_id provided, verify task & optionally check GPS radius
    if (data.task_id) {
      const task = await this.taskRepo.findById(data.task_id);
      if (task) {
        const project = await this.projectRepo.findById(task.project_id);
        if (project && project.latitude && project.longitude) {
          const dist = calculateDistanceMeters(
            data.latitude,
            data.longitude,
            Number(project.latitude),
            Number(project.longitude)
          );
          const maxRadius = project.radius_meters || 500;
          if (dist > maxRadius) {
            console.warn(
              `Check-in warning: Employee is ${Math.round(dist)}m away from project center (Allowed radius: ${maxRadius}m)`
            );
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
      in_latitude: data.latitude,
      in_longitude: data.longitude,
      in_address: data.address || `GPS: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
    });

    return await this.attendanceRepo.findById(attendanceId);
  }

  async checkOut(employeeId: number, data: { attendance_id: number; latitude: number; longitude: number; address?: string }) {
    const record = await this.attendanceRepo.findById(data.attendance_id);
    if (!record) throw new Error('Attendance record not found');

    if (record.employee_id !== employeeId) {
      throw new Error('Unauthorized to check out another employee record');
    }

    if (record.status !== 'open') {
      throw new Error(`Attendance record is already closed with status '${record.status}'`);
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
      out_latitude: data.latitude,
      out_longitude: data.longitude,
      out_address: data.address || `GPS: ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`,
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
}
