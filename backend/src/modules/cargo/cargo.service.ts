import { CargoStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { sendSms } from '../../config/sms';

const STATUS_TRANSITIONS: Record<CargoStatus, CargoStatus[]> = {
  DRAFT:               ['SUBMITTED', 'CANCELLED'],
  SUBMITTED:           ['ACCEPTED_BY_FREIGHT', 'CANCELLED'],
  ACCEPTED_BY_FREIGHT: ['ANNOUNCED_TO_HALL', 'CANCELLED'],
  ANNOUNCED_TO_HALL:   ['DRIVER_ASSIGNED', 'CANCELLED'],
  DRIVER_ASSIGNED:     ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT:          ['DELIVERED'],
  DELIVERED:           [],
  CANCELLED:           [],
};

export class CargoService {
  async create(producerId: string, data: Prisma.CargoUncheckedCreateInput & { truckCount?: number; loadingDateTime?: string }, userId: string) {
    const { truckCount = 1, loadingDateTime, ...rest } = data as Record<string, unknown>;
    const count = Number(truckCount) || 1;
    const loadingDate = loadingDateTime ? new Date(loadingDateTime as string) : undefined;

    const created = [];
    for (let i = 0; i < count; i++) {
      const cargo = await prisma.cargo.create({
        data: { ...(rest as Prisma.CargoUncheckedCreateInput), producerId, status: 'DRAFT', truckCount: 1, loadingDateTime: loadingDate },
      });
      await this.recordHistory(cargo.id, null, 'DRAFT', userId, 'ایجاد بار');
      created.push(cargo);
    }
    return count === 1 ? created[0] : created;
  }

  async submit(cargoId: string, userId: string) {
    return this.transition(cargoId, 'SUBMITTED', userId, 'ارسال به باربری');
  }

  async accept(cargoId: string, freightUserId: string) {
    const freight = await prisma.freightCompanyProfile.findUnique({ where: { userId: freightUserId } });
    if (!freight) throw new Error('پروفایل باربری یافت نشد');

    const cargo = await prisma.cargo.findUnique({ where: { id: cargoId } });
    if (!cargo) throw new Error('بار یافت نشد');
    if (cargo.status !== 'SUBMITTED') throw new Error('وضعیت بار معتبر نیست');

    const updated = await prisma.cargo.update({
      where: { id: cargoId },
      data: { status: 'ACCEPTED_BY_FREIGHT', freightId: freight.id },
    });
    await this.recordHistory(cargoId, 'SUBMITTED', 'ACCEPTED_BY_FREIGHT', freightUserId, 'پذیرش توسط باربری');

    // Notify producer
    const producer = await prisma.producerProfile.findUnique({
      where: { id: cargo.producerId },
      include: { user: true },
    });
    if (producer?.user.phone) {
      await sendSms(producer.user.phone, `بار شما با کد ${cargo.referenceCode} توسط باربری پذیرفته شد.`);
    }
    return updated;
  }

  async setFare(cargoId: string, fare: number, freightUserId: string) {
    const freight = await prisma.freightCompanyProfile.findUnique({ where: { userId: freightUserId } });
    if (!freight) throw new Error('پروفایل باربری یافت نشد');

    return prisma.cargo.update({
      where: { id: cargoId, freightId: freight.id },
      data: { fare },
    });
  }

  async cancel(cargoId: string, userId: string, note?: string) {
    return this.transition(cargoId, 'CANCELLED', userId, note ?? 'لغو شد');
  }

  async rejectWithNote(cargoId: string, userId: string, note?: string) {
    await prisma.cargo.update({ where: { id: cargoId }, data: { rejectionNote: note ?? null } });
    return this.transition(cargoId, 'CANCELLED', userId, note ?? 'رد شد');
  }

  async setStatus(cargoId: string, to: CargoStatus, freightUserId: string, note?: string) {
    const freight = await prisma.freightCompanyProfile.findUnique({ where: { userId: freightUserId } });
    if (!freight) throw new Error('پروفایل باربری یافت نشد');
    const cargo = await prisma.cargo.findUnique({ where: { id: cargoId } });
    if (!cargo) throw new Error('بار یافت نشد');
    if (cargo.freightId !== freight.id) throw new Error('این بار متعلق به باربری شما نیست');
    return this.transition(cargoId, to, freightUserId, note ?? `تغییر وضعیت به ${to}`);
  }

  async findById(id: string) {
    return prisma.cargo.findUnique({
      where: { id },
      include: {
        producer: { include: { user: { select: { name: true, phone: true } } } },
        freight: { include: { user: { select: { name: true, phone: true } } } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        announcements: { include: { hall: true } },
        appointments: { include: { driver: { include: { user: { select: { name: true, phone: true } } } } } },
      },
    });
  }

  async listForProducer(producerUserId: string, filters: Record<string, string>) {
    const producer = await prisma.producerProfile.findUnique({ where: { userId: producerUserId } });
    if (!producer) throw new Error('پروفایل تولیدکننده یافت نشد');
    return this.list({ producerId: producer.id, ...filters });
  }

  async listForFreight(freightUserId: string, filters: Record<string, string>) {
    const freight = await prisma.freightCompanyProfile.findUnique({ where: { userId: freightUserId } });
    // Show submitted (available) + own accepted
    const where: Prisma.CargoWhereInput = {
      OR: [
        { status: 'SUBMITTED' },
        { freightId: freight?.id ?? '' },
      ],
    };
    return this.list({ ...filters }, where);
  }

  async listForDriver(filters: Record<string, string>) {
    const where: Prisma.CargoWhereInput = {
      status: { in: ['ANNOUNCED_TO_HALL', 'DRIVER_ASSIGNED'] },
    };
    if (filters.province) {
      where.originProvince = { contains: filters.province, mode: 'insensitive' };
    }
    return this.list(filters, where);
  }

  async listAll(filters: Record<string, string>) {
    return this.list(filters);
  }

  // Returns PENDING appointments for a cargo, each enriched with driver priority rank
  async getDriverRequestsWithPriority(cargoId: string) {
    const appointments = await prisma.appointment.findMany({
      where: { cargoId, status: 'PENDING' },
      include: {
        driver: { include: { user: { select: { name: true, phone: true } }, vehicles: { take: 1 } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get total driver count
    const totalDrivers = await prisma.driverProfile.count();

    // For each driver, find last delivered appointment date
    const enriched = await Promise.all(appointments.map(async (appt) => {
      const lastDelivered = await prisma.appointment.findFirst({
        where: { driverId: appt.driverId, status: 'CONFIRMED', id: { not: appt.id } },
        orderBy: { appointmentDate: 'desc' },
        select: { appointmentDate: true },
      });
      const daysSinceLast = lastDelivered?.appointmentDate
        ? Math.floor((Date.now() - new Date(lastDelivered.appointmentDate).getTime()) / 86400000)
        : 99999;
      return { ...appt, daysSinceLast, totalDrivers };
    }));

    // Sort by daysSinceLast desc (longer wait = higher priority)
    enriched.sort((a, b) => b.daysSinceLast - a.daysSinceLast);

    return enriched.map((e, i) => ({ ...e, priorityRank: i + 1 }));
  }

  private async list(filters: Record<string, string>, extraWhere?: Prisma.CargoWhereInput) {
    const { status, province, page = '1', limit = '20' } = filters;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Prisma.CargoWhereInput = { ...extraWhere };
    if (status) where.status = status as CargoStatus;
    if (province) where.originProvince = { contains: province, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.cargo.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          producer: { include: { user: { select: { name: true } } } },
          freight: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.cargo.count({ where }),
    ]);
    return { items, total, page: parseInt(page), limit: parseInt(limit) };
  }

  private async transition(
    cargoId: string,
    to: CargoStatus,
    userId: string,
    note: string
  ) {
    const cargo = await prisma.cargo.findUnique({ where: { id: cargoId } });
    if (!cargo) throw new Error('بار یافت نشد');

    const allowed = STATUS_TRANSITIONS[cargo.status];
    if (!allowed.includes(to)) {
      throw new Error(`انتقال از ${cargo.status} به ${to} مجاز نیست`);
    }

    const updated = await prisma.cargo.update({
      where: { id: cargoId },
      data: { status: to },
    });
    await this.recordHistory(cargoId, cargo.status, to, userId, note);
    return updated;
  }

  private async recordHistory(
    cargoId: string,
    from: CargoStatus | null,
    to: CargoStatus,
    changedBy: string,
    note: string
  ) {
    await prisma.cargoStatusHistory.create({
      data: { cargoId, fromStatus: from ?? undefined, toStatus: to, changedBy, note },
    });
    await prisma.auditLog.create({
      data: { userId: changedBy, action: `CARGO_${to}`, entityType: 'Cargo', entityId: cargoId, meta: { note } },
    });
  }
}
