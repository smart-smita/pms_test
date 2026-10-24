import { z } from 'zod';

const preprocessNumber = (defaultVal: number | undefined = undefined) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return defaultVal;
    const num = Number(val);
    return isNaN(num) ? defaultVal : num;
  }, defaultVal === undefined ? z.number().optional().nullable() : z.number().default(defaultVal).nullable());

const wbsAllocationSchema = z.object({
  id: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'number') return val > 1000000000000 ? undefined : val;
    const num = Number(val);
    return isNaN(num) || num > 1000000000000 ? undefined : num;
  }, z.number().optional().nullable()),
  wbs_id: preprocessNumber(),
  wbs_code: z.string().optional().nullable(),
  wbs_name: z.string().optional().nullable(),
  wbs_type: z.enum(['labour', 'material', 'both']).optional().nullable(),
  unit: z.string().optional().nullable(),
  planned_quantity: preprocessNumber(0),
  rate: preprocessNumber(0),
  budget_amount: preprocessNumber(0),
  planned_labour_cost: preprocessNumber(0),
  planned_material_cost: preprocessNumber(0),
  quotation_discipline_id: preprocessNumber(),
  wbs_template_id: preprocessNumber(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  total_hours: preprocessNumber(0),
  note: z.string().optional().nullable(),
  is_custom: z.any().optional().nullable()
});

export const createProjectSchema = z.object({
  project_code: z.string().min(2, 'Project code must be at least 2 characters'),
  project_name: z.string().min(1, 'Project name is required'),
  project_type_id: preprocessNumber(),
  customer_id: preprocessNumber(),
  source_quotation_id: preprocessNumber(),
  quotation_reference: z.string().optional().nullable(),
  project_address: z.string().optional().nullable(),
  client_name: z.string().optional().nullable(),
  client_code: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  budget: preprocessNumber(),
  budget_amount: preprocessNumber(0),
  description: z.string().optional().nullable(),
  latitude: preprocessNumber(),
  longitude: preprocessNumber(),
  radius_meters: preprocessNumber(500),
  project_date: z.string().optional().nullable(),
  currency_id: preprocessNumber(1),
  exchange_rate: preprocessNumber(1),
  community_id: preprocessNumber(),
  nationality_id: preprocessNumber(),
  country_id: preprocessNumber(),
  contact_email: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled', 'inactive']).default('active'),
  note: z.string().optional().nullable(),
  wbs_allocations: z.array(wbsAllocationSchema).optional().nullable(),
  taxes: z.array(z.any()).optional().nullable(),
});

export const updateProjectSchema = z.object({
  project_code: z.string().optional().nullable(),
  project_name: z.string().min(1).optional(),
  project_type_id: preprocessNumber(),
  customer_id: preprocessNumber(),
  source_quotation_id: preprocessNumber(),
  quotation_reference: z.string().optional().nullable(),
  project_address: z.string().optional().nullable(),
  client_name: z.string().optional().nullable(),
  client_code: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  budget: preprocessNumber(),
  budget_amount: preprocessNumber(0),
  description: z.string().optional().nullable(),
  latitude: preprocessNumber(),
  longitude: preprocessNumber(),
  radius_meters: preprocessNumber(500),
  project_date: z.string().optional().nullable(),
  currency_id: preprocessNumber(1),
  exchange_rate: preprocessNumber(1),
  community_id: preprocessNumber(),
  nationality_id: preprocessNumber(),
  country_id: preprocessNumber(),
  contact_email: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled', 'inactive']).optional(),
  note: z.string().optional().nullable(),
  wbs_allocations: z.array(wbsAllocationSchema).optional().nullable(),
  taxes: z.array(z.any()).optional().nullable(),
});

export const updateProjectStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'on_hold', 'completed', 'cancelled', 'inactive'], {
    errorMap: () => ({ message: 'Invalid status. Must be draft, active, on_hold, completed, cancelled, or inactive.' })
  })
});
