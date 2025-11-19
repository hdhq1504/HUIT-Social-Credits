/*
  Warnings:

  - The values [NHANVIEN] on the enum `VaiTro` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VaiTro_new" AS ENUM ('SINHVIEN', 'GIANGVIEN', 'ADMIN');
ALTER TABLE "public"."NguoiDung" ALTER COLUMN "vaiTro" DROP DEFAULT;
ALTER TABLE "NguoiDung" ALTER COLUMN "vaiTro" TYPE "VaiTro_new" USING ("vaiTro"::text::"VaiTro_new");
ALTER TYPE "VaiTro" RENAME TO "VaiTro_old";
ALTER TYPE "VaiTro_new" RENAME TO "VaiTro";
DROP TYPE "public"."VaiTro_old";
ALTER TABLE "NguoiDung" ALTER COLUMN "vaiTro" SET DEFAULT 'SINHVIEN';
COMMIT;
