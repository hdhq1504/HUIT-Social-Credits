import prisma from "../prisma.js";
import { generateCouncilPdf } from "../utils/councilPdf.js";

const MANAGER_ROLES = new Set(["ADMIN", "NHANVIEN", "GIANGVIEN"]);
const STATUS_VALUES = new Set(["PREPARING", "IN_PROGRESS", "FINALIZED"]);
const RESULT_VALUES = new Set(["PENDING", "PASSED", "FAILED"]);
const MEMBER_ROLES = new Set(["ADMIN", "NHANVIEN", "GIANGVIEN"]);
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 200;

const sanitizeString = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
};

const normalizeStatus = (value) => {
  const normalized = sanitizeString(value)?.toUpperCase();
  return STATUS_VALUES.has(normalized) ? normalized : undefined;
};

const normalizeResult = (value) => {
  const normalized = sanitizeString(value)?.toUpperCase();
  return RESULT_VALUES.has(normalized) ? normalized : undefined;
};

const normalizePage = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 1;
};

const normalizePageSize = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
};

const ensureManager = (req) => {
  const role = req.user?.role;
  if (!MANAGER_ROLES.has(role)) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }
};

const mapCouncil = (council, summary = {}) => ({
  id: council.id,
  name: council.name,
  description: council.description,
  academicYear: council.academicYear,
  semesterLabel: council.semesterLabel,
  namHocId: council.namHocId,
  hocKyId: council.hocKyId,
  facultyCode: council.facultyCode,
  status: council.status,
  createdAt: council.createdAt,
  updatedAt: council.updatedAt,
  finalizedAt: council.finalizedAt,
  createdBy: council.createdBy
    ? {
      id: council.createdBy.id,
      fullName: council.createdBy.hoTen,
      email: council.createdBy.email,
    }
    : null,
  namHoc: council.namHoc
    ? {
      id: council.namHoc.id,
      name: council.namHoc.ten,
      code: council.namHoc.ma,
      academicYear: council.namHoc.nienKhoa,
    }
    : null,
  hocKy: council.hocKy
    ? {
      id: council.hocKy.id,
      name: council.hocKy.ten,
      code: council.hocKy.ma,
    }
    : null,
  membersCount: council._count?.members ?? 0,
  studentCount: council._count?.evaluations ?? 0,
  stats: {
    pending: summary.PENDING ?? 0,
    passed: summary.PASSED ?? 0,
    failed: summary.FAILED ?? 0,
    total: (summary.PENDING ?? 0) + (summary.PASSED ?? 0) + (summary.FAILED ?? 0),
  },
});

const getCouncilSummaryById = async (councilId) => {
  const results = await prisma.danhGiaSinhVien.groupBy({
    by: ["councilId", "result"],
    where: { councilId },
    _count: { _all: true },
  });
  return results.reduce((acc, entry) => {
    acc[entry.result] = entry._count._all;
    return acc;
  }, {});
};

const getSummaryForCouncils = async (councilIds = []) => {
  if (!councilIds.length) return new Map();
  const summaries = await prisma.danhGiaSinhVien.groupBy({
    by: ["councilId", "result"],
    where: { councilId: { in: councilIds } },
    _count: { _all: true },
  });
  const map = new Map();
  summaries.forEach((entry) => {
    if (!map.has(entry.councilId)) {
      map.set(entry.councilId, {});
    }
    map.get(entry.councilId)[entry.result] = entry._count._all;
  });
  return map;
};

const createEmptyGroupPoints = () => ({ group1: 0, group2: 0, group3: 0 });

const buildGroupPointMap = async (studentIds = []) => {
  if (!studentIds.length) return new Map();
  const participations = await prisma.dangKyHoatDong.findMany({
    where: {
      nguoiDungId: { in: studentIds },
      trangThai: "DA_THAM_GIA",
    },
    select: {
      nguoiDungId: true,
      hoatDong: { select: { diemCong: true, nhomDiem: true } },
    },
  });

  const map = new Map();
  participations.forEach((entry) => {
    if (!entry.hoatDong) return;
    const bucket = map.get(entry.nguoiDungId) ?? createEmptyGroupPoints();
    const points = Number(entry.hoatDong.diemCong) || 0;
    const group = entry.hoatDong.nhomDiem || "NHOM_2";
    if (group === "NHOM_1") bucket.group1 += points;
    else if (group === "NHOM_3") bucket.group3 += points;
    else bucket.group2 += points;
    map.set(entry.nguoiDungId, bucket);
  });
  return map;
};

const mapGroupPointsFromMap = (pointMap, studentId) => {
  const record = pointMap.get(studentId) || createEmptyGroupPoints();
  const group1 = record.group1 || 0;
  const group2 = record.group2 || 0;
  const group3 = record.group3 || 0;
  return {
    group1,
    group2,
    group3,
    group23: group2 + group3,
  };
};

export const listCouncils = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { academicYear, semesterLabel, namHocId, hocKyId, facultyCode, status } = req.query || {};
  const where = {
    ...(sanitizeString(academicYear) ? { academicYear: sanitizeString(academicYear) } : {}),
    ...(sanitizeString(semesterLabel) ? { semesterLabel: sanitizeString(semesterLabel) } : {}),
    ...(sanitizeString(facultyCode) ? { facultyCode: sanitizeString(facultyCode) } : {}),
    ...(sanitizeString(namHocId) ? { namHocId: sanitizeString(namHocId) } : {}),
    ...(sanitizeString(hocKyId) ? { hocKyId: sanitizeString(hocKyId) } : {}),
    ...(normalizeStatus(status) ? { status: normalizeStatus(status) } : {}),
  };

  const councils = await prisma.hoiDongXetDiem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, hoTen: true, email: true } },
      namHoc: { select: { id: true, ten: true, nienKhoa: true, ma: true } },
      hocKy: { select: { id: true, ten: true, ma: true } },
      _count: { select: { members: true, evaluations: true } },
    },
  });

  const summaryMap = await getSummaryForCouncils(councils.map((c) => c.id));
  const data = councils.map((council) => mapCouncil(council, summaryMap.get(council.id)));

  res.json({ councils: data, filters: { academicYear, semesterLabel, namHocId, hocKyId, facultyCode, status } });
};

export const createCouncil = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const name = sanitizeString(req.body?.name);
  const academicYear = sanitizeString(req.body?.academicYear);
  const semester = sanitizeString(req.body?.semester);
  const faculty = sanitizeString(req.body?.facultyCode);
  const description = sanitizeString(req.body?.description);
  const namHocId = sanitizeString(req.body?.namHocId);
  const hocKyId = sanitizeString(req.body?.hocKyId);

  if (!name || !academicYear || !semester) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ tên hội đồng, năm học và học kỳ." });
  }

  const duplicate = await prisma.hoiDongXetDiem.findFirst({
    where: {
      academicYear,
      semesterLabel: semester,
      ...(faculty ? { facultyCode: faculty } : { facultyCode: null }),
      status: { not: "FINALIZED" },
    },
  });

  if (duplicate) {
    return res.status(409).json({ error: "Đã tồn tại hội đồng cho phạm vi này." });
  }

  const council = await prisma.hoiDongXetDiem.create({
    data: {
      name,
      academicYear,
      semesterLabel: semester,
      facultyCode: faculty,
      description,
      namHocId,
      hocKyId,
      createdById: req.user.sub,
    },
    include: {
      createdBy: { select: { id: true, hoTen: true, email: true } },
      namHoc: { select: { id: true, ten: true, nienKhoa: true, ma: true } },
      hocKy: { select: { id: true, ten: true, ma: true } },
      _count: { select: { members: true, evaluations: true } },
    },
  });

  res.status(201).json(mapCouncil(council));
};

export const getCouncilById = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;
  const council = await prisma.hoiDongXetDiem.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, hoTen: true, email: true } },
      namHoc: { select: { id: true, ten: true, nienKhoa: true, ma: true } },
      hocKy: { select: { id: true, ten: true, ma: true } },
      members: {
        include: { user: { select: { id: true, hoTen: true, email: true, vaiTro: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { members: true, evaluations: true } },
    },
  });

  if (!council) {
    return res.status(404).json({ error: "Không tìm thấy hội đồng." });
  }

  const summary = await getCouncilSummaryById(council.id);
  const response = mapCouncil(council, summary);
  response.members = council.members.map((member) => ({
    id: member.id,
    userId: member.userId,
    fullName: member.user?.hoTen,
    email: member.user?.email,
    systemRole: member.user?.vaiTro,
    roleInCouncil: member.roleInCouncil,
    createdAt: member.createdAt,
  }));

  res.json(response);
};

export const updateCouncil = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;
  const council = await prisma.hoiDongXetDiem.findUnique({
    where: { id },
    include: { _count: { select: { evaluations: true } } },
  });

  if (!council) {
    return res.status(404).json({ error: "Không tìm thấy hội đồng." });
  }

  if (council.status === "FINALIZED") {
    return res.status(400).json({ error: "Hội đồng đã chốt kết quả, không thể chỉnh sửa." });
  }

  const updates = {};
  if (sanitizeString(req.body?.name)) updates.name = sanitizeString(req.body.name);
  if (sanitizeString(req.body?.description) !== undefined) updates.description = sanitizeString(req.body.description);
  if (sanitizeString(req.body?.facultyCode) !== undefined) updates.facultyCode = sanitizeString(req.body.facultyCode);

  const newAcademicYear = sanitizeString(req.body?.academicYear);
  const newSemester = sanitizeString(req.body?.semester);
  if ((newAcademicYear || newSemester) && council._count.evaluations > 0) {
    return res.status(400).json({ error: "Không thể thay đổi năm học hoặc học kỳ khi đã có sinh viên." });
  }
  if (newAcademicYear) updates.academicYear = newAcademicYear;
  if (newSemester) updates.semesterLabel = newSemester;

  const newNamHocId = sanitizeString(req.body?.namHocId);
  const newHocKyId = sanitizeString(req.body?.hocKyId);
  if ((newNamHocId || newHocKyId) && council._count.evaluations > 0) {
    return res.status(400).json({ error: "Không thể thay đổi niên khóa/học kỳ khi đã có sinh viên." });
  }
  if (newNamHocId !== undefined) updates.namHocId = newNamHocId;
  if (newHocKyId !== undefined) updates.hocKyId = newHocKyId;

  const nextStatus = normalizeStatus(req.body?.status);
  if (nextStatus && nextStatus !== council.status) {
    updates.status = nextStatus;
  }

  const updated = await prisma.hoiDongXetDiem.update({
    where: { id },
    data: updates,
    include: {
      createdBy: { select: { id: true, hoTen: true, email: true } },
      namHoc: { select: { id: true, ten: true, nienKhoa: true, ma: true } },
      hocKy: { select: { id: true, ten: true, ma: true } },
      _count: { select: { members: true, evaluations: true } },
    },
  });

  const summary = await getCouncilSummaryById(updated.id);
  res.json(mapCouncil(updated, summary));
};

export const addCouncilMembers = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;
  const council = await prisma.hoiDongXetDiem.findUnique({ where: { id } });
  if (!council) {
    return res.status(404).json({ error: "Không tìm thấy hội đồng." });
  }
  if (council.status === "FINALIZED") {
    return res.status(400).json({ error: "Hội đồng đã chốt kết quả." });
  }

  const membersInput = Array.isArray(req.body?.members)
    ? req.body.members
    : Array.isArray(req.body?.userIds)
      ? req.body.userIds.map((userId) => ({ userId, roleInCouncil: req.body?.roleInCouncil || "Thành viên" }))
      : [];

  const prepared = membersInput
    .map((member) => ({
      userId: sanitizeString(member.userId),
      roleInCouncil: sanitizeString(member.roleInCouncil) || "Thành viên",
    }))
    .filter((member) => member.userId);

  if (!prepared.length) {
    return res.status(400).json({ error: "Vui lòng chọn thành viên hợp lệ." });
  }

  const users = await prisma.nguoiDung.findMany({
    where: {
      id: { in: prepared.map((m) => m.userId) },
      vaiTro: { in: Array.from(MEMBER_ROLES) },
      isActive: true,
    },
    select: { id: true },
  });

  const validIds = new Set(users.map((u) => u.id));
  const createPayload = prepared
    .filter((entry) => validIds.has(entry.userId))
    .map((entry) => ({ councilId: id, userId: entry.userId, roleInCouncil: entry.roleInCouncil }));

  if (!createPayload.length) {
    return res.status(400).json({ error: "Không tìm thấy thành viên phù hợp để thêm." });
  }

  await prisma.thanhVienHoiDong.createMany({ data: createPayload, skipDuplicates: true });

  const members = await prisma.thanhVienHoiDong.findMany({
    where: { councilId: id },
    include: { user: { select: { id: true, hoTen: true, email: true, vaiTro: true } } },
    orderBy: { createdAt: "asc" },
  });

  res.status(201).json({
    members: members.map((member) => ({
      id: member.id,
      userId: member.userId,
      fullName: member.user?.hoTen,
      email: member.user?.email,
      systemRole: member.user?.vaiTro,
      roleInCouncil: member.roleInCouncil,
      createdAt: member.createdAt,
    })),
  });
};

export const removeCouncilMember = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id, memberId } = req.params;
  const council = await prisma.hoiDongXetDiem.findUnique({ where: { id } });
  if (!council) {
    return res.status(404).json({ error: "Không tìm thấy hội đồng." });
  }
  if (council.status === "FINALIZED") {
    return res.status(400).json({ error: "Hội đồng đã chốt kết quả." });
  }

  await prisma.thanhVienHoiDong.deleteMany({ where: { id: memberId, councilId: id } });
  res.json({ success: true });
};

export const searchEligibleMembers = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
  const search = sanitizeString(req.query?.search);
  const limit = Math.min(Number.parseInt(req.query?.limit ?? "20", 10) || 20, 50);

  const where = {
    vaiTro: { in: Array.from(MEMBER_ROLES) },
    isActive: true,
  };
  if (search) {
    where.OR = [
      { hoTen: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { maCB: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.nguoiDung.findMany({
    where,
    orderBy: { hoTen: "asc" },
    take: limit,
    select: { id: true, hoTen: true, email: true, vaiTro: true },
  });

  res.json({
    users: users.map((user) => ({
      id: user.id,
      fullName: user.hoTen,
      email: user.email,
      role: user.vaiTro,
    })),
  });
};

export const importCouncilStudents = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;
  const { facultyCode, classCode, namHocId, hocKyId } = req.body || {};

  const council = await prisma.hoiDongXetDiem.findUnique({ where: { id } });
  if (!council) {
    return res.status(404).json({ error: "Không tìm thấy hội đồng." });
  }
  if (council.status === "FINALIZED") {
    return res.status(400).json({ error: "Hội đồng đã chốt kết quả." });
  }

  const studentWhere = {
    vaiTro: "SINHVIEN",
    isActive: true,
    ...(sanitizeString(facultyCode) ? { maKhoa: sanitizeString(facultyCode) } : {}),
    ...(sanitizeString(classCode) ? { maLop: sanitizeString(classCode) } : {}),
  };

  const students = await prisma.nguoiDung.findMany({
    where: studentWhere,
    select: { id: true },
  });

  if (!students.length) {
    return res.status(200).json({ imported: 0, skipped: 0, totalCandidates: 0 });
  }

  const studentIds = students.map((student) => student.id);

  const existingEvaluations = await prisma.danhGiaSinhVien.findMany({
    where: { councilId: id, studentId: { in: studentIds } },
    select: { studentId: true },
  });
  const existingSet = new Set(existingEvaluations.map((evaluation) => evaluation.studentId));

  const activityFilter = {};
  if (sanitizeString(hocKyId)) activityFilter.hocKyId = sanitizeString(hocKyId);
  if (sanitizeString(namHocId)) activityFilter.namHocId = sanitizeString(namHocId);

  const participations = await prisma.dangKyHoatDong.findMany({
    where: {
      nguoiDungId: { in: studentIds },
      trangThai: "DA_THAM_GIA",
      ...(Object.keys(activityFilter).length ? { hoatDong: activityFilter } : {}),
    },
    select: { nguoiDungId: true, hoatDong: { select: { diemCong: true } } },
  });

  const pointMap = new Map();
  participations.forEach((entry) => {
    const key = entry.nguoiDungId;
    const points = Number(entry.hoatDong?.diemCong) || 0;
    pointMap.set(key, (pointMap.get(key) || 0) + points);
  });

  const payload = studentIds
    .filter((studentId) => !existingSet.has(studentId))
    .map((studentId) => ({
      councilId: id,
      studentId,
      totalPoints: pointMap.get(studentId) || 0,
    }));

  if (!payload.length) {
    return res.status(200).json({ imported: 0, skipped: students.length, totalCandidates: students.length });
  }

  const result = await prisma.danhGiaSinhVien.createMany({ data: payload, skipDuplicates: true });

  if (council.status === "PREPARING") {
    await prisma.hoiDongXetDiem.update({ where: { id }, data: { status: "IN_PROGRESS" } });
  }

  res.status(201).json({
    imported: result.count,
    skipped: students.length - result.count,
    totalCandidates: students.length,
  });
};

export const listCouncilStudents = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;
  const council = await prisma.hoiDongXetDiem.findUnique({ where: { id } });
  if (!council) {
    return res.status(404).json({ error: "Không tìm thấy hội đồng." });
  }

  const { classCode, result: resultFilter, search } = req.query || {};
  const currentPage = normalizePage(req.query?.page);
  const pageSize = normalizePageSize(req.query?.pageSize);
  const skip = (currentPage - 1) * pageSize;
  const normalizedResult = normalizeResult(resultFilter);

  const where = {
    councilId: id,
    ...(normalizedResult ? { result: normalizedResult } : {}),
    ...(sanitizeString(classCode)
      ? { student: { is: { maLop: sanitizeString(classCode) } } }
      : {}),
  };
  if (sanitizeString(search)) {
    where.OR = [
      { student: { is: { hoTen: { contains: sanitizeString(search), mode: "insensitive" } } } },
      { student: { is: { maSV: { contains: sanitizeString(search), mode: "insensitive" } } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.danhGiaSinhVien.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        student: {
          select: {
            id: true,
            hoTen: true,
            email: true,
            maSV: true,
            maLop: true,
            maKhoa: true,
          },
        },
        updatedBy: { select: { id: true, hoTen: true } },
      },
    }),
    prisma.danhGiaSinhVien.count({ where }),
  ]);

  const studentIds = items.map((item) => item.studentId).filter(Boolean);
  const [summary, groupPointMap] = await Promise.all([
    getCouncilSummaryById(id),
    buildGroupPointMap(studentIds),
  ]);

  const payloadItems = items.map((item) => ({
      id: item.id,
      studentId: item.studentId,
      student: {
        id: item.student?.id,
        fullName: item.student?.hoTen,
        studentCode: item.student?.maSV,
        classCode: item.student?.maLop,
        facultyCode: item.student?.maKhoa,
        email: item.student?.email,
      },
      totalPoints: item.totalPoints,
      result: item.result,
      note: item.note,
      updatedBy: item.updatedBy ? { id: item.updatedBy.id, fullName: item.updatedBy.hoTen } : null,
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
      groupPoints: mapGroupPointsFromMap(groupPointMap, item.studentId),
    }));

  res.json({
    items: payloadItems,
    pagination: {
      page: currentPage,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize) || 0,
    },
    summary: {
      pending: summary.PENDING ?? 0,
      passed: summary.PASSED ?? 0,
      failed: summary.FAILED ?? 0,
      total: (summary.PENDING ?? 0) + (summary.PASSED ?? 0) + (summary.FAILED ?? 0),
    },
  });
};

export const updateCouncilStudent = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id, evaluationId } = req.params;
  const council = await prisma.hoiDongXetDiem.findUnique({ where: { id } });
  if (!council) {
    return res.status(404).json({ error: "Không tìm thấy hội đồng." });
  }
  if (council.status === "FINALIZED") {
    return res.status(400).json({ error: "Hội đồng đã chốt kết quả." });
  }

  const evaluationRecord = await prisma.danhGiaSinhVien.findUnique({
    where: { id: evaluationId },
    select: { councilId: true },
  });

  if (!evaluationRecord || evaluationRecord.councilId !== id) {
    return res.status(404).json({ error: "Không tìm thấy sinh viên trong hội đồng." });
  }

  const result = normalizeResult(req.body?.result);
  if (!result) {
    return res.status(400).json({ error: "Trạng thái xét duyệt không hợp lệ." });
  }

  const note = sanitizeString(req.body?.note);
  if (result === "FAILED" && !note) {
    return res.status(400).json({ error: "Vui lòng nhập lý do khi đánh dấu không đạt." });
  }

  const evaluation = await prisma.danhGiaSinhVien.update({
    where: { id: evaluationId },
    data: {
      result,
      note: result === "FAILED" ? note : null,
      updatedById: req.user.sub,
      updatedAt: new Date(),
    },
    include: {
      student: {
        select: { id: true, hoTen: true, maSV: true, maLop: true, maKhoa: true, email: true },
      },
      updatedBy: { select: { id: true, hoTen: true } },
    },
  });

  const summary = await getCouncilSummaryById(id);

  res.json({
    evaluation: {
      id: evaluation.id,
      studentId: evaluation.studentId,
      student: {
        id: evaluation.student?.id,
        fullName: evaluation.student?.hoTen,
        studentCode: evaluation.student?.maSV,
        classCode: evaluation.student?.maLop,
        facultyCode: evaluation.student?.maKhoa,
        email: evaluation.student?.email,
      },
      totalPoints: evaluation.totalPoints,
      result: evaluation.result,
      note: evaluation.note,
      updatedBy: evaluation.updatedBy ? { id: evaluation.updatedBy.id, fullName: evaluation.updatedBy.hoTen } : null,
      updatedAt: evaluation.updatedAt,
    },
    summary,
  });
};

export const finalizeCouncil = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;
  const council = await prisma.hoiDongXetDiem.findUnique({ where: { id } });
  if (!council) {
    return res.status(404).json({ error: "Không tìm thấy hội đồng." });
  }
  if (council.status === "FINALIZED") {
    return res.status(400).json({ error: "Hội đồng đã chốt kết quả." });
  }

  const updated = await prisma.hoiDongXetDiem.update({
    where: { id },
    data: { status: "FINALIZED", finalizedAt: new Date() },
    include: {
      createdBy: { select: { id: true, hoTen: true, email: true } },
      namHoc: { select: { id: true, ten: true, nienKhoa: true, ma: true } },
      hocKy: { select: { id: true, ten: true, ma: true } },
      _count: { select: { members: true, evaluations: true } },
    },
  });

  const summary = await getCouncilSummaryById(updated.id);
  res.json(mapCouncil(updated, summary));
};

export const exportCouncilReport = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;
  const council = await prisma.hoiDongXetDiem.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, hoTen: true, vaiTro: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!council) {
    return res.status(404).json({ error: "Không tìm thấy hội đồng." });
  }

  if (council.status !== "FINALIZED") {
    return res.status(400).json({ error: "Vui lòng chốt kết quả trước khi xuất PDF." });
  }

  const evaluations = await prisma.danhGiaSinhVien.findMany({
    where: { councilId: id },
    orderBy: [{ student: { maLop: "asc" } }, { student: { maSV: "asc" } }],
    include: {
      student: { select: { hoTen: true, maSV: true, maLop: true, maKhoa: true } },
    },
  });

  const buffer = await generateCouncilPdf({ council, evaluations });
  const fileName = `bien-ban-hoi-dong-${id}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  res.send(buffer);
};

export const exportCouncilDataset = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;
  const council = await prisma.hoiDongXetDiem.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, hoTen: true, email: true } },
      namHoc: { select: { id: true, ten: true, nienKhoa: true, ma: true } },
      hocKy: { select: { id: true, ten: true, ma: true } },
      members: {
        include: { user: { select: { id: true, hoTen: true, vaiTro: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { members: true, evaluations: true } },
    },
  });

  if (!council) {
    return res.status(404).json({ error: "Không tìm thấy hội đồng." });
  }

  if (council.status !== "FINALIZED") {
    return res.status(400).json({ error: "Vui lòng chốt kết quả trước khi xuất dữ liệu." });
  }

  const evaluations = await prisma.danhGiaSinhVien.findMany({
    where: { councilId: id },
    orderBy: [{ student: { maLop: "asc" } }, { student: { maSV: "asc" } }],
    include: {
      student: { select: { hoTen: true, maSV: true, maLop: true, maKhoa: true, email: true, id: true } },
      updatedBy: { select: { id: true, hoTen: true } },
    },
  });

  const studentIds = evaluations.map((entry) => entry.studentId).filter(Boolean);
  const [summary, groupPointMap] = await Promise.all([
    getCouncilSummaryById(id),
    buildGroupPointMap(studentIds),
  ]);

  const dataset = evaluations.map((evaluation, index) => ({
    id: evaluation.id,
    order: index + 1,
    studentId: evaluation.studentId,
    student: {
      id: evaluation.student?.id,
      fullName: evaluation.student?.hoTen,
      studentCode: evaluation.student?.maSV,
      classCode: evaluation.student?.maLop,
      facultyCode: evaluation.student?.maKhoa,
      email: evaluation.student?.email,
    },
    totalPoints: evaluation.totalPoints,
    result: evaluation.result,
    note: evaluation.note,
    groupPoints: mapGroupPointsFromMap(groupPointMap, evaluation.studentId),
    updatedBy: evaluation.updatedBy ? { id: evaluation.updatedBy.id, fullName: evaluation.updatedBy.hoTen } : null,
    updatedAt: evaluation.updatedAt,
    createdAt: evaluation.createdAt,
  }));

  res.json({ council: mapCouncil(council, summary), students: dataset });
};