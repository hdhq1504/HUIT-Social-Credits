-- AlterTable
ALTER TABLE "NguoiDung" ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "resetPasswordTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "NguoiDung_resetPasswordTokenExpiresAt_idx" ON "NguoiDung"("resetPasswordTokenExpiresAt");
