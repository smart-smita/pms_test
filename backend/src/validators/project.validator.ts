import { z } from 'zod';

const wbsAllocationSchema = z.object({
  id: z.number().optional().nullable(),
  wbs_id: z.number().optional().nullable(),
  wbs_name: z.string().optional().nullable(),
  wbs_type: z.enum(['labour', 'material', 'both']).optional().nullable(),
  unit: z.string().optional().nullable(),
  planned_quantity: z.number().optional().nullable(),
  rate: z.number().optional().nullable(),
  budget_amount: z.number().optional().nullable(),
  planned_labour_cost: z.number().optional().nullable(),
  planned_material_cost: z.number().optional().nullable(),
  quotation_discipline_id: z.number().optional().nullable(),
  wbs_template_id: z.number().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  total_hours: z.number().default(0).nullable(),
  note: z.string().optional().nullable()
});

export const createProjectSchema = z.object({
  project_code: z.string().min(2, 'Project code must be at least 2 characters'),
  project_name: z.string().min(2, 'Project name is required'),
  project_type_id: z.number().optional().nullable(),
  customer_id: z.number().optional().nullable(),
  source_quotation_id: z.number().optional().nullable(),
  project_address: z.string().optional(),
  client_name: z.string().optional(),
  client_code: z.string().optional(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  budget: z.number().optional(),
  budget_amount: z.number().optional(),
  description: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius_meters: z.number().int().positive().default(500),
  project_date: z.string().optional(),
  currency_id: z.number().optional().nullable(),
  community_id: z.number().optional().nullable(),
  nationality_id: z.number().optional().nullable(),
  country_id: z.number().optional().nullable(),
  contact_email: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled', 'inactive']).default('draft'),
  note: z.string().optional(),
  wbs_allocations: z.array(wbsAllocationSchema).optional(),
});

export const updateProjectSchema = z.object({
  project_name: z.string().min(2).optional(),
  project_type_id: z.number().optional().nullable(),
  customer_id: z.number().optional().nullable(),
  source_quotation_id: z.number().optional().nullable(),
  project_address: z.string().optional(),
  client_name: z.string().optional(),
  client_code: z.string().optional(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  budget: z.number().optional(),
  budget_amount: z.number().optional(),
  description: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius_meters: z.number().int().positive().optional(),
  project_date: z.string().optional(),
  currency_id: z.number().optional().nullable(),
  community_id: z.number().optional().nullable(),
  nationality_id: z.number().optional().nullable(),
  country_id: z.number().optional().nullable(),
  contact_email: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled', 'inactive']).optional(),
  note: z.string().optional(),
  wbs_allocations: z.array(wbsAllocationSchema).optional(),
});

export const updateProjectStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled', 'inactive'], {
    errorMap: () => ({ message: 'Invalid status. Must be draft, active, on_hold, completed, cancelled, or inactive.' })
  })
});
