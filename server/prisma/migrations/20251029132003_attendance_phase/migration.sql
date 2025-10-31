-- CreateEnum
CREATE TYPE "AttendancePhase" AS ENUM ('CHECKIN', 'CHECKOUT');

-- AlterTable
ALTER TABLE "DiemDanhNguoiDung" ADD COLUMN     "loai" "AttendancePhase" NOT NULL DEFAULT 'CHECKIN';
