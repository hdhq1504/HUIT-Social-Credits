import prisma from "../prisma.js";

const assertAdmin = (req) => {
  if (req.user?.role !== "ADMIN") {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }
};

const BACKUP_COLLECTIONS = [
  { key: "users", model: "nguoiDung" },
  { key: "schoolYears", model: "namHoc" },
  { key: "semesters", model: "hocKy" },
  { key: "activities", model: "hoatDong" },
  { key: "registrations", model: "dangKyHoatDong" },
  { key: "checkIns", model: "diemDanhNguoiDung" },
  { key: "feedbacks", model: "phanHoiHoatDong" },
  { key: "faceProfiles", model: "faceProfile" },
  { key: "notifications", model: "thongBao" }
];

const sanitizeRecords = (value) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object");
};

export const createBackup = async (req, res) => {
  try {
    assertAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  try {
    const results = await prisma.$transaction(
      BACKUP_COLLECTIONS.map((collection) => prisma[collection.model].findMany())
    );

    const data = BACKUP_COLLECTIONS.reduce((acc, collection, index) => {
      acc[collection.key] = results[index] || [];
      return acc;
    }, {});

    const counts = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
    );

    const metadata = {
      createdAt: new Date().toISOString(),
      version: "1.0",
      generatedBy: req.user?.sub || null,
      counts
    };

    res.json({ metadata, data });
  } catch (error) {
    res.status(500).json({ error: "Không thể tạo backup dữ liệu." });
  }
};

export const restoreBackup = async (req, res) => {
  try {
    assertAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const payload = req.body && typeof req.body === "object" ? req.body : {};
  const rawData =
    payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)
      ? payload.data
      : payload;

  if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
    return res.status(400).json({ error: "Dữ liệu backup không hợp lệ." });
  }

  const normalized = BACKUP_COLLECTIONS.reduce((acc, collection) => {
    acc[collection.key] = sanitizeRecords(rawData[collection.key]);
    return acc;
  }, {});

  try {
    await prisma.$transaction(async (tx) => {
      await tx.thongBao.deleteMany();
      await tx.faceProfile.deleteMany();
      await tx.diemDanhNguoiDung.deleteMany();
      await tx.phanHoiHoatDong.deleteMany();
      await tx.dangKyHoatDong.deleteMany();
      await tx.hoatDong.deleteMany();
      await tx.hocKy.deleteMany();
      await tx.namHoc.deleteMany();
      await tx.nguoiDung.deleteMany();

      if (normalized.users.length) {
        await tx.nguoiDung.createMany({ data: normalized.users });
      }
      if (normalized.schoolYears.length) {
        await tx.namHoc.createMany({ data: normalized.schoolYears });
      }
      if (normalized.semesters.length) {
        await tx.hocKy.createMany({ data: normalized.semesters });
      }
      if (normalized.activities.length) {
        await tx.hoatDong.createMany({ data: normalized.activities });
      }
      if (normalized.registrations.length) {
        await tx.dangKyHoatDong.createMany({ data: normalized.registrations });
      }
      if (normalized.checkIns.length) {
        await tx.diemDanhNguoiDung.createMany({ data: normalized.checkIns });
      }
      if (normalized.feedbacks.length) {
        await tx.phanHoiHoatDong.createMany({ data: normalized.feedbacks });
      }
      if (normalized.faceProfiles.length) {
        await tx.faceProfile.createMany({ data: normalized.faceProfiles });
      }
      if (normalized.notifications.length) {
        await tx.thongBao.createMany({ data: normalized.notifications });
      }
    });

    const counts = Object.fromEntries(
      Object.entries(normalized).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
    );

    res.json({
      message: "Khôi phục dữ liệu thành công.",
      summary: {
        restoredAt: new Date().toISOString(),
        counts
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Khôi phục dữ liệu thất bại. Vui lòng kiểm tra lại tệp backup." });
  }
};

export default {
  createBackup,
  restoreBackup
};
