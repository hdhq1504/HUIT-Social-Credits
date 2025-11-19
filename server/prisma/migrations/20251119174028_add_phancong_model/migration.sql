/*
  Warnings:

  - You are about to drop the column `giangVienChuNhiemId` on the `LopHoc` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "LoaiPhanCong" AS ENUM ('CHU_NHIEM', 'GIANG_DAY');

-- DropForeignKey
ALTER TABLE "public"."LopHoc" DROP CONSTRAINT "LopHoc_giangVienChuNhiemId_fkey";

-- AlterTable
ALTER TABLE "LopHoc" DROP COLUMN "giangVienChuNhiemId";

-- CreateTable
CREATE TABLE "PhanCong" (
    "id" TEXT NOT NULL,
    "giangVienId" TEXT NOT NULL,
    "lopHocId" TEXT NOT NULL,
    "namHocId" TEXT NOT NULL,
    "loaiPhanCong" "LoaiPhanCong" NOT NULL DEFAULT 'CHU_NHIEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhanCong_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhanCong_giangVienId_idx" ON "PhanCong"("giangVienId");

-- CreateIndex
CREATE INDEX "PhanCong_lopHocId_idx" ON "PhanCong"("lopHocId");

-- CreateIndex
CREATE INDEX "PhanCong_namHocId_idx" ON "PhanCong"("namHocId");

-- CreateIndex
CREATE INDEX "PhanCong_loaiPhanCong_idx" ON "PhanCong"("loaiPhanCong");

-- CreateIndex
CREATE UNIQUE INDEX "PhanCong_giangVienId_lopHocId_namHocId_loaiPhanCong_key" ON "PhanCong"("giangVienId", "lopHocId", "namHocId", "loaiPhanCong");

-- AddForeignKey
ALTER TABLE "PhanCong" ADD CONSTRAINT "PhanCong_giangVienId_fkey" FOREIGN KEY ("giangVienId") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhanCong" ADD CONSTRAINT "PhanCong_lopHocId_fkey" FOREIGN KEY ("lopHocId") REFERENCES "LopHoc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhanCong" ADD CONSTRAINT "PhanCong_namHocId_fkey" FOREIGN KEY ("namHocId") REFERENCES "NamHoc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
