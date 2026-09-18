export interface DropdownOption<T = string | number> {
  value: T;
  label: string;
}

export const PROJECT_STATUS_OPTIONS: DropdownOption<string>[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const TASK_STATUS_OPTIONS: DropdownOption<string>[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const LABOUR_TYPE_OPTIONS: DropdownOption<string>[] = [
  { value: 'direct_labour', label: 'Direct Labour' },
  { value: 'contractor', label: 'Contractor (Sub-contractor / Agency)' },
];

export const LABOUR_WORK_LOG_STATUS_OPTIONS: DropdownOption<string>[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Format project object for select dropdowns consistently across pages
 */
export function formatProjectOption(p: any): DropdownOption<number> {
  const id = Number(p.project_id || p.id || 0);
  const code = p.project_code ? `${p.project_code} - ` : '';
  const name = p.project_name || p.name || `Project ${id}`;
  return {
    value: id,
    label: `${code}${name}`,
  };
}

/**
 * Format WBS Discipline object for select dropdowns
 */
export function formatWbsOption(w: any): DropdownOption<number> {
  const id = Number(w.id || w.wbs_id || 0);
  const name = w.wbs_name || w.name || `Discipline ${id}`;
  const code = w.wbs_code ? ` (${w.wbs_code})` : '';
  return {
    value: id,
    label: `${name}${code}`,
  };
}

/**
 * Format Task object for select dropdowns
 */
export function formatTaskOption(t: any): DropdownOption<number> {
  const id = Number(t.task_id || t.id || 0);
  const name = t.task_name || t.name || `Task ${id}`;
  const projName = t.project_name ? ` (${t.project_name})` : '';
  return {
    value: id,
    label: `${name}${projName}`,
  };
}

/**
 * Format Employee object for select dropdowns
 */
export function formatEmployeeOption(e: any): DropdownOption<number> {
  const id = Number(e.employee_id || e.id || 0);
  const code = e.employee_code ? ` (${e.employee_code})` : '';
  const role = e.role_name ? ` - ${e.role_name}` : '';
  return {
    value: id,
    label: `${e.name}${code}${role}`,
  };
}

/**
 * Format Labour object for select dropdowns
 */
export function formatLabourOption(l: any): DropdownOption<number> {
  const id = Number(l.labour_id || l.id || 0);
  const isContractor = l.labour_type === 'contractor';
  const subWorkers = l.sub_worker_count !== undefined ? l.sub_worker_count : 0;
  const parentStr = l.contractor_name ? ` (via ${l.contractor_name})` : '';

  let typeLabel = 'Direct Labour';
  if (isContractor) {
    typeLabel = `Contractor - ${subWorkers} Workers Available`;
  }

  return {
    value: id,
    label: `${l.name} (${typeLabel})${parentStr}`,
  };
}

/**
 * Filter WBS Disciplines by Project ID
 */
export function filterWbsByProject<T extends Record<string, any>>(
  wbsList: T[],
  projectId: string | number | undefined | null
): T[] {
  if (!projectId || Number(projectId) === 0) {
    return wbsList;
  }
  const pid = Number(projectId);
  return wbsList.filter((w) => {
    const itemPid = Number(w.project_id || w.projectId || 0);
    // If wbs item has no project_id assigned, or matches pid
    return !itemPid || itemPid === pid;
  });
}

/**
 * Filter Tasks by Project ID and optional WBS ID
 */
export function filterTasksByProjectAndWbs<T extends Record<string, any>>(
  taskList: T[],
  projectId?: string | number | undefined | null,
  wbsId?: string | number | undefined | null
): T[] {
  const pid = projectId ? Number(projectId) : 0;
  const wid = wbsId ? Number(wbsId) : 0;

  return taskList.filter((t) => {
    const taskPid = Number(t.project_id || t.projectId || 0);
    const taskWid = Number(t.wbs_id || t.wbsId || 0);

    if (pid && taskPid && taskPid !== pid) return false;
    if (wid && taskWid && taskWid !== wid) return false;
    return true;
  });
}
