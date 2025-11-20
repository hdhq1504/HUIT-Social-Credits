-- CreateEnum
CREATE TYPE "TrangThaiDuyetHoatDong" AS ENUM ('CHO_DUYET', 'DA_DUYET', 'BI_TU_CHOI');

-- AlterTable
ALTER TABLE "HoatDong" ADD COLUMN     "lyDoTuChoi" TEXT,
ADD COLUMN     "nguoiPhuTrachId" TEXT,
ADD COLUMN     "nguoiTaoId" TEXT,
ADD COLUMN     "trangThaiDuyet" "TrangThaiDuyetHoatDong" NOT NULL DEFAULT 'DA_DUYET';

-- CreateIndex
CREATE INDEX "HoatDong_trangThaiDuyet_idx" ON "HoatDong"("trangThaiDuyet");

-- CreateIndex
CREATE INDEX "HoatDong_nguoiTaoId_idx" ON "HoatDong"("nguoiTaoId");

-- CreateIndex
CREATE INDEX "HoatDong_nguoiPhuTrachId_idx" ON "HoatDong"("nguoiPhuTrachId");

-- AddForeignKey
ALTER TABLE "HoatDong" ADD CONSTRAINT "HoatDong_nguoiTaoId_fkey" FOREIGN KEY ("nguoiTaoId") REFERENCES "NguoiDung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoatDong" ADD CONSTRAINT "HoatDong_nguoiPhuTrachId_fkey" FOREIGN KEY ("nguoiPhuTrachId") REFERENCES "NguoiDung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
