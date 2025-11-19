-- AlterTable
ALTER TABLE "NguoiDung" ADD COLUMN     "lopHocId" TEXT;

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
    "giangVienChuNhiemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LopHoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Khoa_maKhoa_key" ON "Khoa"("maKhoa");

-- CreateIndex
CREATE INDEX "Khoa_maKhoa_idx" ON "Khoa"("maKhoa");

-- CreateIndex
CREATE INDEX "Khoa_isActive_idx" ON "Khoa"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LopHoc_maLop_key" ON "LopHoc"("maLop");

-- AddForeignKey
ALTER TABLE "NguoiDung" ADD CONSTRAINT "NguoiDung_lopHocId_fkey" FOREIGN KEY ("lopHocId") REFERENCES "LopHoc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LopHoc" ADD CONSTRAINT "LopHoc_khoaId_fkey" FOREIGN KEY ("khoaId") REFERENCES "Khoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LopHoc" ADD CONSTRAINT "LopHoc_giangVienChuNhiemId_fkey" FOREIGN KEY ("giangVienChuNhiemId") REFERENCES "NguoiDung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
