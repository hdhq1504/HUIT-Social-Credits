/*
  Warnings:

  - You are about to drop the column `khoaId` on the `LopHoc` table. All the data in the column will be lost.
  - Added the required column `nganhHocId` to the `LopHoc` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."LopHoc" DROP CONSTRAINT "LopHoc_khoaId_fkey";

-- AlterTable
ALTER TABLE "LopHoc" DROP COLUMN "khoaId",
ADD COLUMN     "nganhHocId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "NganhHoc" (
    "id" TEXT NOT NULL,
    "maNganh" VARCHAR(50) NOT NULL,
    "tenNganh" VARCHAR(255) NOT NULL,
    "moTa" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "khoaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NganhHoc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NganhHoc_maNganh_key" ON "NganhHoc"("maNganh");

-- CreateIndex
CREATE INDEX "NganhHoc_maNganh_idx" ON "NganhHoc"("maNganh");

-- CreateIndex
CREATE INDEX "NganhHoc_khoaId_idx" ON "NganhHoc"("khoaId");

-- CreateIndex
CREATE INDEX "NganhHoc_isActive_idx" ON "NganhHoc"("isActive");

-- CreateIndex
CREATE INDEX "LopHoc_nganhHocId_idx" ON "LopHoc"("nganhHocId");

-- AddForeignKey
ALTER TABLE "NganhHoc" ADD CONSTRAINT "NganhHoc_khoaId_fkey" FOREIGN KEY ("khoaId") REFERENCES "Khoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LopHoc" ADD CONSTRAINT "LopHoc_nganhHocId_fkey" FOREIGN KEY ("nganhHocId") REFERENCES "NganhHoc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
