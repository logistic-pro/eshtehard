/**
 * Run on server: docker exec eshtehard_backend npx ts-node prisma/clear-cargo.ts
 * OR after build: docker exec eshtehard_backend node -e "
 *   const { PrismaClient } = require('@prisma/client');
 *   const prisma = new PrismaClient();
 *   prisma.$transaction([
 *     prisma.waybill.deleteMany(),
 *     prisma.appointment.deleteMany(),
 *     prisma.hallAnnouncement.deleteMany(),
 *     prisma.cargoStatusHistory.deleteMany(),
 *     prisma.cargo.deleteMany(),
 *   ]).then(() => { console.log('done'); process.exit(0); })
 *   .catch(e => { console.error(e); process.exit(1); });
 * "
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing cargo data...');
  const [w, a, ha, csh, c] = await prisma.$transaction([
    prisma.waybill.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.hallAnnouncement.deleteMany(),
    prisma.cargoStatusHistory.deleteMany(),
    prisma.cargo.deleteMany(),
  ]);
  console.log(`Deleted: ${w.count} waybills, ${a.count} appointments, ${ha.count} announcements, ${csh.count} status history, ${c.count} cargo`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
