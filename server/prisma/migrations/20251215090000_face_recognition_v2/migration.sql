-- AlterEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'facematchstatus') THEN
    CREATE TYPE "FaceMatchStatus" AS ENUM ('APPROVED', 'REVIEW', 'REJECTED');
  END IF;
END $$;

ALTER TYPE "TrangThaiDangKy" ADD VALUE IF NOT EXISTS 'CHO_DUYET';

-- Attendance method cleanup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendancemethod') THEN
    -- Ensure no legacy manual method remains
    UPDATE "HoatDong" SET "phuongThucDiemDanh" = 'PHOTO' WHERE "phuongThucDiemDanh" = 'MANUAL';

    CREATE TYPE "AttendanceMethod_new" AS ENUM ('QR', 'PHOTO');
    ALTER TABLE "HoatDong" ALTER COLUMN "phuongThucDiemDanh"
      TYPE "AttendanceMethod_new" USING "phuongThucDiemDanh"::text::"AttendanceMethod_new";
    DROP TYPE "AttendanceMethod";
    ALTER TYPE "AttendanceMethod_new" RENAME TO "AttendanceMethod";
  END IF;
END $$;

-- AlterTable DiemDanhNguoiDung
ALTER TABLE "DiemDanhNguoiDung"
  ADD COLUMN IF NOT EXISTS "faceMatch" "FaceMatchStatus",
  ADD COLUMN IF NOT EXISTS "faceScore" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "faceMeta" JSONB;

-- CreateTable FaceProfile
CREATE TABLE IF NOT EXISTS "FaceProfile" (
  "id" TEXT NOT NULL,
  "nguoiDungId" TEXT NOT NULL,
  "descriptors" JSONB NOT NULL,
  "samples" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FaceProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FaceProfile_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FaceProfile_nguoiDungId_key" UNIQUE ("nguoiDungId")
);
