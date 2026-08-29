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
    hourly_rate: number;
    status: string;
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
      hourly_rate: data.hourly_rate,
      status: data.status,
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
    if (data.password) {
      updatePayload.password_hash = await bcrypt.hash(data.password, 10);
    }

    await this.userRepo.update(id, updatePayload);
    return await this.userRepo.findById(id);
  }
}
