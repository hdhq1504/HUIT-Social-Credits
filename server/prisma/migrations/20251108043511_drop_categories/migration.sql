/*
  Warnings:

  - You are about to drop the column `danhMucId` on the `HoatDong` table. All the data in the column will be lost.
  - You are about to drop the `DanhMucHoatDong` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."HoatDong" DROP CONSTRAINT "HoatDong_danhMucId_fkey";

-- DropIndex
DROP INDEX "public"."HoatDong_danhMucId_idx";

-- AlterTable
ALTER TABLE "HoatDong" DROP COLUMN "danhMucId";

-- DropTable
DROP TABLE "public"."DanhMucHoatDong";
