export type RoleName = 'Super Admin' | 'Admin' | 'Manager' | 'Employee';

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
  reporting_to_id?: number | null;
  reporting_to_name?: string | null;
  reports_to_id?: number | null;
  manager_name?: string | null;
  assigned_project_id?: number | null;
  assigned_project_name?: string | null;
  assigned_wbs_id?: number | null;
  assigned_wbs_name?: string | null;
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
  wbs_id?: number;
  wbs_name?: string;
  project_name?: string;
  task_name: string;
  description?: string;
  required_worker_count: number;
  assigned_worker_count?: number;
  is_understaffed?: boolean;
  estimated_hours: number;
  actual_hours?: number;
  start_date?: string;
  start_time?: string;
  target_date?: string;
  target_time?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed' | 'on-hold' | 'cancelled';
  productivity_status?: 'on-time' | 'delayed' | 'extra-hours-logged' | 'exceeding-estimate' | 'completed';
  allocation_status?: string;
  assigned_employees?: { employee_id: number; name: string; employee_code: string }[];
  assigned_labours?: { labour_id: number; name: string; labour_type: string }[];
  allocations?: any[];
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
  in_distance_meters?: number;
  out_distance_meters?: number;
  project_radius_meters?: number;
  in_status?: 'inside' | 'outside';
  out_status?: 'inside' | 'outside';
  total_working_hours: number;
  calculated_payment?: number;
  status: 'open' | 'completed' | 'outside_area' | 'missing_checkout';
  created_at: string;
  updated_at: string;
}

export interface WorkBreakdownStructure {
  id: number;
  wbs_code: string;
  wbs_name: string;
  description?: string;
  status: number;
}

export type MasterWBS = WorkBreakdownStructure;

export interface ProjectWBS {
  id: number;
  project_id: number;
  wbs_id: number;
  wbs_code?: string;
  wbs_name?: string;
  start_date?: string;
  end_date?: string;
  total_hours?: number;
  actual_start_date?: string;
  actual_end_date?: string;
  actual_hours?: number;
  note?: string;
  status: number | string;
  completion_percentage?: number;
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

export interface ProjectWorkRow {
  project_id: number;
  project_name: string;
  project_wbs_id: number | null;
  wbs_name: string | null;
  wbs_code: string | null;
  task_id: number;
  task_name: string;
  task_status: string;
  estimated_hours: number;
  actual_hours: number;
  required_worker_count: number;
  assigned_employee_name: string | null;
}

export interface Customer {
  customer_id: number;
  customer_code: string;
  customer_name: string;
  contact_person?: string | null;
  contact_number?: string | null;
  email?: string | null;
  country_id?: number | null;
  country_name?: string | null;
  state?: string | null;
  city?: string | null;
  community_id?: number | null;
  community_name?: string | null;
  nationality_id?: number | null;
  nationality_name?: string | null;
  address?: string | null;
  status: 'active' | 'inactive';
  project_count?: number;
  created_by?: number | null;
  created_by_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Country {
  country_id: number;
  country_code: string;
  country_name: string;
  phone_code?: string | null;
  status: number;
}

export interface Nationality {
  nationality_id: number;
  nationality_name: string;
  country_id?: number | null;
  status: number;
}

export interface Community {
  community_id: number;
  community_name: string;
  country_id?: number | null;
  state?: string | null;
  status: number;
}

export interface ProjectType {
  type_id: number;
  type_code: string;
  type_name: string;
  description?: string | null;
  status: number;
  sort_order: number;
}

export interface DocumentType {
  doc_type_id: number;
  type_code: string;
  type_name: string;
  applies_to: 'employee' | 'labour' | 'project' | 'quotation' | 'all';
  has_expiry: number;
  has_number: number;
  has_issue_date: number;
  is_required: number;
  country_id?: number | null;
  status: number;
  sort_order: number;
}

export interface Discipline {
  discipline_id: number;
  discipline_code: string;
  discipline_name: string;
  description?: string | null;
  status: number;
  sort_order: number;
}

export interface TermsTemplate {
  template_id: number;
  template_name: string;
  country_id?: number | null;
  country_name?: string | null;
  project_type_id?: number | null;
  type_name?: string | null;
  discipline_id?: number | null;
  discipline_name?: string | null;
  terms_content: string;
  status: number;
  version: number;
  created_at?: string;
}

export interface QuotationDiscipline {
  id?: number;
  quotation_id?: number;
  project_id?: number;
  discipline_id: number;
  discipline_name: string;
  description?: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  terms_conditions?: string;
  status?: 'active' | 'inactive';
}

export interface Quotation {
  quotation_id: number;
  quotation_code: string;
  customer_id: number;
  customer_name?: string;
  project_id: number;
  project_name?: string;
  quotation_date: string;
  validity_date?: string;
  description?: string;
  subtotal_amount: number;
  tax_percentage: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  terms_conditions?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'revised';
  revision_number: number;
  created_by?: number;
  created_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  disciplines?: QuotationDiscipline[];
  created_at?: string;
}

export interface EntityDocument {
  document_id: number;
  entity_type: 'employee' | 'labour' | 'project' | 'quotation' | 'discipline';
  entity_id: number;
  doc_type_id: number;
  doc_type_name?: string;
  document_name: string;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  status: 'active' | 'expired' | 'archived';
  days_remaining?: number;
  uploaded_by?: number;
  uploaded_by_name?: string;
  created_at?: string;
}

export interface Currency {
  currency_id: number;
  currency_code: string;
  currency_name: string;
  symbol: string;
  exchange_rate: number;
  is_base: number;
  status: number;
  created_at?: string;
}

export interface Tax {
  tax_id: number;
  tax_name: string;
  tax_percentage: number;
  country_id?: number | null;
  country_name?: string | null;
  status: number;
  created_at?: string;
}

export interface BillingSchedule {
  schedule_id: number;
  project_id: number;
  project_name?: string;
  customer_name?: string;
  quotation_id: number;
  quotation_code?: string;
  billing_month: string;
  expected_amount: number;
  status: 'pending' | 'completed_work_logged' | 'invoiced' | 'paid';
  completed_work_id?: number | null;
  approved_amount?: number | null;
  completion_percentage?: number | null;
  work_status?: 'draft' | 'submitted' | 'approved' | 'rejected' | null;
  created_at?: string;
}

export interface MonthlyCompletedWork {
  completed_work_id: number;
  schedule_id: number;
  project_id: number;
  project_name?: string;
  customer_name?: string;
  billing_month?: string;
  expected_amount?: number;
  completion_percentage: number;
  approved_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approved_by?: number | null;
  approved_by_name?: string | null;
  created_at?: string;
}

export interface InvoiceItem {
  item_id?: number;
  invoice_id?: number;
  discipline_id?: number | null;
  discipline_name?: string;
  description: string;
  amount: number;
  is_extra_work: boolean | number;
}

export interface Invoice {
  invoice_id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  customer_code?: string;
  project_id: number;
  project_name?: string;
  project_code?: string;
  quotation_id: number;
  quotation_code?: string;
  schedule_id: number;
  survey_id?: number | null;
  survey_code?: string | null;
  report_file_url?: string | null;
  billing_month?: string;
  currency_id: number;
  currency_code?: string;
  currency_symbol?: string;
  tax_id?: number | null;
  tax_name?: string | null;
  tax_percentage?: number | null;
  invoice_date: string;
  due_date: string;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount?: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partially_paid' | 'paid' | 'cancelled';
  items?: InvoiceItem[];
  created_by?: number | null;
  created_by_name?: string | null;
  approved_by?: number | null;
  approved_by_name?: string | null;
  created_at?: string;
}

export interface InvoicePayment {
  payment_id: number;
  invoice_id: number;
  invoice_number?: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at?: string;
}

export interface Project360Data {
  project: Project & {
    country_name?: string;
    community_name?: string;
    project_type_name?: string;
    nationality_name?: string;
  };
  customer?: Customer | null;
  quotation?: Quotation | null;
  disciplines?: QuotationDiscipline[];
  documents?: EntityDocument[];
  tasks?: Task[];
  surveys?: SiteSurvey[];
  invoices?: Invoice[];
  payments?: InvoicePayment[];
  financials?: {
    budget_amount: number;
    total_invoiced: number;
    total_paid: number;
    balance_due: number;
  };
}

export interface SiteSurveyPhoto {
  photo_id?: number;
  survey_id?: number;
  photo_name?: string;
  file_path: string;
  file_base64?: string;
  caption?: string;
  discipline_ids?: number[];
  disciplines?: { id: number; name: string }[];
  created_at?: string;
}

export interface SiteSurvey {
  survey_id: number;
  survey_code: string;
  project_id: number;
  project_name?: string;
  project_code?: string;
  customer_id?: number | null;
  customer_name?: string | null;
  discipline_id?: number | null;
  discipline_name?: string | null;
  discipline_code?: string | null;
  survey_date: string;
  conducted_by: number;
  conducted_by_name?: string;
  conducted_by_email?: string;
  entry_type: 'system_entry' | 'report_attachment';
  location_details?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  comments?: string | null;
  remarks?: string | null;
  attached_report_path?: string | null;
  status: 'draft' | 'completed' | 'verified' | 'rejected';
  photo_count?: number;
  photos?: SiteSurveyPhoto[];
  created_at?: string;
}




