-- CreateTable
CREATE TABLE "DiemDanhNguoiDung" (
    "id" TEXT NOT NULL,
    "dangKyId" TEXT NOT NULL,
    "nguoiDungId" TEXT NOT NULL,
    "hoatDongId" TEXT NOT NULL,
    "trangThai" "TrangThaiDangKy" NOT NULL,
    "ghiChu" TEXT,
    "anhDinhKem" TEXT,
    "anhMimeType" VARCHAR(100),
    "anhTen" VARCHAR(255),
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiemDanhNguoiDung_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiemDanhNguoiDung_dangKyId_idx" ON "DiemDanhNguoiDung"("dangKyId");

-- CreateIndex
CREATE INDEX "DiemDanhNguoiDung_nguoiDungId_idx" ON "DiemDanhNguoiDung"("nguoiDungId");

-- CreateIndex
CREATE INDEX "DiemDanhNguoiDung_hoatDongId_idx" ON "DiemDanhNguoiDung"("hoatDongId");

-- AddForeignKey
ALTER TABLE "DiemDanhNguoiDung" ADD CONSTRAINT "DiemDanhNguoiDung_dangKyId_fkey" FOREIGN KEY ("dangKyId") REFERENCES "DangKyHoatDong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiemDanhNguoiDung" ADD CONSTRAINT "DiemDanhNguoiDung_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "NguoiDung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiemDanhNguoiDung" ADD CONSTRAINT "DiemDanhNguoiDung_hoatDongId_fkey" FOREIGN KEY ("hoatDongId") REFERENCES "HoatDong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
