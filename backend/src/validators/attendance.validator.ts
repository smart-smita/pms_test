import { z } from 'zod';

export const checkInSchema = z.object({
  task_id: z.number().int().positive().optional(),
  latitude: z.number({ required_error: 'Latitude is required' }),
  longitude: z.number({ required_error: 'Longitude is required' }),
  address: z.string().optional(),
});

export const checkOutSchema = z.object({
  attendance_id: z.number().int().positive('Attendance ID is required'),
  latitude: z.number({ required_error: 'Latitude is required' }),
  longitude: z.number({ required_error: 'Longitude is required' }),
  address: z.string().optional(),
});
