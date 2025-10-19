/*
  Warnings:

  - You are about to drop the column `danhMuc` on the `HoatDong` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NhomDiem" AS ENUM ('NHOM_1', 'NHOM_2_3');

-- DropIndex
DROP INDEX "public"."HoatDong_danhMuc_idx";

-- AlterTable
ALTER TABLE "HoatDong" DROP COLUMN "danhMuc",
ADD COLUMN     "danhMucId" TEXT,
ADD COLUMN     "nhomDiem" "NhomDiem" NOT NULL DEFAULT 'NHOM_2_3';

-- CreateTable
CREATE TABLE "DanhMucHoatDong" (
    "id" TEXT NOT NULL,
    "ma" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "moTa" TEXT,
    "nhomDiem" "NhomDiem" NOT NULL DEFAULT 'NHOM_2_3',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DanhMucHoatDong_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DanhMucHoatDong_ma_key" ON "DanhMucHoatDong"("ma");

-- CreateIndex
CREATE INDEX "DanhMucHoatDong_isActive_nhomDiem_idx" ON "DanhMucHoatDong"("isActive", "nhomDiem");

-- CreateIndex
CREATE INDEX "HoatDong_danhMucId_idx" ON "HoatDong"("danhMucId");

-- AddForeignKey
ALTER TABLE "HoatDong" ADD CONSTRAINT "HoatDong_danhMucId_fkey" FOREIGN KEY ("danhMucId") REFERENCES "DanhMucHoatDong"("id") ON DELETE SET NULL ON UPDATE CASCADE;
