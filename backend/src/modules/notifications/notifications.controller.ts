import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';

export async function listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.userId },
        skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId: req.user.userId } }),
      prisma.notification.count({ where: { userId: req.user.userId, isRead: false } }),
    ]);
    res.json({ items, total, unread, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'همه اعلان‌ها خوانده شد' });
  } catch (err) { next(err); }
}
