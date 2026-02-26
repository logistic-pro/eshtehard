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

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.params.id === req.user.userId) {
      res.status(400).json({ message: 'نمی‌توانید حساب خودتان را حذف کنید' }); return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { driverProfile: true, freightProfile: true, producerProfile: true },
    });
    if (!user) { res.status(404).json({ message: 'کاربر یافت نشد' }); return; }

    await prisma.$transaction(async (tx) => {
      // --- DRIVER: delete vehicles + appointments + their waybills ---
      if (user.driverProfile) {
        const driverAppts = await tx.appointment.findMany({
          where: { driverId: user.driverProfile.id }, select: { id: true },
        });
        if (driverAppts.length) {
          await tx.waybill.deleteMany({ where: { appointmentId: { in: driverAppts.map(a => a.id) } } });
          await tx.appointment.deleteMany({ where: { driverId: user.driverProfile.id } });
        }
        await tx.vehicle.deleteMany({ where: { driverId: user.driverProfile.id } });
      }

      // --- FREIGHT: delete appointments/waybills/announcements; nullify cargo freightId ---
      if (user.freightProfile) {
        const freightAppts = await tx.appointment.findMany({
          where: { freightId: user.freightProfile.id }, select: { id: true },
        });
        if (freightAppts.length) {
          await tx.waybill.deleteMany({ where: { appointmentId: { in: freightAppts.map(a => a.id) } } });
          await tx.appointment.deleteMany({ where: { freightId: user.freightProfile.id } });
        }
        await tx.hallAnnouncement.deleteMany({ where: { freightId: user.freightProfile.id } });
        await tx.cargo.updateMany({
          where: { freightId: user.freightProfile.id },
          data: { freightId: null, status: 'SUBMITTED' },
        });
      }

      // --- PRODUCER: delete all cargo + related records ---
      if (user.producerProfile) {
        const producerCargo = await tx.cargo.findMany({
          where: { producerId: user.producerProfile.id }, select: { id: true },
        });
        if (producerCargo.length) {
          const cargoIds = producerCargo.map(c => c.id);
          const cargoAppts = await tx.appointment.findMany({
            where: { cargoId: { in: cargoIds } }, select: { id: true },
          });
          if (cargoAppts.length) {
            await tx.waybill.deleteMany({ where: { appointmentId: { in: cargoAppts.map(a => a.id) } } });
            await tx.appointment.deleteMany({ where: { cargoId: { in: cargoIds } } });
          }
          await tx.hallAnnouncement.deleteMany({ where: { cargoId: { in: cargoIds } } });
          await tx.cargoStatusHistory.deleteMany({ where: { cargoId: { in: cargoIds } } });
          await tx.cargo.deleteMany({ where: { producerId: user.producerProfile.id } });
        }
      }

      // --- Tickets and messages ---
      const userTickets = await tx.ticket.findMany({
        where: { creatorId: req.params.id }, select: { id: true },
      });
      if (userTickets.length) {
        await tx.ticketMessage.deleteMany({ where: { ticketId: { in: userTickets.map(t => t.id) } } });
        await tx.ticket.deleteMany({ where: { creatorId: req.params.id } });
      }
      await tx.ticketMessage.deleteMany({ where: { senderId: req.params.id } });

      // --- Nullify optional audit log references ---
      await tx.auditLog.updateMany({ where: { userId: req.params.id }, data: { userId: null } });

      // --- Delete user (cascade: refreshTokens, notifications, profiles) ---
      await tx.user.delete({ where: { id: req.params.id } });
    });

    res.json({ message: 'کاربر حذف شد' });
  } catch (err) { next(err); }
}
