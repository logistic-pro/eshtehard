import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  const terminal = await prisma.terminal.upsert({
    where: { id: 'seed-terminal-1' },
    update: {},
    create: { id: 'seed-terminal-1', name: 'پایانه بار اشتهارد', province: 'البرز', city: 'اشتهارد', address: 'جاده اشتهارد' },
  });

  for (const name of ['سالن اصلی', 'سالن شمال', 'سالن جنوب']) {
    await prisma.hall.create({ data: { terminalId: terminal.id, name, province: 'البرز', shift: 'صبح', capacity: 100 } }).catch(() => null);
  }

  const adminUser = await prisma.user.upsert({
    where: { phone: '09000000000' }, update: {},
    create: { phone: '09000000000', name: 'مدیر سیستم', role: 'TERMINAL_ADMIN' },
  });
  await prisma.terminalAdminProfile.upsert({
    where: { userId: adminUser.id }, update: {},
    create: { userId: adminUser.id, terminalId: terminal.id },
  });

  const freightUser = await prisma.user.upsert({
    where: { phone: '09111111111' }, update: {},
    create: { phone: '09111111111', name: 'شرکت باربری نمونه', role: 'FREIGHT_COMPANY' },
  });
  await prisma.freightCompanyProfile.upsert({
    where: { userId: freightUser.id }, update: {},
    create: { userId: freightUser.id, companyName: 'شرکت باربری نمونه', province: 'البرز', city: 'اشتهارد' },
  });

  const producerUser = await prisma.user.upsert({
    where: { phone: '09222222222' }, update: {},
    create: { phone: '09222222222', name: 'شرکت تولیدی آلفا', role: 'PRODUCER' },
  });
  await prisma.producerProfile.upsert({
    where: { userId: producerUser.id }, update: {},
    create: { userId: producerUser.id, companyName: 'شرکت تولیدی آلفا', province: 'البرز', city: 'اشتهارد' },
  });

  const driverUser = await prisma.user.upsert({
    where: { phone: '09333333333' }, update: {},
    create: { phone: '09333333333', name: 'علی رانندگان', role: 'DRIVER' },
  });
  const driverProfile = await prisma.driverProfile.upsert({
    where: { userId: driverUser.id }, update: {},
    create: { userId: driverUser.id, homeProvince: 'البرز', homeCity: 'اشتهارد' },
  });
  await prisma.vehicle.create({
    data: { driverId: driverProfile.id, plate: '۱۲ب۳۴۵الف', vehicleType: 'TRUCK', ownership: 'OWNED' },
  }).catch(() => null);

  console.log('✅ Seed complete');
  console.log('📱 Test accounts: 09000000000 (admin) | 09111111111 (freight) | 09222222222 (producer) | 09333333333 (driver)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
