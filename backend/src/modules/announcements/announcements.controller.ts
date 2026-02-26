import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';

const createSchema = z.object({
  cargoId: z.string().uuid(),
  hallId: z.string().uuid(),
  expiresAt: z.string().datetime().optional(),
});

export async function createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createSchema.parse(req.body);
    const freight = await prisma.freightCompanyProfile.findUnique({ where: { userId: req.user.userId } });
    if (!freight) { res.status(404).json({ message: 'پروفایل باربری یافت نشد' }); return; }

    // Validate cargo belongs to this freight and has fare set
    const cargo = await prisma.cargo.findUnique({ where: { id: data.cargoId } });
    if (!cargo) { res.status(404).json({ message: 'بار یافت نشد' }); return; }
    if (cargo.freightId !== freight.id) { res.status(403).json({ message: 'این بار متعلق به شما نیست' }); return; }
    if (!cargo.fare) { res.status(400).json({ message: 'قبل از ارسال به سالن باید کرایه بار مشخص شود' }); return; }
    if (cargo.status !== 'ACCEPTED_BY_FREIGHT') { res.status(400).json({ message: 'وضعیت بار برای ارسال به سالن معتبر نیست' }); return; }

    const announcement = await prisma.hallAnnouncement.create({
      data: {
        cargoId: data.cargoId,
        hallId: data.hallId,
        freightId: freight.id,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
      include: { cargo: true, hall: { include: { terminal: true } } },
    });

    // Update cargo status
    await prisma.cargo.update({ where: { id: data.cargoId }, data: { status: 'ANNOUNCED_TO_HALL' } });
    await prisma.cargoStatusHistory.create({
      data: {
        cargoId: data.cargoId,
        fromStatus: 'ACCEPTED_BY_FREIGHT',
        toStatus: 'ANNOUNCED_TO_HALL',
        changedBy: req.user.userId,
        note: `اعلان در سالن ${announcement.hall.name}`,
      },
    });

    res.status(201).json(announcement);
  } catch (err) { next(err); }
}

export async function listAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { hallId, province, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    // Only show announcements where cargo is still active (not delivered/assigned/cancelled)
    const where: Record<string, unknown> = {
      isSuspended: false,
      cargo: { status: 'ANNOUNCED_TO_HALL' },
    };
    if (hallId) where.hallId = hallId;
    if (province) where.hall = { province: { contains: province, mode: 'insensitive' } };

    const [items, total] = await Promise.all([
      prisma.hallAnnouncement.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          cargo: { select: { referenceCode: true, cargoType: true, weight: true, originProvince: true, destProvince: true, fare: true } },
          hall: { include: { terminal: true } },
          freight: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.hallAnnouncement.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

export async function suspendAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({ note: z.string().optional() });
    const { note } = schema.parse(req.body);
    const ann = await prisma.hallAnnouncement.update({
      where: { id: req.params.id },
      data: { isSuspended: true, suspendNote: note },
    });
    res.json(ann);
  } catch (err) { next(err); }
}

export async function resumeAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ann = await prisma.hallAnnouncement.update({
      where: { id: req.params.id },
      data: { isSuspended: false, suspendNote: null },
    });
    res.json(ann);
  } catch (err) { next(err); }
}
