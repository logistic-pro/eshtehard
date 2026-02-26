import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';

const vehicleSchema = z.object({
  driverId: z.string().uuid(),
  plate: z.string().min(5),
  vehicleType: z.enum(['TRAILER', 'TRUCK', 'PICKUP', 'VAN', 'REFRIGERATED', 'TANKER', 'FLATBED']),
  ownership: z.enum(['OWNED', 'LEASED']).default('OWNED'),
  model: z.string().optional(),
  year: z.number().int().optional(),
});

export async function listVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { driverId, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = { isActive: true };
    if (driverId) where.driverId = driverId;

    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { driver: { include: { user: { select: { name: true, phone: true } } } } },
      }),
      prisma.vehicle.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

export async function createVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = vehicleSchema.parse(req.body);
    const vehicle = await prisma.vehicle.create({ data, include: { driver: { include: { user: true } } } });
    res.status(201).json(vehicle);
  } catch (err) { next(err); }
}

export async function getVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const v = await prisma.vehicle.findUnique({ where: { id: req.params.id }, include: { driver: { include: { user: true } } } });
    if (!v) { res.status(404).json({ message: 'ناوگان یافت نشد' }); return; }
    res.json(v);
  } catch (err) { next(err); }
}

export async function updateVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = vehicleSchema.partial().parse(req.body);
    const v = await prisma.vehicle.update({ where: { id: req.params.id }, data });
    res.json(v);
  } catch (err) { next(err); }
}

export async function deleteVehicle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.vehicle.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'ناوگان غیرفعال شد' });
  } catch (err) { next(err); }
}
