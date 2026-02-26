import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        driverProfile: true,
        freightProfile: true,
        producerProfile: true,
        terminalAdminProfile: { include: { terminal: true } },
      },
    });
    if (!user) { res.status(404).json({ message: 'کاربر یافت نشد' }); return; }
    res.json(user);
  } catch (err) { next(err); }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({ name: z.string().min(2).optional(), nationalCode: z.string().length(10).optional() });
    const data = schema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user.userId }, data });
    res.json(user);
  } catch (err) { next(err); }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, status, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { driverProfile: true, freightProfile: true, producerProfile: true },
    });
    if (!user) { res.status(404).json({ message: 'کاربر یافت نشد' }); return; }
    res.json(user);
  } catch (err) { next(err); }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      phone: z.string().regex(/^09\d{9}$/, 'شماره موبایل معتبر نیست'),
      name: z.string().min(2, 'نام حداقل ۲ کاراکتر'),
      role: z.enum(['DRIVER', 'FREIGHT_COMPANY', 'PRODUCER', 'TERMINAL_ADMIN']),
      status: z.enum(['PENDING', 'APPROVED', 'SUSPENDED']).default('APPROVED'),
    });
    const data = schema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) {
      res.status(409).json({ message: 'این شماره قبلاً ثبت شده است' });
      return;
    }

    const user = await prisma.user.create({ data });
    res.status(201).json(user);
  } catch (err) { next(err); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      name: z.string().min(2).optional(),
      role: z.enum(['DRIVER', 'FREIGHT_COMPANY', 'PRODUCER', 'TERMINAL_ADMIN']).optional(),
      status: z.enum(['PENDING', 'APPROVED', 'SUSPENDED']).optional(),
      isActive: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(user);
  } catch (err) { next(err); }
}
