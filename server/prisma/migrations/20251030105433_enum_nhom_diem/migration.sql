/*
  Warnings:

  - The values [NHOM_2_3] on the enum `NhomDiem` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NhomDiem_new" AS ENUM ('NHOM_1', 'NHOM_2', 'NHOM_3');
ALTER TABLE "public"."DanhMucHoatDong" ALTER COLUMN "nhomDiem" DROP DEFAULT;
ALTER TABLE "public"."HoatDong" ALTER COLUMN "nhomDiem" DROP DEFAULT;
ALTER TABLE "DanhMucHoatDong" ALTER COLUMN "nhomDiem" TYPE "NhomDiem_new" USING ("nhomDiem"::text::"NhomDiem_new");
ALTER TABLE "HoatDong" ALTER COLUMN "nhomDiem" TYPE "NhomDiem_new" USING ("nhomDiem"::text::"NhomDiem_new");
ALTER TYPE "NhomDiem" RENAME TO "NhomDiem_old";
ALTER TYPE "NhomDiem_new" RENAME TO "NhomDiem";
DROP TYPE "public"."NhomDiem_old";
ALTER TABLE "DanhMucHoatDong" ALTER COLUMN "nhomDiem" SET DEFAULT 'NHOM_2';
ALTER TABLE "HoatDong" ALTER COLUMN "nhomDiem" SET DEFAULT 'NHOM_2';
COMMIT;

-- AlterTable
ALTER TABLE "DanhMucHoatDong" ALTER COLUMN "nhomDiem" SET DEFAULT 'NHOM_2';

-- AlterTable
ALTER TABLE "HoatDong" ALTER COLUMN "nhomDiem" SET DEFAULT 'NHOM_2';
