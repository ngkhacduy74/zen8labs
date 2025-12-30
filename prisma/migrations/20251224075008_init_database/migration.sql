/*
  Warnings:

  - The `type` column on the `Booking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Booking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `Phone` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `fullname` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('User', 'Admin', 'Master');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('Pending', 'Confirmed', 'Cancelled');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('Casual', 'Monthly', 'Event');

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "type",
ADD COLUMN     "type" "BookingType" NOT NULL DEFAULT 'Casual',
DROP COLUMN "status",
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "Phone",
ADD COLUMN     "fullname" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'User';
