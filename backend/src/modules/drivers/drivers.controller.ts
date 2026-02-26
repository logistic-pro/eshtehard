import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { z } from 'zod';

const driverSchema = z.object({
  phone: z.string().regex(/^09[0-9]{9}$/),
  name: z.string().min(2),
  nationalCode: z.string().length(10).optional(),
  licenseNumber: z.string().optional(),
  homeProvince: z.string().optional(),
  homeCity: z.string().optional(),
  // vehicle fields (merged)
  plate: z.string().optional(),
  vehicleType: z.enum(['TRAILER','TRUCK','PICKUP','VAN','REFRIGERATED','TANKER','FLATBED']).optional(),
  ownership: z.enum(['OWNED','LEASED']).default('OWNED'),
  vehicleModel: z.string().optional(),
});

export async function listDrivers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let freightId: string | undefined;
    if (req.user.role === 'FREIGHT_COMPANY') {
      const freight = await prisma.freightCompanyProfile.findUnique({ where: { userId: req.user.userId } });
      freightId = freight?.id;
    }

    const where: Record<string, unknown> = {};
    if (freightId) where.freightCompanyId = freightId;
    if (search) {
      where.user = { OR: [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] };
    }

    const [items, total] = await Promise.all([
      prisma.driverProfile.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, phone: true, isActive: true, status: true } }, vehicles: true, freightCompany: { select: { companyName: true } }, },
        // cancelBanUntil is a direct field on DriverProfile, automatically included
      }),
      prisma.driverProfile.count({ where }),
    ]);
    res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

export async function createDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = driverSchema.parse(req.body);
    const freight = req.user.role === 'FREIGHT_COMPANY'
      ? await prisma.freightCompanyProfile.findUnique({ where: { userId: req.user.userId } })
      : null;

    // Create or find user — auto-approve since they're added directly by a company
    let user = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (!user) {
      user = await prisma.user.create({ data: { phone: data.phone, name: data.name, role: 'DRIVER', status: 'APPROVED' } });
    } else {
      // If user exists but is pending, approve them now
      if (user.status === 'PENDING') {
        user = await prisma.user.update({ where: { id: user.id }, data: { status: 'APPROVED', role: 'DRIVER' } });
      }
    }

    const existing = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
    if (existing) { res.status(400).json({ message: 'پروفایل راننده از قبل وجود دارد' }); return; }

    const driver = await prisma.driverProfile.create({
      data: {
        userId: user.id,
        licenseNumber: data.licenseNumber,
        homeProvince: data.homeProvince,
        homeCity: data.homeCity,
        freightCompanyId: freight?.id,
      },
      include: { user: true, vehicles: true },
    });

    // Create vehicle if plate provided
    if (data.plate && data.vehicleType) {
      await prisma.vehicle.create({
        data: {
          driverId: driver.id,
          plate: data.plate,
          vehicleType: data.vehicleType,
          ownership: data.ownership,
          model: data.vehicleModel,
        },
      }).catch(() => null);
    }

    res.status(201).json(driver);
  } catch (err) { next(err); }
}

export async function getDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const driver = await prisma.driverProfile.findUnique({
      where: { id: req.params.id },
      include: { user: true, vehicles: true, appointments: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
    if (!driver) { res.status(404).json({ message: 'راننده یافت نشد' }); return; }
    res.json(driver);
  } catch (err) { next(err); }
}

export async function updateDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      licenseNumber: z.string().optional(),
      licenseExpiry: z.string().datetime().optional(),
      homeProvince: z.string().optional(),
      homeCity: z.string().optional(),
      isVerified: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const driver = await prisma.driverProfile.update({
      where: { id: req.params.id },
      data: { ...data, licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined },
    });
    res.json(driver);
  } catch (err) { next(err); }
}
