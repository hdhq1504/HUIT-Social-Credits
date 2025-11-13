-- CreateTable
CREATE TABLE "Khoa" (
    "id" TEXT NOT NULL,
    "ma" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "moTa" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Khoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lop" (
    "id" TEXT NOT NULL,
    "ma" TEXT NOT NULL,
    "ten" TEXT,
    "khoaId" TEXT NOT NULL,
    "chuNhiemId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lop_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "NguoiDung"
    ADD COLUMN     "lopId" TEXT,
    ADD COLUMN     "khoaId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Khoa_ma_key" ON "Khoa"("ma");

-- CreateIndex
CREATE INDEX "Khoa_isActive_ten_idx" ON "Khoa"("isActive", "ten");

-- CreateIndex
CREATE INDEX "Khoa_ten_idx" ON "Khoa"("ten");

-- CreateIndex
CREATE UNIQUE INDEX "Lop_ma_key" ON "Lop"("ma");

-- CreateIndex
CREATE INDEX "Lop_khoaId_isActive_idx" ON "Lop"("khoaId", "isActive");

-- CreateIndex
CREATE INDEX "Lop_chuNhiemId_idx" ON "Lop"("chuNhiemId");

-- CreateIndex
CREATE INDEX "NguoiDung_lopId_idx" ON "NguoiDung"("lopId");

-- CreateIndex
CREATE INDEX "NguoiDung_khoaId_idx" ON "NguoiDung"("khoaId");

-- AddForeignKey
ALTER TABLE "Lop"
    ADD CONSTRAINT "Lop_khoaId_fkey" FOREIGN KEY ("khoaId") REFERENCES "Khoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lop"
    ADD CONSTRAINT "Lop_chuNhiemId_fkey" FOREIGN KEY ("chuNhiemId") REFERENCES "NguoiDung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NguoiDung"
    ADD CONSTRAINT "NguoiDung_lopId_fkey" FOREIGN KEY ("lopId") REFERENCES "Lop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NguoiDung"
    ADD CONSTRAINT "NguoiDung_khoaId_fkey" FOREIGN KEY ("khoaId") REFERENCES "Khoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
