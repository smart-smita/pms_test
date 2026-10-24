import { z } from 'zod';

export const createTaskSchema = z.object({
  project_id: z.number().int().positive('Project ID is required'),
  wbs_id: z.number().int().positive('WBS ID is required'),
  task_code: z.string().optional().nullable(),
  task_name: z.string().min(1, 'Task name is required'),
  description: z.string().optional().nullable(),
  required_worker_count: z.number().int().positive('Required worker count must be >= 1').default(1),
  estimated_hours: z.number().nonnegative('Estimated hours must be non-negative').default(0),
  planned_hours: z.number().nonnegative('Planned hours must be non-negative').optional(),
  start_date: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  target_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  target_time: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'in-progress', 'completed', 'delayed']).optional().default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  progress_percentage: z.number().min(0).max(100).optional().default(0),
  assigned_employee_ids: z.array(z.number().int().positive()).optional(),
  assigned_labour_ids: z.array(z.number().int().positive()).optional(),
  allocations: z.array(z.object({
    work_log_id: z.number().int().positive().optional().nullable(),
    labour_id: z.number().int().positive(),
    work_date: z.string(),
    amount: z.number().nonnegative().optional().nullable(),
    work_description: z.string().optional().nullable(),
    payment_status: z.string().optional().nullable(),
  })).optional(),
  dependencies: z.array(z.object({
    predecessor_task_id: z.number().int().positive(),
    dependency_type: z.enum(['FS', 'SS', 'FF', 'SF']).optional(),
    lag_days: z.number().int().optional()
  })).optional(),
});

export const updateTaskSchema = z.object({
  project_id: z.number().optional().nullable(),
  wbs_id: z.union([z.number().int().positive(), z.null(), z.literal(0)]).optional().transform(v => (v === 0 ? undefined : v || undefined)),
  task_code: z.string().optional().nullable(),
  task_name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  required_worker_count: z.number().int().positive().optional(),
  estimated_hours: z.number().nonnegative().optional(),
  planned_hours: z.number().nonnegative().optional(),
  start_date: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  target_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  target_time: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'in-progress', 'completed', 'delayed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
  assigned_employee_ids: z.array(z.number().int().positive()).optional(),
  assigned_labour_ids: z.array(z.number().int().positive()).optional(),
  allocations: z.array(z.object({
    work_log_id: z.number().int().positive().optional().nullable(),
    labour_id: z.number().int().positive(),
    work_date: z.string(),
    amount: z.number().nonnegative().optional().nullable(),
    work_description: z.string().optional().nullable(),
    payment_status: z.string().optional().nullable(),
  })).optional(),
  dependencies: z.array(z.object({
    predecessor_task_id: z.number().int().positive(),
    dependency_type: z.enum(['FS', 'SS', 'FF', 'SF']).optional(),
    lag_days: z.number().int().optional()
  })).optional(),
});

export const assignWorkersSchema = z.object({
  employee_ids: z.array(z.number().int().positive()),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in-progress', 'completed', 'delayed', 'on-hold', 'cancelled']),
});
