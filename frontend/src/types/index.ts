export type RoleName = 'Admin' | 'Manager' | 'Employee';

export interface User {
  employee_id: number;
  employee_code: string;
  name: string;
  email: string;
  role_id: number;
  role_name: RoleName;
  permissions: string[];
  hourly_rate: number;
}

export interface Employee {
  employee_id: number;
  employee_code: string;
  name: string;
  email: string;
  role_id: number;
  role_name: RoleName;
  hourly_rate: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface Project {
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
  progress_percentage?: number;
  task_count?: number;
  completed_task_count?: number;
}

export interface Task {
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
  assigned_employees?: { employee_id: number; name: string; employee_code: string }[];
}

export interface AttendanceLog {
  attendance_id: number;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
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
}

export interface DashboardMetrics {
  employees: {
    total: number;
    active: number;
    present_today: number;
    absent_today: number;
    on_leave: number;
    checked_in_live: number;
  };
  today_metrics: {
    working_hours: number;
    worker_cost: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    overall_progress_percentage: number;
    history: { date: string; progress: number }[];
  };
  tasks: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    delayed: number;
  };
  recent_tasks: {
    task_name: string;
    project_name: string;
    progress_percentage: number;
    due_date: string;
    status: string;
  }[];
  live_attendance: {
    name: string;
    employee_code: string;
    role_name: string;
    check_in_time: string;
    project_name: string;
  }[];
}
