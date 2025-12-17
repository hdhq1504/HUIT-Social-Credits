/*
  Warnings:

  - The values [REJECTED] on the enum `FaceMatchStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FaceMatchStatus_new" AS ENUM ('APPROVED', 'REVIEW');
ALTER TABLE "DiemDanhNguoiDung" ALTER COLUMN "faceMatch" TYPE "FaceMatchStatus_new" USING ("faceMatch"::text::"FaceMatchStatus_new");
ALTER TYPE "FaceMatchStatus" RENAME TO "FaceMatchStatus_old";
ALTER TYPE "FaceMatchStatus_new" RENAME TO "FaceMatchStatus";
DROP TYPE "public"."FaceMatchStatus_old";
COMMIT;
