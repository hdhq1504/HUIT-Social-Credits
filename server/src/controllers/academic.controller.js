import prisma from "../prisma.js";
import { mapAcademicYearRecord, mapSemesterRecord } from "../utils/academic.js";

const MANAGER_ROLES = new Set(["ADMIN"]);

const ensureAdmin = (req) => {
  if (!MANAGER_ROLES.has(req.user?.role)) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }
};

const sanitizeString = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
};

const parseDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};

export const listSemesters = async (_req, res) => {
  const academicYears = await prisma.namHoc.findMany({
    include: {
      hocKy: {
        orderBy: [{ thuTu: "asc" }, { batDau: "asc" }]
      }
    },
    orderBy: [{ batDau: "desc" }]
  });

  const years = academicYears.map(mapAcademicYearRecord).filter(Boolean);
  const semesters = years.flatMap((year) =>
    year.semesters.map((semester) => ({
      ...semester,
      academicYearLabel: year.label,
      academicYearId: year.id,
      academicYearCode: year.code,
      academicYearRange: {
        startDate: year.startDate,
        endDate: year.endDate
      }
    }))
  );

  res.json({ academicYears: years, semesters });
};

export const listAcademicYears = async (_req, res) => {
  const academicYears = await prisma.namHoc.findMany({
    include: {
      hocKy: {
        orderBy: [{ thuTu: "asc" }, { batDau: "asc" }]
      }
    },
    orderBy: [{ batDau: "desc" }]
  });

  res.json({ academicYears: academicYears.map(mapAcademicYearRecord).filter(Boolean) });
};

export const resolveAcademicPeriod = async (req, res) => {
  const { date } = req.query;
  const target = date ? new Date(date) : null;
  if (!target || Number.isNaN(target.getTime())) {
    return res.status(400).json({ error: "Tham số 'date' không hợp lệ" });
  }

  const semester = await prisma.hocKy.findFirst({
    where: {
      isActive: true,
      batDau: { lte: target },
      ketThuc: { gte: target }
    },
    include: { namHoc: true },
    orderBy: [{ batDau: "desc" }, { thuTu: "asc" }]
  });

  if (!semester) {
    return res.json({ semester: null, academicYear: null });
  }

  const mappedSemester = mapSemesterRecord(semester);
  res.json({ semester: mappedSemester });
};

export const updateAcademicYear = async (req, res) => {
  try {
    ensureAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;
  if (!sanitizeString(id)) {
    return res.status(400).json({ error: "Thiếu mã năm học." });
  }

  const label = sanitizeString(req.body?.label);
  const code = sanitizeString(req.body?.code);
  const startDate = parseDate(req.body?.startDate);
  const endDate = parseDate(req.body?.endDate);
  const isActive = typeof req.body?.isActive === "boolean" ? req.body.isActive : undefined;

  const updates = {};
  if (code) updates.ma = code;
  if (label) {
    updates.ten = label;
    updates.nienKhoa = label;
  }
  if (startDate) updates.batDau = startDate;
  if (endDate) updates.ketThuc = endDate;
  if (isActive !== undefined) updates.isActive = isActive;

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: "Không có dữ liệu cần cập nhật." });
  }

  try {
    const updated = await prisma.namHoc.update({
      where: { id },
      data: updates,
      include: {
        hocKy: { orderBy: [{ thuTu: "asc" }, { batDau: "asc" }] },
      },
    });
    res.json({ academicYear: mapAcademicYearRecord(updated) });
  } catch (error) {
    res.status(400).json({ error: error.message || "Không thể cập nhật năm học." });
  }
};

export const updateSemester = async (req, res) => {
  try {
    ensureAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;
  if (!sanitizeString(id)) {
    return res.status(400).json({ error: "Thiếu mã học kỳ." });
  }

  const label = sanitizeString(req.body?.label);
  const code = sanitizeString(req.body?.code);
  const description = req.body?.description !== undefined ? sanitizeString(req.body.description) : undefined;
  const startDate = parseDate(req.body?.startDate);
  const endDate = parseDate(req.body?.endDate);
  const isActive = typeof req.body?.isActive === "boolean" ? req.body.isActive : undefined;

  const updates = {};
  if (code) updates.ma = code;
  if (label) updates.ten = label;
  if (description !== undefined) updates.moTa = description;
  if (startDate) updates.batDau = startDate;
  if (endDate) updates.ketThuc = endDate;
  if (isActive !== undefined) updates.isActive = isActive;

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: "Không có dữ liệu cần cập nhật." });
  }

  try {
    const updated = await prisma.hocKy.update({
      where: { id },
      data: updates,
      include: { namHoc: true },
    });
    res.json({ semester: mapSemesterRecord(updated) });
  } catch (error) {
    res.status(400).json({ error: error.message || "Không thể cập nhật học kỳ." });
  }
};

export default {
  listSemesters,
  listAcademicYears,
  resolveAcademicPeriod,
  updateAcademicYear,
  updateSemester
};