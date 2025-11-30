/*
  Warnings:

  - You are about to drop the column `maKhoa` on the `NguoiDung` table. All the data in the column will be lost.
  - You are about to drop the column `maLop` on the `NguoiDung` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NguoiDung" DROP COLUMN "maKhoa",
DROP COLUMN "maLop",
ADD COLUMN     "khoaId" TEXT;

-- CreateIndex
CREATE INDEX "NguoiDung_lopHocId_idx" ON "NguoiDung"("lopHocId");

-- CreateIndex
CREATE INDEX "NguoiDung_khoaId_idx" ON "NguoiDung"("khoaId");

-- AddForeignKey
ALTER TABLE "NguoiDung" ADD CONSTRAINT "NguoiDung_khoaId_fkey" FOREIGN KEY ("khoaId") REFERENCES "Khoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
