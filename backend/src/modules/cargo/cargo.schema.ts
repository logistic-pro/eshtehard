import { z } from 'zod';

export const createCargoSchema = z.object({
  originProvince: z.string().min(2),
  originCity: z.string().min(2),
  destProvince: z.string().min(2),
  destCity: z.string().min(2),
  cargoType: z.string().min(2),
  weight: z.number().positive(),
  unit: z.string().default('تن'),
  description: z.string().optional(),
  isUrgent: z.boolean().default(false),
  loadingDateTime: z.string().optional(),
  truckCount: z.number().int().min(1).max(50).default(1),
});

export const updateFareSchema = z.object({
  fare: z.number().positive(),
});

export type CreateCargoDto = z.infer<typeof createCargoSchema>;
export type UpdateFareDto = z.infer<typeof updateFareSchema>;
