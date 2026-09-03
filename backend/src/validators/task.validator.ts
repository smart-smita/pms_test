import { z } from 'zod';

export const createTaskSchema = z.object({
  project_id: z.number().int().positive('Project ID is required'),
  wbs_id: z.number().int().positive('WBS ID is required'),
  task_name: z.string().min(2, 'Task name is required'),
  description: z.string().optional(),
  required_worker_count: z.number().int().positive('Required worker count must be >= 1').default(1),
  estimated_hours: z.number().nonnegative('Estimated hours must be non-negative').default(0),
  start_date: z.string().optional(),
  start_time: z.string().optional(),
  target_date: z.string().optional(),
  target_time: z.string().optional(),
  assigned_employee_ids: z.array(z.number().int().positive()).optional(),
  assigned_labour_ids: z.array(z.number().int().positive()).optional(),
});

export const updateTaskSchema = z.object({
  wbs_id: z.number().int().positive().optional(),
  task_name: z.string().min(2).optional(),
  description: z.string().optional(),
  required_worker_count: z.number().int().positive().optional(),
  estimated_hours: z.number().nonnegative().optional(),
  start_date: z.string().optional(),
  start_time: z.string().optional(),
  target_date: z.string().optional(),
  target_time: z.string().optional(),
  assigned_employee_ids: z.array(z.number().int().positive()).optional(),
  assigned_labour_ids: z.array(z.number().int().positive()).optional(),
});

export const assignWorkersSchema = z.object({
  employee_ids: z.array(z.number().int().positive()),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['pending', 'in-progress', 'completed', 'delayed', 'on-hold', 'cancelled']),
});
