-- CreateEnum
CREATE TYPE "TrangThaiHoiDong" AS ENUM ('PREPARING', 'IN_PROGRESS', 'FINALIZED');

-- CreateEnum
CREATE TYPE "KetQuaDanhGiaSinhVien" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateTable
CREATE TABLE "HoiDongXetDiem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "academicYear" TEXT NOT NULL,
    "semesterLabel" TEXT NOT NULL,
    "namHocId" TEXT,
    "hocKyId" TEXT,
    "facultyCode" TEXT,
    "status" "TrangThaiHoiDong" NOT NULL DEFAULT 'PREPARING',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "exportUrl" TEXT,
    "exportPath" TEXT,

    CONSTRAINT "HoiDongXetDiem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThanhVienHoiDong" (
    "id" TEXT NOT NULL,
    "councilId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleInCouncil" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThanhVienHoiDong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DanhGiaSinhVien" (
    "id" TEXT NOT NULL,
    "councilId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "result" "KetQuaDanhGiaSinhVien" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DanhGiaSinhVien_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HoiDongXetDiem_namHocId_idx" ON "HoiDongXetDiem"("namHocId");

-- CreateIndex
CREATE INDEX "HoiDongXetDiem_hocKyId_idx" ON "HoiDongXetDiem"("hocKyId");

-- CreateIndex
CREATE INDEX "HoiDongXetDiem_status_idx" ON "HoiDongXetDiem"("status");

-- CreateIndex
CREATE INDEX "ThanhVienHoiDong_userId_idx" ON "ThanhVienHoiDong"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ThanhVienHoiDong_councilId_userId_key" ON "ThanhVienHoiDong"("councilId", "userId");

-- CreateIndex
CREATE INDEX "DanhGiaSinhVien_studentId_idx" ON "DanhGiaSinhVien"("studentId");

-- CreateIndex
CREATE INDEX "DanhGiaSinhVien_result_idx" ON "DanhGiaSinhVien"("result");

-- CreateIndex
CREATE UNIQUE INDEX "DanhGiaSinhVien_councilId_studentId_key" ON "DanhGiaSinhVien"("councilId", "studentId");

-- AddForeignKey
ALTER TABLE "HoiDongXetDiem" ADD CONSTRAINT "HoiDongXetDiem_namHocId_fkey" FOREIGN KEY ("namHocId") REFERENCES "NamHoc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoiDongXetDiem" ADD CONSTRAINT "HoiDongXetDiem_hocKyId_fkey" FOREIGN KEY ("hocKyId") REFERENCES "HocKy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoiDongXetDiem" ADD CONSTRAINT "HoiDongXetDiem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "NguoiDung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThanhVienHoiDong" ADD CONSTRAINT "ThanhVienHoiDong_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "HoiDongXetDiem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThanhVienHoiDong" ADD CONSTRAINT "ThanhVienHoiDong_userId_fkey" FOREIGN KEY ("userId") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DanhGiaSinhVien" ADD CONSTRAINT "DanhGiaSinhVien_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "HoiDongXetDiem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DanhGiaSinhVien" ADD CONSTRAINT "DanhGiaSinhVien_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "NguoiDung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DanhGiaSinhVien" ADD CONSTRAINT "DanhGiaSinhVien_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "NguoiDung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
