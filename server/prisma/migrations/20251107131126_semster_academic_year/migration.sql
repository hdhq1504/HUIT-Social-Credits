/*
  Warnings:

  - You are about to drop the column `hocKy` on the `HoatDong` table. All the data in the column will be lost.
  - You are about to drop the column `namHoc` on the `HoatDong` table. All the data in the column will be lost.
  - You are about to drop the column `quyenLoi` on the `HoatDong` table. All the data in the column will be lost.
  - You are about to drop the column `trachNhiem` on the `HoatDong` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('QR', 'PHOTO', 'MANUAL');

-- AlterTable
ALTER TABLE "HoatDong" DROP COLUMN "hocKy",
DROP COLUMN "namHoc",
DROP COLUMN "quyenLoi",
DROP COLUMN "trachNhiem",
ADD COLUMN     "hanDangKy" TIMESTAMP(3),
ADD COLUMN     "hanHuyDangKy" TIMESTAMP(3),
ADD COLUMN     "hocKyId" TEXT,
ADD COLUMN     "namHocId" TEXT,
ADD COLUMN     "phuongThucDiemDanh" "AttendanceMethod" NOT NULL DEFAULT 'QR';

-- CreateTable
CREATE TABLE "NamHoc" (
    "id" TEXT NOT NULL,
    "ma" TEXT NOT NULL,
    "nienKhoa" TEXT NOT NULL,
    "ten" TEXT,
    "batDau" TIMESTAMP(3) NOT NULL,
    "ketThuc" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NamHoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HocKy" (
    "id" TEXT NOT NULL,
    "ma" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "thuTu" INTEGER,
    "moTa" TEXT,
    "batDau" TIMESTAMP(3) NOT NULL,
    "ketThuc" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "namHocId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HocKy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NamHoc_ma_key" ON "NamHoc"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "NamHoc_nienKhoa_key" ON "NamHoc"("nienKhoa");

-- CreateIndex
CREATE INDEX "NamHoc_isActive_batDau_idx" ON "NamHoc"("isActive", "batDau");

-- CreateIndex
CREATE INDEX "NamHoc_batDau_ketThuc_idx" ON "NamHoc"("batDau", "ketThuc");

-- CreateIndex
CREATE UNIQUE INDEX "HocKy_ma_key" ON "HocKy"("ma");

-- CreateIndex
CREATE INDEX "HocKy_namHocId_isActive_thuTu_idx" ON "HocKy"("namHocId", "isActive", "thuTu");

-- CreateIndex
CREATE INDEX "HocKy_batDau_ketThuc_idx" ON "HocKy"("batDau", "ketThuc");

-- CreateIndex
CREATE INDEX "HoatDong_hocKyId_idx" ON "HoatDong"("hocKyId");

-- CreateIndex
CREATE INDEX "HoatDong_namHocId_idx" ON "HoatDong"("namHocId");

-- AddForeignKey
ALTER TABLE "HocKy" ADD CONSTRAINT "HocKy_namHocId_fkey" FOREIGN KEY ("namHocId") REFERENCES "NamHoc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoatDong" ADD CONSTRAINT "HoatDong_hocKyId_fkey" FOREIGN KEY ("hocKyId") REFERENCES "HocKy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoatDong" ADD CONSTRAINT "HoatDong_namHocId_fkey" FOREIGN KEY ("namHocId") REFERENCES "NamHoc"("id") ON DELETE SET NULL ON UPDATE CASCADE;
