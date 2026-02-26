const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const terminal = await prisma.terminal.upsert({
    where: { id: 'seed-terminal-1' },
    update: {},
    create: { id: 'seed-terminal-1', name: 'پایانه بار اشتهارد', province: 'البرز', city: 'اشتهارد', address: 'جاده اشتهارد' },
  });
  console.log('✓ Terminal created');

  for (const name of ['سالن اصلی', 'سالن شمال', 'سالن جنوب']) {
    await prisma.hall.create({ data: { terminalId: terminal.id, name, province: 'البرز', shift: 'صبح', capacity: 100 } }).catch(() => null);
  }
  console.log('✓ Halls created');

  const adminUser = await prisma.user.upsert({
    where: { phone: '09120644653' }, update: {},
    create: { phone: '09120644653', name: 'مدیر سیستم', role: 'TERMINAL_ADMIN', status: 'APPROVED' },
  });
  await prisma.terminalAdminProfile.upsert({
    where: { userId: adminUser.id }, update: {},
    create: { userId: adminUser.id, terminalId: terminal.id },
  });
  console.log('✓ Admin user: 09120644653');

  const freightUser = await prisma.user.upsert({
    where: { phone: '09111111111' }, update: {},
    create: { phone: '09111111111', name: 'شرکت باربری نمونه', role: 'FREIGHT_COMPANY', status: 'APPROVED' },
  });
  await prisma.freightCompanyProfile.upsert({
    where: { userId: freightUser.id }, update: {},
    create: { userId: freightUser.id, companyName: 'شرکت باربری نمونه', province: 'البرز', city: 'اشتهارد' },
  });
  console.log('✓ Freight user: 09111111111');

  const producerUser = await prisma.user.upsert({
    where: { phone: '09222222222' }, update: {},
    create: { phone: '09222222222', name: 'شرکت تولیدی آلفا', role: 'PRODUCER', status: 'APPROVED' },
  });
  await prisma.producerProfile.upsert({
    where: { userId: producerUser.id }, update: {},
    create: { userId: producerUser.id, companyName: 'شرکت تولیدی آلفا', province: 'البرز', city: 'اشتهارد' },
  });
  console.log('✓ Producer user: 09222222222');

  const driverUser = await prisma.user.upsert({
    where: { phone: '09333333333' }, update: {},
    create: { phone: '09333333333', name: 'علی رانندگان', role: 'DRIVER', status: 'APPROVED' },
  });
  const driverProfile = await prisma.driverProfile.upsert({
    where: { userId: driverUser.id }, update: {},
    create: { userId: driverUser.id, homeProvince: 'البرز', homeCity: 'اشتهارد' },
  });
  await prisma.vehicle.create({
    data: { driverId: driverProfile.id, plate: '۱۲ب۳۴۵الف', vehicleType: 'TRUCK', ownership: 'OWNED' },
  }).catch(() => null);
  console.log('✓ Driver user: 09333333333');

  console.log('\n✅ Seed complete!');
  console.log('📱 Login with any number above — OTP will be printed to console in dev mode');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
