import prisma from "../prisma.js";
import { generateCertificationPdf } from "../utils/councilPdf.js";
import { generateCertificationExcel } from "../utils/councilExcel.js";

const MANAGER_ROLES = new Set(["ADMIN", "GIANGVIEN"]);
const RED_ADDRESS_KEYWORD = "dia chi do";
const GROUP_ONE_TARGET = 50;
const GROUP_TWO_THREE_TARGET = 120;

const normalizeText = (value) => {
  if (!value) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");
};

const containsRedAddressKeyword = (activity) => {
  if (!activity) return false;
  const sources = [activity.tieuDe, activity.moTa];
  return sources.some((source) => {
    const normalized = normalizeText(source);
    return normalized.includes(RED_ADDRESS_KEYWORD);
  });
};

const ensureManager = (req) => {
  const role = req.user?.role;
  if (!MANAGER_ROLES.has(role)) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }
};

const calculateStudentScores = (participations) => {
  const groupOneActivities = [];
  const groupTwoThreeActivities = [];
  let groupOnePoints = 0;
  let groupTwoPoints = 0;
  let groupThreePoints = 0;
  let hasRedAddress = false;

  participations.forEach((entry) => {
    const activity = entry.hoatDong;
    if (!activity) return;

    const points = activity.diemCong ?? 0;
    const group = activity.nhomDiem ?? "NHOM_2";

    if (group === "NHOM_1") {
      groupOnePoints += points;
      groupOneActivities.push({
        title: activity.tieuDe,
        points,
      });
      if (!hasRedAddress && containsRedAddressKeyword(activity)) {
        hasRedAddress = true;
      }
    } else if (group === "NHOM_2") {
      groupTwoPoints += points;
      groupTwoThreeActivities.push({
        title: activity.tieuDe,
        points,
        group: 2,
      });
    } else if (group === "NHOM_3") {
      groupThreePoints += points;
      groupTwoThreeActivities.push({
        title: activity.tieuDe,
        points,
        group: 3,
      });
    }
  });

  // Calculate effective points with overflow logic
  const groupOneEffective = Math.min(groupOnePoints, GROUP_ONE_TARGET);
  const groupOneOverflow = Math.max(groupOnePoints - GROUP_ONE_TARGET, 0);
  const groupTwoThreeRaw = groupTwoPoints + groupThreePoints;
  const groupTwoThreeWithOverflow = groupTwoThreeRaw + groupOneOverflow;
  const groupTwoThreeEffective = Math.min(groupTwoThreeWithOverflow, GROUP_TWO_THREE_TARGET);

  // Determine pass/fail status
  const groupOnePass = groupOneEffective >= GROUP_ONE_TARGET && hasRedAddress;
  const groupTwoThreePass = groupTwoThreeEffective >= GROUP_TWO_THREE_TARGET;
  const overallPass = groupOnePass && groupTwoThreePass;

  return {
    groupOne: {
      raw: groupOnePoints,
      effective: groupOneEffective,
      target: GROUP_ONE_TARGET,
      overflow: groupOneOverflow,
      result: groupOnePass ? "Đạt" : "Không đạt",
      hasRedAddress,
      activities: groupOneActivities,
    },
    groupTwoThree: {
      raw: groupTwoThreeRaw,
      withOverflow: groupTwoThreeWithOverflow,
      effective: groupTwoThreeEffective,
      target: GROUP_TWO_THREE_TARGET,
      result: groupTwoThreePass ? "Đạt" : "Không đạt",
      activities: groupTwoThreeActivities,
    },
    overall: {
      result: overallPass ? "Đủ điều kiện" : "Chưa đủ điều kiện",
      totalPoints: groupOneEffective + groupTwoThreeEffective,
    },
  };
};

const fetchStudentsWithScores = async (filters) => {
  const { facultyCode, search, namHocId, hocKyId } = filters;

  // Build filter for students
  const studentWhere = {
    vaiTro: "SINHVIEN",
    isActive: true,
  };

  if (facultyCode) {
    studentWhere.lopHoc = {
      nganhHoc: {
        khoa: {
          maKhoa: facultyCode
        }
      }
    };
  }

  if (search) {
    studentWhere.OR = [
      { hoTen: { contains: search, mode: "insensitive" } },
      { maSV: { contains: search, mode: "insensitive" } },
    ];
  }

  // Fetch students
  const students = await prisma.nguoiDung.findMany({
    where: studentWhere,
    select: {
      id: true,
      maSV: true,
      hoTen: true,
      lopHoc: {
        select: {
          maLop: true,
          nganhHoc: {
            select: {
              khoa: {
                select: {
                  maKhoa: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: [
      { lopHoc: { nganhHoc: { khoa: { maKhoa: "asc" } } } },
      { lopHoc: { maLop: "asc" } },
      { maSV: "asc" },
    ],
  });

  if (!students.length) {
    return [];
  }

  const studentIds = students.map((s) => s.id);

  // Build activity filter
  const activityFilter = {
    isPublished: true,
  };
  if (namHocId) activityFilter.namHocId = namHocId;
  if (hocKyId) activityFilter.hocKyId = hocKyId;

  // Fetch participations with scores
  const participations = await prisma.dangKyHoatDong.findMany({
    where: {
      nguoiDungId: { in: studentIds },
      trangThai: "DA_THAM_GIA",
      ...(Object.keys(activityFilter).length ? { hoatDong: activityFilter } : {}),
    },
    select: {
      nguoiDungId: true,
      hoatDong: {
        select: {
          tieuDe: true,
          moTa: true,
          diemCong: true,
          nhomDiem: true,
        },
      },
    },
  });

  // Group participations by student
  const participationsByStudent = new Map();
  participations.forEach((p) => {
    if (!participationsByStudent.has(p.nguoiDungId)) {
      participationsByStudent.set(p.nguoiDungId, []);
    }
    participationsByStudent.get(p.nguoiDungId).push(p);
  });

  // Calculate scores for each student
  return students.map((student) => {
    const studentParticipations = participationsByStudent.get(student.id) || [];
    const scores = calculateStudentScores(studentParticipations);

    return {
      studentCode: student.maSV,
      fullName: student.hoTen,
      classCode: student.lopHoc?.maLop,
      facultyCode: student.lopHoc?.nganhHoc?.khoa?.maKhoa,
      groupOnePoints: scores.groupOne.raw,
      groupOneTotalEffective: scores.groupOne.effective,
      groupOneResult: scores.groupOne.result,
      groupTwoThreePoints: scores.groupTwoThree.raw,
      groupOneOverflow: scores.groupOne.overflow,
      groupTwoThreeTotalEffective: scores.groupTwoThree.effective,
      groupTwoThreeResult: scores.groupTwoThree.result,
      overallResult: scores.overall.result,
      certificationDate: null, // TODO: Implement certification tracking
    };
  });
};

/**
 * Lấy danh sách sinh viên đủ điều kiện cấp chứng nhận.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const listStudentsCertifications = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const students = await fetchStudentsWithScores(req.query || {});
  res.json({ students });
};

/**
 * Xuất danh sách chứng nhận ra file PDF.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const exportCertificationPdf = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { facultyCode } = req.query || {};

  // Get faculty name if filtering by faculty
  let facultyName = null;
  if (facultyCode) {
    const faculty = await prisma.khoa.findUnique({
      where: { maKhoa: facultyCode },
      select: { tenKhoa: true },
    });
    facultyName = faculty?.tenKhoa || facultyCode;
  }

  const students = await fetchStudentsWithScores(req.query || {});

  const buffer = await generateCertificationPdf({ students, facultyName });

  const fileName = `ket-qua-chung-nhan-${facultyCode || 'all'}-${Date.now()}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  res.send(buffer);
};

/**
 * Xuất danh sách chứng nhận ra file Excel.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const exportCertificationExcel = async (req, res) => {
  try {
    ensureManager(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { facultyCode } = req.query || {};

  // Get faculty name if filtering by faculty
  let facultyName = null;
  if (facultyCode) {
    const faculty = await prisma.khoa.findUnique({
      where: { maKhoa: facultyCode },
      select: { tenKhoa: true },
    });
    facultyName = faculty?.tenKhoa || facultyCode;
  }

  const students = await fetchStudentsWithScores(req.query || {});

  const buffer = generateCertificationExcel({ students, facultyName });

  const fileName = `ket-qua-chung-nhan-${facultyCode || 'all'}-${Date.now()}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  res.send(buffer);
};

