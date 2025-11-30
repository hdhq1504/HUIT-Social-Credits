/*
  Warnings:

  - The values [QR] on the enum `AttendanceMethod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AttendanceMethod_new" AS ENUM ('PHOTO');
ALTER TABLE "public"."HoatDong" ALTER COLUMN "phuongThucDiemDanh" DROP DEFAULT;
ALTER TABLE "HoatDong" ALTER COLUMN "phuongThucDiemDanh" TYPE "AttendanceMethod_new" USING ("phuongThucDiemDanh"::text::"AttendanceMethod_new");
ALTER TYPE "AttendanceMethod" RENAME TO "AttendanceMethod_old";
ALTER TYPE "AttendanceMethod_new" RENAME TO "AttendanceMethod";
DROP TYPE "public"."AttendanceMethod_old";
ALTER TABLE "HoatDong" ALTER COLUMN "phuongThucDiemDanh" SET DEFAULT 'PHOTO';
COMMIT;

-- AlterTable
ALTER TABLE "HoatDong" ALTER COLUMN "phuongThucDiemDanh" SET DEFAULT 'PHOTO';
