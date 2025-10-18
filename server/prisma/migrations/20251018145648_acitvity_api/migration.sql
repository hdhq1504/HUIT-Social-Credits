-- CreateEnum
CREATE TYPE "TrangThaiDangKy" AS ENUM ('DANG_KY', 'DA_HUY', 'DA_THAM_GIA', 'VANG_MAT');

-- CreateEnum
CREATE TYPE "TrangThaiPhanHoi" AS ENUM ('CHO_DUYET', 'DA_DUYET', 'BI_TU_CHOI');

-- CreateTable
CREATE TABLE "HoatDong" (
    "id" TEXT NOT NULL,
    "maHoatDong" TEXT,
    "tieuDe" TEXT NOT NULL,
    "moTa" TEXT,
    "diemCong" INTEGER NOT NULL DEFAULT 0,
    "batDauLuc" TIMESTAMP(3),
    "ketThucLuc" TIMESTAMP(3),
    "diaDiem" TEXT,
    "sucChuaToiDa" INTEGER,
    "hinhAnh" VARCHAR(255),
    "danhMuc" VARCHAR(100),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HoatDong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DangKyHoatDong" (
    "id" TEXT NOT NULL,
    "nguoiDungId" TEXT NOT NULL,
    "hoatDongId" TEXT NOT NULL,
    "trangThai" "TrangThaiDangKy" NOT NULL DEFAULT 'DANG_KY',
    "lyDoHuy" TEXT,
    "ghiChu" TEXT,
    "dangKyLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duyetLuc" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "diemDanhLuc" TIMESTAMP(3),
    "diemDanhBoiId" TEXT,
    "diemDanhGhiChu" TEXT,

    CONSTRAINT "DangKyHoatDong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhanHoiHoatDong" (
    "id" TEXT NOT NULL,
    "dangKyId" TEXT NOT NULL,
    "nguoiDungId" TEXT NOT NULL,
    "hoatDongId" TEXT NOT NULL,
    "noiDung" TEXT NOT NULL,
    "danhGia" INTEGER,
    "minhChung" JSONB,
    "trangThai" "TrangThaiPhanHoi" NOT NULL DEFAULT 'CHO_DUYET',
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capNhatLuc" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhanHoiHoatDong_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HoatDong_maHoatDong_key" ON "HoatDong"("maHoatDong");

-- CreateIndex
CREATE INDEX "HoatDong_isPublished_batDauLuc_idx" ON "HoatDong"("isPublished", "batDauLuc");

-- CreateIndex
CREATE INDEX "HoatDong_danhMuc_idx" ON "HoatDong"("danhMuc");

-- CreateIndex
CREATE INDEX "DangKyHoatDong_hoatDongId_trangThai_idx" ON "DangKyHoatDong"("hoatDongId", "trangThai");

-- CreateIndex
CREATE INDEX "DangKyHoatDong_nguoiDungId_trangThai_idx" ON "DangKyHoatDong"("nguoiDungId", "trangThai");

-- CreateIndex
CREATE UNIQUE INDEX "DangKyHoatDong_nguoiDungId_hoatDongId_key" ON "DangKyHoatDong"("nguoiDungId", "hoatDongId");

-- CreateIndex
CREATE UNIQUE INDEX "PhanHoiHoatDong_dangKyId_key" ON "PhanHoiHoatDong"("dangKyId");

-- CreateIndex
CREATE INDEX "PhanHoiHoatDong_hoatDongId_idx" ON "PhanHoiHoatDong"("hoatDongId");

-- CreateIndex
CREATE INDEX "PhanHoiHoatDong_nguoiDungId_idx" ON "PhanHoiHoatDong"("nguoiDungId");

-- CreateIndex
CREATE UNIQUE INDEX "PhanHoiHoatDong_nguoiDungId_hoatDongId_key" ON "PhanHoiHoatDong"("nguoiDungId", "hoatDongId");

-- AddForeignKey
ALTER TABLE "DangKyHoatDong" ADD CONSTRAINT "DangKyHoatDong_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "NguoiDung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DangKyHoatDong" ADD CONSTRAINT "DangKyHoatDong_hoatDongId_fkey" FOREIGN KEY ("hoatDongId") REFERENCES "HoatDong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DangKyHoatDong" ADD CONSTRAINT "DangKyHoatDong_diemDanhBoiId_fkey" FOREIGN KEY ("diemDanhBoiId") REFERENCES "NguoiDung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhanHoiHoatDong" ADD CONSTRAINT "PhanHoiHoatDong_dangKyId_fkey" FOREIGN KEY ("dangKyId") REFERENCES "DangKyHoatDong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhanHoiHoatDong" ADD CONSTRAINT "PhanHoiHoatDong_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "NguoiDung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhanHoiHoatDong" ADD CONSTRAINT "PhanHoiHoatDong_hoatDongId_fkey" FOREIGN KEY ("hoatDongId") REFERENCES "HoatDong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
