-- CreateEnum
CREATE TYPE "VaiTro" AS ENUM ('SINHVIEN', 'GIANGVIEN', 'NHANVIEN', 'ADMIN');

-- CreateEnum
CREATE TYPE "GioiTinh" AS ENUM ('Nam', 'Nữ', 'Khác');

-- CreateTable
CREATE TABLE "NguoiDung" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "matKhau" TEXT NOT NULL,
    "hoTen" TEXT NOT NULL,
    "vaiTro" "VaiTro" NOT NULL DEFAULT 'SINHVIEN',
    "gioiTinh" "GioiTinh",
    "maSV" VARCHAR(50),
    "maCB" VARCHAR(50),
    "maLop" VARCHAR(50),
    "maKhoa" VARCHAR(255),
    "soDT" VARCHAR(30),
    "ngaySinh" TIMESTAMP(3),
    "avatarUrl" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "ghiChu" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NguoiDung_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NguoiDung_email_key" ON "NguoiDung"("email");

-- CreateIndex
CREATE INDEX "NguoiDung_email_idx" ON "NguoiDung"("email");

-- CreateIndex
CREATE INDEX "NguoiDung_maSV_idx" ON "NguoiDung"("maSV");

-- CreateIndex
CREATE INDEX "NguoiDung_maCB_idx" ON "NguoiDung"("maCB");

-- CreateIndex
CREATE INDEX "NguoiDung_vaiTro_isActive_idx" ON "NguoiDung"("vaiTro", "isActive");
