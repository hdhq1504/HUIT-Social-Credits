-- CreateEnum
CREATE TYPE "VaiTro" AS ENUM ('SINHVIEN', 'GIANGVIEN', 'ADMIN');

-- CreateEnum
CREATE TYPE "GioiTinh" AS ENUM ('Nam', 'Nữ', 'Khác');

-- CreateEnum
CREATE TYPE "TrangThaiDangKy" AS ENUM ('DANG_KY', 'DANG_THAM_GIA', 'DA_HUY', 'DA_THAM_GIA', 'VANG_MAT', 'CHO_DUYET');

-- CreateEnum
CREATE TYPE "TrangThaiPhanHoi" AS ENUM ('CHO_DUYET', 'DA_DUYET', 'BI_TU_CHOI');

-- CreateEnum
CREATE TYPE "AttendancePhase" AS ENUM ('CHECKIN', 'CHECKOUT');

-- CreateEnum
CREATE TYPE "NhomDiem" AS ENUM ('NHOM_1', 'NHOM_2', 'NHOM_3');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('QR', 'PHOTO');

-- CreateEnum
CREATE TYPE "FaceMatchStatus" AS ENUM ('APPROVED', 'REVIEW', 'REJECTED');

-- CreateEnum
CREATE TYPE "LoaiPhanCong" AS ENUM ('CHU_NHIEM', 'GIANG_DAY');

-- CreateEnum
CREATE TYPE "TrangThaiDuyetHoatDong" AS ENUM ('CHO_DUYET', 'DA_DUYET', 'BI_TU_CHOI');

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
    "resetPasswordToken" TEXT,
    "resetPasswordTokenExpiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "ghiChu" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lopHocId" TEXT,

    CONSTRAINT "NguoiDung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Khoa" (
    "id" TEXT NOT NULL,
    "maKhoa" VARCHAR(50) NOT NULL,
    "tenKhoa" VARCHAR(255) NOT NULL,
    "moTa" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Khoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LopHoc" (
    "id" TEXT NOT NULL,
    "maLop" TEXT NOT NULL,
    "tenLop" TEXT NOT NULL,
    "khoaId" TEXT NOT NULL,
    "namNhapHoc" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LopHoc_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "HoatDong" (
    "id" TEXT NOT NULL,
    "tieuDe" TEXT NOT NULL,
    "moTa" TEXT,
    "yeuCau" JSONB,
    "huongDan" JSONB,
    "diemCong" INTEGER NOT NULL DEFAULT 0,
    "batDauLuc" TIMESTAMP(3),
    "ketThucLuc" TIMESTAMP(3),
    "diaDiem" TEXT,
    "sucChuaToiDa" INTEGER,
    "hinhAnh" JSONB,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "hanDangKy" TIMESTAMP(3),
    "hanHuyDangKy" TIMESTAMP(3),
    "phuongThucDiemDanh" "AttendanceMethod" NOT NULL DEFAULT 'QR',
    "trangThaiDuyet" "TrangThaiDuyetHoatDong" NOT NULL DEFAULT 'DA_DUYET',
    "nguoiTaoId" TEXT,
    "nguoiPhuTrachId" TEXT,
    "lyDoTuChoi" TEXT,
    "hocKyId" TEXT,
    "namHocId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nhomDiem" "NhomDiem" NOT NULL DEFAULT 'NHOM_2',

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
CREATE TABLE "DiemDanhNguoiDung" (
    "id" TEXT NOT NULL,
    "dangKyId" TEXT NOT NULL,
    "nguoiDungId" TEXT NOT NULL,
    "hoatDongId" TEXT NOT NULL,
    "trangThai" "TrangThaiDangKy" NOT NULL,
    "loai" "AttendancePhase" NOT NULL DEFAULT 'CHECKIN',
    "ghiChu" TEXT,
    "anhDinhKem" JSONB,
    "faceMatch" "FaceMatchStatus",
    "faceScore" DOUBLE PRECISION,
    "faceMeta" JSONB,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiemDanhNguoiDung_pkey" PRIMARY KEY ("id")
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
    "lydoTuChoi" TEXT,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capNhatLuc" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhanHoiHoatDong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThongBao" (
    "id" TEXT NOT NULL,
    "nguoiDungId" TEXT NOT NULL,
    "tieuDe" TEXT NOT NULL,
    "noiDung" TEXT NOT NULL,
    "loai" VARCHAR(30) NOT NULL,
    "duLieu" JSONB,
    "daDoc" BOOLEAN NOT NULL DEFAULT false,
    "daDocLuc" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThongBao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaceProfile" (
    "id" TEXT NOT NULL,
    "nguoiDungId" TEXT NOT NULL,
    "descriptors" JSONB NOT NULL,
    "samples" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaceProfile_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "NguoiDung_email_key" ON "NguoiDung"("email");

-- CreateIndex
CREATE INDEX "NguoiDung_email_idx" ON "NguoiDung"("email");

-- CreateIndex
CREATE INDEX "NguoiDung_maSV_idx" ON "NguoiDung"("maSV");

-- CreateIndex
CREATE INDEX "NguoiDung_maCB_idx" ON "NguoiDung"("maCB");

-- CreateIndex
CREATE INDEX "NguoiDung_vaiTro_isActive_idx" ON "NguoiDung"("vaiTro", "isActive");

-- CreateIndex
CREATE INDEX "NguoiDung_resetPasswordTokenExpiresAt_idx" ON "NguoiDung"("resetPasswordTokenExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Khoa_maKhoa_key" ON "Khoa"("maKhoa");

-- CreateIndex
CREATE INDEX "Khoa_maKhoa_idx" ON "Khoa"("maKhoa");

-- CreateIndex
CREATE INDEX "Khoa_isActive_idx" ON "Khoa"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LopHoc_maLop_key" ON "LopHoc"("maLop");

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
CREATE INDEX "HoatDong_isPublished_batDauLuc_idx" ON "HoatDong"("isPublished", "batDauLuc");

-- CreateIndex
CREATE INDEX "HoatDong_trangThaiDuyet_idx" ON "HoatDong"("trangThaiDuyet");

-- CreateIndex
CREATE INDEX "HoatDong_nguoiTaoId_idx" ON "HoatDong"("nguoiTaoId");

-- CreateIndex
CREATE INDEX "HoatDong_nguoiPhuTrachId_idx" ON "HoatDong"("nguoiPhuTrachId");

-- CreateIndex
CREATE INDEX "HoatDong_hocKyId_idx" ON "HoatDong"("hocKyId");

-- CreateIndex
CREATE INDEX "HoatDong_namHocId_idx" ON "HoatDong"("namHocId");

-- CreateIndex
CREATE INDEX "DangKyHoatDong_hoatDongId_trangThai_idx" ON "DangKyHoatDong"("hoatDongId", "trangThai");

-- CreateIndex
CREATE INDEX "DangKyHoatDong_nguoiDungId_trangThai_idx" ON "DangKyHoatDong"("nguoiDungId", "trangThai");

-- CreateIndex
CREATE INDEX "DangKyHoatDong_hoatDongId_diemDanhLuc_idx" ON "DangKyHoatDong"("hoatDongId", "diemDanhLuc");

-- CreateIndex
CREATE UNIQUE INDEX "DangKyHoatDong_nguoiDungId_hoatDongId_key" ON "DangKyHoatDong"("nguoiDungId", "hoatDongId");

-- CreateIndex
CREATE INDEX "DiemDanhNguoiDung_dangKyId_idx" ON "DiemDanhNguoiDung"("dangKyId");

-- CreateIndex
CREATE INDEX "DiemDanhNguoiDung_nguoiDungId_idx" ON "DiemDanhNguoiDung"("nguoiDungId");

-- CreateIndex
CREATE INDEX "DiemDanhNguoiDung_hoatDongId_idx" ON "DiemDanhNguoiDung"("hoatDongId");

-- CreateIndex
CREATE UNIQUE INDEX "PhanHoiHoatDong_dangKyId_key" ON "PhanHoiHoatDong"("dangKyId");

-- CreateIndex
CREATE INDEX "PhanHoiHoatDong_hoatDongId_idx" ON "PhanHoiHoatDong"("hoatDongId");

-- CreateIndex
CREATE INDEX "PhanHoiHoatDong_nguoiDungId_idx" ON "PhanHoiHoatDong"("nguoiDungId");

-- CreateIndex
CREATE UNIQUE INDEX "PhanHoiHoatDong_nguoiDungId_hoatDongId_key" ON "PhanHoiHoatDong"("nguoiDungId", "hoatDongId");

-- CreateIndex
CREATE INDEX "ThongBao_nguoiDungId_daDoc_idx" ON "ThongBao"("nguoiDungId", "daDoc");

-- CreateIndex
CREATE INDEX "ThongBao_nguoiDungId_createdAt_idx" ON "ThongBao"("nguoiDungId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FaceProfile_nguoiDungId_key" ON "FaceProfile"("nguoiDungId");

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
ALTER TABLE "NguoiDung" ADD CONSTRAINT "NguoiDung_lopHocId_fkey" FOREIGN KEY ("lopHocId") REFERENCES "LopHoc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LopHoc" ADD CONSTRAINT "LopHoc_khoaId_fkey" FOREIGN KEY ("khoaId") REFERENCES "Khoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HocKy" ADD CONSTRAINT "HocKy_namHocId_fkey" FOREIGN KEY ("namHocId") REFERENCES "NamHoc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoatDong" ADD CONSTRAINT "HoatDong_hocKyId_fkey" FOREIGN KEY ("hocKyId") REFERENCES "HocKy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoatDong" ADD CONSTRAINT "HoatDong_namHocId_fkey" FOREIGN KEY ("namHocId") REFERENCES "NamHoc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoatDong" ADD CONSTRAINT "HoatDong_nguoiTaoId_fkey" FOREIGN KEY ("nguoiTaoId") REFERENCES "NguoiDung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoatDong" ADD CONSTRAINT "HoatDong_nguoiPhuTrachId_fkey" FOREIGN KEY ("nguoiPhuTrachId") REFERENCES "NguoiDung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DangKyHoatDong" ADD CONSTRAINT "DangKyHoatDong_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "NguoiDung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DangKyHoatDong" ADD CONSTRAINT "DangKyHoatDong_hoatDongId_fkey" FOREIGN KEY ("hoatDongId") REFERENCES "HoatDong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DangKyHoatDong" ADD CONSTRAINT "DangKyHoatDong_diemDanhBoiId_fkey" FOREIGN KEY ("diemDanhBoiId") REFERENCES "NguoiDung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiemDanhNguoiDung" ADD CONSTRAINT "DiemDanhNguoiDung_dangKyId_fkey" FOREIGN KEY ("dangKyId") REFERENCES "DangKyHoatDong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiemDanhNguoiDung" ADD CONSTRAINT "DiemDanhNguoiDung_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "NguoiDung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiemDanhNguoiDung" ADD CONSTRAINT "DiemDanhNguoiDung_hoatDongId_fkey" FOREIGN KEY ("hoatDongId") REFERENCES "HoatDong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhanHoiHoatDong" ADD CONSTRAINT "PhanHoiHoatDong_dangKyId_fkey" FOREIGN KEY ("dangKyId") REFERENCES "DangKyHoatDong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhanHoiHoatDong" ADD CONSTRAINT "PhanHoiHoatDong_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "NguoiDung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhanHoiHoatDong" ADD CONSTRAINT "PhanHoiHoatDong_hoatDongId_fkey" FOREIGN KEY ("hoatDongId") REFERENCES "HoatDong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThongBao" ADD CONSTRAINT "ThongBao_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "NguoiDung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaceProfile" ADD CONSTRAINT "FaceProfile_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhanCong" ADD CONSTRAINT "PhanCong_giangVienId_fkey" FOREIGN KEY ("giangVienId") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhanCong" ADD CONSTRAINT "PhanCong_lopHocId_fkey" FOREIGN KEY ("lopHocId") REFERENCES "LopHoc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhanCong" ADD CONSTRAINT "PhanCong_namHocId_fkey" FOREIGN KEY ("namHocId") REFERENCES "NamHoc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
