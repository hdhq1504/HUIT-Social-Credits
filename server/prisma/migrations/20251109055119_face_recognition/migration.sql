-- CreateEnum
CREATE TYPE "FaceMatchStatus" AS ENUM ('APPROVED', 'REVIEW', 'REJECTED');

-- AlterTable
ALTER TABLE "DiemDanhNguoiDung" ADD COLUMN     "faceMatch" "FaceMatchStatus",
ADD COLUMN     "faceMeta" JSONB,
ADD COLUMN     "faceScore" DOUBLE PRECISION;

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

-- CreateIndex
CREATE UNIQUE INDEX "FaceProfile_nguoiDungId_key" ON "FaceProfile"("nguoiDungId");

-- AddForeignKey
ALTER TABLE "FaceProfile" ADD CONSTRAINT "FaceProfile_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;
