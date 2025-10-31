-- CreateTable
CREATE TABLE "ThongBao" (
    "id" TEXT NOT NULL,
    "nguoiDungId" TEXT NOT NULL,
    "tieuDe" TEXT NOT NULL,
    "noiDung" TEXT NOT NULL,
    "loai" VARCHAR(30) NOT NULL,
    "duLieu" JSONB,
    "daDoc" BOOLEAN NOT NULL DEFAULT false,
    "daDocLuc" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThongBao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ThongBao_nguoiDungId_daDoc_idx" ON "ThongBao"("nguoiDungId", "daDoc");

-- CreateIndex
CREATE INDEX "ThongBao_nguoiDungId_createdAt_idx" ON "ThongBao"("nguoiDungId", "createdAt");

-- AddForeignKey
ALTER TABLE "ThongBao" ADD CONSTRAINT "ThongBao_nguoiDungId_fkey" FOREIGN KEY ("nguoiDungId") REFERENCES "NguoiDung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
