/*
  Warnings:

  - You are about to drop the column `anhMimeType` on the `DiemDanhNguoiDung` table. All the data in the column will be lost.
  - You are about to drop the column `anhTen` on the `DiemDanhNguoiDung` table. All the data in the column will be lost.
  - The `anhDinhKem` column on the `DiemDanhNguoiDung` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `hinhAnh` column on the `HoatDong` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "DiemDanhNguoiDung" DROP COLUMN "anhMimeType",
DROP COLUMN "anhTen",
DROP COLUMN "anhDinhKem",
ADD COLUMN     "anhDinhKem" JSONB;

-- AlterTable
ALTER TABLE "HoatDong" DROP COLUMN "hinhAnh",
ADD COLUMN     "hinhAnh" JSONB;
