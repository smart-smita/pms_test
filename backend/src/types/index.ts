import { Request } from 'express';

export type RoleName = 'Admin' | 'Manager' | 'Employee';

export interface UserPayload {
  employee_id: number;
  employee_code: string;
  name: string;
  email: string;
  role_id: number;
  role_name: RoleName;
  hourly_rate: number;
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface EmployeeRow {
  employee_id: number;
  employee_code: string;
  name: string;
  email: string;
  password_hash: string;
  role_id: number;
  role_name: RoleName;
  hourly_rate: number;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface ProjectRow {
  project_id: number;
  project_code: string;
  project_name: string;
  project_address?: string;
  client_name?: string;
  client_code?: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  project_date?: string;
  status: 'active' | 'inactive' | 'completed' | 'cancelled';
  note?: string;
  created_at: Date;
  updated_at: Date;
  progress_percentage?: number;
  task_count?: number;
  completed_task_count?: number;
}

export interface TaskRow {
  task_id: number;
  project_id: number;
  project_name?: string;
  task_name: string;
  description?: string;
  required_worker_count: number;
  assigned_worker_count?: number;
  is_understaffed?: boolean;
  estimated_hours: number;
  actual_hours?: number;
  start_date?: string;
  target_date?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  productivity_status?: 'on-time' | 'delayed' | 'extra-hours-logged' | 'exceeding-estimate' | 'completed';
  created_at: Date;
  updated_at: Date;
  assigned_employees?: { employee_id: number; name: string; employee_code: string }[];
}

export interface AttendanceRow {
  attendance_id: number;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
  hourly_rate?: number;
  task_id?: number;
  task_name?: string;
  project_name?: string;
  attendance_date: string;
  check_in_time: string;
  check_out_time?: string;
  in_latitude?: number;
  in_longitude?: number;
  in_address?: string;
  out_latitude?: number;
  out_longitude?: number;
  out_address?: string;
  total_working_hours: number;
  calculated_payment?: number;
  status: 'open' | 'completed' | 'missing_checkout';
  created_at: Date;
  updated_at: Date;
}
