import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';

export class EmployeeService {
  private userRepo = new UserRepository();

  async getEmployees(status?: string, roleId?: number, search?: string, managerId?: number, employeeId?: number) {
    return await this.userRepo.findAll(status, roleId, search, managerId, employeeId);
  }

  async getEmployeeById(id: number) {
    const emp = await this.userRepo.findById(id);
    if (!emp) throw new Error('Employee not found');
    return emp;
  }

  async createEmployee(data: {
    employee_code: string;
    name: string;
    email: string;
    password: string;
    role_id: number;
    hourly_rate?: number;
    status: string;
    reporting_to_id?: number | null;
    assigned_project_id?: number | null;
    assigned_wbs_id?: number | null;
  }) {
    const existingCode = await this.userRepo.findByEmployeeCode(data.employee_code);
    if (existingCode) throw new Error('Employee code already exists');

    const existingEmail = await this.userRepo.findByEmail(data.email);
    if (existingEmail) throw new Error('Email address already in use');

    const hash = await bcrypt.hash(data.password, 10);

    const id = await this.userRepo.create({
      employee_code: data.employee_code,
      name: data.name,
      email: data.email,
      password_hash: hash,
      role_id: data.role_id,
      hourly_rate: data.hourly_rate || 0,
      status: data.status,
      reporting_to_id: data.reporting_to_id,
      assigned_project_id: data.assigned_project_id,
      assigned_wbs_id: data.assigned_wbs_id,
    });

    return await this.userRepo.findById(id);
  }

  async updateEmployee(id: number, data: any) {
    const emp = await this.userRepo.findById(id);
    if (!emp) throw new Error('Employee not found');

    const updatePayload: any = {};
    if (data.name) updatePayload.name = data.name;
    if (data.email) updatePayload.email = data.email;
    if (data.role_id) updatePayload.role_id = data.role_id;
    if (data.hourly_rate !== undefined) updatePayload.hourly_rate = data.hourly_rate;
    if (data.status) updatePayload.status = data.status;
    if (data.reporting_to_id !== undefined) updatePayload.reporting_to_id = data.reporting_to_id;
    if (data.assigned_project_id !== undefined) updatePayload.assigned_project_id = data.assigned_project_id;
    if (data.assigned_wbs_id !== undefined) updatePayload.assigned_wbs_id = data.assigned_wbs_id;
    if (data.password) {
      updatePayload.password_hash = await bcrypt.hash(data.password, 10);
    }

    await this.userRepo.update(id, updatePayload);
    return await this.userRepo.findById(id);
  }

  async deleteEmployee(id: number, deletedBy: number) {
    const emp = await this.userRepo.findById(id);
    if (!emp) throw new Error('Employee not found');

    // Dependency check
    const [taskCount] = await import('../config/db').then(m => m.dbPool.query<any[]>(`SELECT COUNT(*) as count FROM task_assignments WHERE employee_id = ?`, [id]));
    if (taskCount[0].count > 0) throw new Error('Cannot delete employee: Assigned to tasks. Re-assign tasks or disable the account instead.');

    const [attendanceCount] = await import('../config/db').then(m => m.dbPool.query<any[]>(`SELECT COUNT(*) as count FROM attendance_logs WHERE employee_id = ?`, [id]));
    if (attendanceCount[0].count > 0) throw new Error('Cannot delete employee: Has attendance logs. Disable the account instead.');

    return await this.userRepo.softDelete(id, deletedBy);
  }

  async getEmployeeDetails(id: number) {
    const emp = await this.userRepo.findById(id);
    if (!emp) throw new Error('Employee not found');
    const workHistory = await this.userRepo.getWorkHistory(id);

    return {
      employee: emp,
      reporting_manager: {
        code: (emp as any).reporting_to_code || null,
        name: (emp as any).reporting_to_name || 'Direct Admin',
        email: (emp as any).reporting_to_email || null,
        role: (emp as any).reporting_to_role_name || 'Admin',
        status: (emp as any).reporting_to_status || 'active',
      },
      assigned_projects: workHistory.projects,
      assigned_tasks: workHistory.tasks,
      timesheet_history: workHistory.timesheets,
    };
  }
}
