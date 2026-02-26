import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';

const hallSchema = z.object({
  terminalId: z.string().uuid(),
  name: z.string().min(2),
  province: z.string().min(2),
  shift: z.string().optional(),
  capacity: z.number().int().positive().default(100),
});

export async function listHalls(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { province, terminalId } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { isActive: true };
    if (province) where.province = { contains: province, mode: 'insensitive' };
    if (terminalId) where.terminalId = terminalId;

    const halls = await prisma.hall.findMany({
      where,
      include: { terminal: { select: { id: true, name: true, province: true, city: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(halls);
  } catch (err) { next(err); }
}

export async function getHall(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hall = await prisma.hall.findUnique({
      where: { id: req.params.id },
      include: { terminal: true },
    });
    if (!hall) { res.status(404).json({ message: 'سالن یافت نشد' }); return; }
    res.json(hall);
  } catch (err) { next(err); }
}

export async function createHall(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = hallSchema.parse(req.body);
    const hall = await prisma.hall.create({ data, include: { terminal: true } });
    res.status(201).json(hall);
  } catch (err) { next(err); }
}

export async function updateHall(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = hallSchema.partial().parse(req.body);
    const hall = await prisma.hall.update({ where: { id: req.params.id }, data });
    res.json(hall);
  } catch (err) { next(err); }
}

export async function deleteHall(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.hall.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'سالن غیرفعال شد' });
  } catch (err) { next(err); }
}
