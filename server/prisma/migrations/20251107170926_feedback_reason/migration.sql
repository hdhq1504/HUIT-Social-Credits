/*
  Warnings:

  - You are about to drop the column `maHoatDong` on the `HoatDong` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."HoatDong_maHoatDong_key";

-- AlterTable
ALTER TABLE "HoatDong" DROP COLUMN "maHoatDong";

-- AlterTable
ALTER TABLE "PhanHoiHoatDong" ADD COLUMN     "lydoTuChoi" TEXT;
