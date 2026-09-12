import { Request } from 'express';

export type RoleName = 'Super Admin' | 'Admin' | 'Manager' | 'Employee';

export interface UserPayload {
  employee_id: number;
  employee_code: string;
  name: string;
  email: string;
  role_id: number;
  role_name: RoleName;
  hourly_rate?: number;
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
  reporting_to_id?: number | null;
  reporting_to_name?: string | null;
  assigned_project_id?: number | null;
  assigned_project_name?: string | null;
  assigned_wbs_id?: number | null;
  assigned_wbs_name?: string | null;
  hourly_rate?: number;
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
  total_planned_hours?: number;
  total_actual_hours?: number;
  total_remaining_hours?: number;
  completion_percentage?: number;
  total_variance?: number;
  budget_amount?: number;
  actual_cost?: number;
  paid_amount?: number;
  pending_amount?: number;
  remaining_budget?: number;
  budget_variance?: number;
}

export interface TaskRow {
  task_id: number;
  project_id: number;
  wbs_id?: number;
  wbs_name?: string;
  project_name?: string;
  task_name: string;
  task_address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  required_worker_count: number;
  assigned_worker_count?: number;
  is_understaffed?: boolean;
  estimated_hours: number;
  actual_hours?: number;
  remaining_hours?: number;
  variance?: number;
  completion_percentage?: number;
  allocation_status?: 'Within Allocation' | 'Near Limit' | 'Hours Exceeded';
  budget_amount?: number;
  actual_cost?: number;
  start_date?: string;
  start_time?: string;
  target_date?: string;
  target_time?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  productivity_status?: 'on-time' | 'delayed' | 'extra-hours-logged' | 'exceeding-estimate' | 'completed';
  created_at: Date;
  updated_at: Date;
  assigned_employees?: { employee_id: number; name: string; employee_code: string }[];
  assigned_labours?: { labour_id: number; name: string; labour_type: string }[];
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
  in_distance_meters?: number;
  out_distance_meters?: number;
  project_radius_meters?: number;
  in_status?: 'inside' | 'outside';
  out_status?: 'inside' | 'outside';
  total_working_hours: number;
  calculated_payment?: number;
  status: 'open' | 'completed' | 'outside_area' | 'missing_checkout';
  created_at: Date;
  updated_at: Date;
}

export interface WorkBreakdownStructureRow {
  id: number;
  wbs_code: string;
  wbs_name: string;
  description?: string;
  status: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProjectWBSRow {
  id: number;
  project_id: number;
  wbs_id: number;
  wbs_code?: string;
  wbs_name?: string;
  start_date?: string;
  end_date?: string;
  total_hours?: number;
  actual_hours?: number;
  remaining_hours?: number;
  completion_percentage?: number;
  variance?: number;
  budget_amount?: number;
  actual_cost?: number;
  note?: string;
  status: number | string;
  created_at?: Date;
  updated_at?: Date;
}
