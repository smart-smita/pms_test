import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employee_code: z.string().min(2, 'Employee code must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role_id: z.number().int().positive('Valid role ID is required'),
  hourly_rate: z.number().nonnegative().optional().default(0.0),
  status: z.enum(['active', 'inactive']).default('active'),
  reporting_to_id: z.number().int().nullable().optional(),
  assigned_project_id: z.number().int().nullable().optional(),
  assigned_wbs_id: z.number().int().nullable().optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role_id: z.number().int().positive().optional(),
  hourly_rate: z.number().nonnegative().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  reporting_to_id: z.number().int().nullable().optional(),
  assigned_project_id: z.number().int().nullable().optional(),
  assigned_wbs_id: z.number().int().nullable().optional(),
});
