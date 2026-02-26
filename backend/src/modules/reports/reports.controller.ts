import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';

export async function cargoSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const byStatus = await prisma.cargo.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    const byProvince = await prisma.cargo.groupBy({
      by: ['originProvince'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
    const total = await prisma.cargo.count();
    res.json({ byStatus, byProvince, total });
  } catch (err) { next(err); }
}

export async function driverPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit = '10' } = req.query as Record<string, string>;
    const stats = await prisma.appointment.groupBy({
      by: ['driverId'],
      _count: { id: true },
      where: { status: 'COMPLETED' },
      orderBy: { _count: { id: 'desc' } },
      take: parseInt(limit),
    });
    const driverIds = stats.map(s => s.driverId);
    const drivers = await prisma.driverProfile.findMany({
      where: { id: { in: driverIds } },
      include: { user: { select: { name: true, phone: true } } },
    });
    const result = stats.map(s => ({
      ...s,
      driver: drivers.find(d => d.id === s.driverId),
    }));
    res.json(result);
  } catch (err) { next(err); }
}

export async function hallActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await prisma.hallAnnouncement.groupBy({
      by: ['hallId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const hallIds = stats.map(s => s.hallId);
    const halls = await prisma.hall.findMany({
      where: { id: { in: hallIds } },
      include: { terminal: { select: { name: true } } },
    });
    const result = stats.map(s => ({
      ...s,
      hall: halls.find(h => h.id === s.hallId),
    }));
    res.json(result);
  } catch (err) { next(err); }
}

export async function producerStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { producerId } = req.query as Record<string, string>;

    if (producerId) {
      const byStatus = await prisma.cargo.groupBy({
        by: ['status'],
        where: { producerId },
        _count: { id: true },
      });
      const total = await prisma.cargo.count({ where: { producerId } });
      res.json({ byStatus, total }); return;
    }

    const producers = await prisma.producerProfile.findMany({
      include: { user: { select: { name: true, phone: true, isActive: true, status: true } } },
    });

    const result = await Promise.all(producers.map(async (p) => {
      const [total, submitted, delivered, cancelled] = await Promise.all([
        prisma.cargo.count({ where: { producerId: p.id } }),
        prisma.cargo.count({ where: { producerId: p.id, status: 'SUBMITTED' } }),
        prisma.cargo.count({ where: { producerId: p.id, status: 'DELIVERED' } }),
        prisma.cargo.count({ where: { producerId: p.id, status: 'CANCELLED' } }),
      ]);
      return { ...p, total, submitted, delivered, cancelled };
    }));

    res.json(result);
  } catch (err) { next(err); }
}

export async function freightStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { freightId } = req.query as Record<string, string>;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // If freightId provided → return stats for that company
    if (freightId) {
      const [deliveredLastMonth, deliveredLastWeek, inTransit, total] = await Promise.all([
        prisma.cargo.count({ where: { freightId, status: 'DELIVERED', updatedAt: { gte: monthAgo } } }),
        prisma.cargo.count({ where: { freightId, status: 'DELIVERED', updatedAt: { gte: weekAgo } } }),
        prisma.cargo.count({ where: { freightId, status: 'IN_TRANSIT' } }),
        prisma.cargo.count({ where: { freightId } }),
      ]);
      res.json({ deliveredLastMonth, deliveredLastWeek, inTransit, total }); return;
    }

    // Otherwise: stats per company (for freight monitor)
    const companies = await prisma.freightCompanyProfile.findMany({
      include: { user: { select: { name: true, phone: true, isActive: true, status: true } } },
    });

    const result = await Promise.all(companies.map(async (f) => {
      const [deliveredLastWeek, deliveredLastMonth, activeCount] = await Promise.all([
        prisma.cargo.count({ where: { freightId: f.id, status: 'DELIVERED', updatedAt: { gte: weekAgo } } }),
        prisma.cargo.count({ where: { freightId: f.id, status: 'DELIVERED', updatedAt: { gte: monthAgo } } }),
        prisma.cargo.count({ where: { freightId: f.id, status: { in: ['ACCEPTED_BY_FREIGHT', 'ANNOUNCED_TO_HALL', 'DRIVER_ASSIGNED', 'IN_TRANSIT'] } } }),
      ]);
      return { ...f, deliveredLastWeek, deliveredLastMonth, activeCount };
    }));

    res.json(result);
  } catch (err) { next(err); }
}

export async function dashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totalCargo, totalDrivers, totalFreight, pendingCargo, activeAppointments] = await Promise.all([
      prisma.cargo.count(),
      prisma.driverProfile.count(),
      prisma.freightCompanyProfile.count(),
      prisma.cargo.count({ where: { status: 'SUBMITTED' } }),
      prisma.appointment.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
    ]);
    res.json({ totalCargo, totalDrivers, totalFreight, pendingCargo, activeAppointments });
  } catch (err) { next(err); }
}
