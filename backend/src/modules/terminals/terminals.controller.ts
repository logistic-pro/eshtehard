import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';

const terminalSchema = z.object({
  name: z.string().min(2),
  province: z.string().min(2),
  city: z.string().min(2),
  address: z.string().optional(),
});

export async function listTerminals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const terminals = await prisma.terminal.findMany({
      where: { isActive: true },
      include: { halls: { where: { isActive: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(terminals);
  } catch (err) { next(err); }
}

export async function getTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const t = await prisma.terminal.findUnique({
      where: { id: req.params.id },
      include: { halls: true },
    });
    if (!t) { res.status(404).json({ message: 'پایانه یافت نشد' }); return; }
    res.json(t);
  } catch (err) { next(err); }
}

export async function createTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = terminalSchema.parse(req.body);
    const terminal = await prisma.terminal.create({ data });
    res.status(201).json(terminal);
  } catch (err) { next(err); }
}

export async function updateTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = terminalSchema.partial().parse(req.body);
    const terminal = await prisma.terminal.update({ where: { id: req.params.id }, data });
    res.json(terminal);
  } catch (err) { next(err); }
}

export async function deleteTerminal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.terminal.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'پایانه غیرفعال شد' });
  } catch (err) { next(err); }
}
