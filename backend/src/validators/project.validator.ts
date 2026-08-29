import { z } from 'zod';

export const createProjectSchema = z.object({
  project_code: z.string().min(2, 'Project code must be at least 2 characters'),
  project_name: z.string().min(2, 'Project name is required'),
  project_address: z.string().optional(),
  client_name: z.string().optional(),
  client_code: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius_meters: z.number().int().positive().default(500),
  project_date: z.string().optional(),
  status: z.enum(['active', 'inactive', 'completed', 'cancelled']).default('active'),
  note: z.string().optional(),
  disciplines: z.array(z.object({
    task_name: z.string(),
    start_date: z.string().optional(),
    target_date: z.string().optional(),
    estimated_hours: z.number().default(0)
  })).optional(),
});

export const updateProjectSchema = z.object({
  project_name: z.string().min(2).optional(),
  project_address: z.string().optional(),
  client_name: z.string().optional(),
  client_code: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius_meters: z.number().int().positive().optional(),
  project_date: z.string().optional(),
  status: z.enum(['active', 'inactive', 'completed', 'cancelled']).optional(),
  note: z.string().optional(),
});
