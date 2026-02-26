-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DRIVER', 'FREIGHT_COMPANY', 'PRODUCER', 'TERMINAL_ADMIN');

-- CreateEnum
CREATE TYPE "CargoStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ACCEPTED_BY_FREIGHT', 'ANNOUNCED_TO_HALL', 'DRIVER_ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('TRAILER', 'TRUCK', 'PICKUP', 'VAN', 'REFRIGERATED', 'TANKER', 'FLATBED');

-- CreateEnum
CREATE TYPE "FleetOwnership" AS ENUM ('OWNED', 'LEASED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nationalCode" TEXT,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "homeProvince" TEXT,
    "homeCity" TEXT,
    "freightCompanyId" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freight_company_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "registrationNo" TEXT,
    "province" TEXT,
    "city" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freight_company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "registrationNo" TEXT,
    "province" TEXT,
    "city" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminal_admin_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "terminalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terminal_admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "halls" (
    "id" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "shift" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "halls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "freightId" TEXT,
    "originProvince" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "destProvince" TEXT NOT NULL,
    "destCity" TEXT NOT NULL,
    "cargoType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'تن',
    "fare" DOUBLE PRECISION,
    "description" TEXT,
    "status" "CargoStatus" NOT NULL DEFAULT 'DRAFT',
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_status_history" (
    "id" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "fromStatus" "CargoStatus",
    "toStatus" "CargoStatus" NOT NULL,
    "note" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargo_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hall_announcements" (
    "id" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "hallId" TEXT NOT NULL,
    "freightId" TEXT NOT NULL,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendNote" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hall_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "freightId" TEXT NOT NULL,
    "announcementId" TEXT,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waybills" (
    "id" TEXT NOT NULL,
    "waybillNumber" TEXT NOT NULL,
    "cargoId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "pdfPath" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waybills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "ownership" "FleetOwnership" NOT NULL DEFAULT 'OWNED',
    "model" TEXT,
    "year" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_nationalCode_key" ON "users"("nationalCode");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "otp_codes_phone_idx" ON "otp_codes"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_userId_key" ON "driver_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "freight_company_profiles_userId_key" ON "freight_company_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "producer_profiles_userId_key" ON "producer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "terminal_admin_profiles_userId_key" ON "terminal_admin_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_referenceCode_key" ON "cargo"("referenceCode");

-- CreateIndex
CREATE INDEX "cargo_status_idx" ON "cargo"("status");

-- CreateIndex
CREATE INDEX "cargo_originProvince_idx" ON "cargo"("originProvince");

-- CreateIndex
CREATE INDEX "cargo_freightId_idx" ON "cargo"("freightId");

-- CreateIndex
CREATE INDEX "cargo_producerId_idx" ON "cargo"("producerId");

-- CreateIndex
CREATE UNIQUE INDEX "waybills_waybillNumber_key" ON "waybills"("waybillNumber");

-- CreateIndex
CREATE UNIQUE INDEX "waybills_appointmentId_key" ON "waybills"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_freightCompanyId_fkey" FOREIGN KEY ("freightCompanyId") REFERENCES "freight_company_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freight_company_profiles" ADD CONSTRAINT "freight_company_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producer_profiles" ADD CONSTRAINT "producer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terminal_admin_profiles" ADD CONSTRAINT "terminal_admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terminal_admin_profiles" ADD CONSTRAINT "terminal_admin_profiles_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halls" ADD CONSTRAINT "halls_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo" ADD CONSTRAINT "cargo_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "producer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo" ADD CONSTRAINT "cargo_freightId_fkey" FOREIGN KEY ("freightId") REFERENCES "freight_company_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_status_history" ADD CONSTRAINT "cargo_status_history_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "cargo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_announcements" ADD CONSTRAINT "hall_announcements_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_announcements" ADD CONSTRAINT "hall_announcements_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "halls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hall_announcements" ADD CONSTRAINT "hall_announcements_freightId_fkey" FOREIGN KEY ("freightId") REFERENCES "freight_company_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_freightId_fkey" FOREIGN KEY ("freightId") REFERENCES "freight_company_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "hall_announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waybills" ADD CONSTRAINT "waybills_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waybills" ADD CONSTRAINT "waybills_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
