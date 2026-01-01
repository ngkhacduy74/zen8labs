-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BookingCreated', 'BookingCancelled', 'BookingConfirmed');

-- AlterTable
ALTER TABLE "Court" ADD COLUMN     "defaultCloseTime" TEXT NOT NULL DEFAULT '22:00',
ADD COLUMN     "defaultOpenTime" TEXT NOT NULL DEFAULT '06:00',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh';

-- CreateTable
CREATE TABLE "CourtBusinessHour" (
    "id" SERIAL NOT NULL,
    "courtId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT,
    "closeTime" TEXT,

    CONSTRAINT "CourtBusinessHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "bookingId" INTEGER,
    "courtId" INTEGER,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourtBusinessHour_courtId_idx" ON "CourtBusinessHour"("courtId");

-- CreateIndex
CREATE UNIQUE INDEX "CourtBusinessHour_courtId_dayOfWeek_key" ON "CourtBusinessHour"("courtId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Notification_recipientId_isRead_createdAt_idx" ON "Notification"("recipientId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_bookingId_idx" ON "Notification"("bookingId");

-- CreateIndex
CREATE INDEX "Notification_courtId_idx" ON "Notification"("courtId");

-- AddForeignKey
ALTER TABLE "CourtBusinessHour" ADD CONSTRAINT "CourtBusinessHour_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
