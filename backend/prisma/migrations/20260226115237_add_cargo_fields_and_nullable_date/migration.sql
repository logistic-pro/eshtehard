-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "appointmentDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "cargo" ADD COLUMN     "loadingDateTime" TIMESTAMP(3),
ADD COLUMN     "rejectionNote" TEXT,
ADD COLUMN     "truckCount" INTEGER NOT NULL DEFAULT 1;
