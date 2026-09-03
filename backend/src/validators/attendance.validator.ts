import { z } from 'zod';

export const checkInSchema = z.object({
  task_id: z.number().int().positive().optional(),
  employee_id: z.number().int().positive().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
});

export const checkOutSchema = z.object({
  attendance_id: z.number().int().positive('Attendance ID is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  address: z.string().optional(),
});
