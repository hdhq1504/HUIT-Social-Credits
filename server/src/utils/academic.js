import prisma from "../prisma.js";

const toDate = (value) => {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  const date = value ? new Date(value) : null;
  return Number.isNaN(date?.getTime()) ? null : date;
};

const FALL_SEMESTER_TRANSITION_DAY = 15;
const SUMMER_SEMESTER_START_DAY = 16;

const deriveStaticSemester = (value) => {
  const date = toDate(value);
  if (!date) {
    return { semester: null, academicYear: null };
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  let semester;

  if (month === 8) {
    semester = day >= FALL_SEMESTER_TRANSITION_DAY ? "Học kỳ 1" : "Học kỳ 3";
  } else if (month >= 9 && month <= 12) {
    semester = "Học kỳ 1";
  } else if (month === 1) {
    semester = "Học kỳ 1";
  } else if (month >= 2 && month <= 5) {
    semester = "Học kỳ 2";
  } else if (month === 6) {
    semester = day >= SUMMER_SEMESTER_START_DAY ? "Học kỳ 3" : "Học kỳ 2";
  } else if (month === 7) {
    semester = "Học kỳ 3";
  } else {
    semester = "Học kỳ 3";
  }

  const startsNewAcademicYear = month > 8 || (month === 8 && day >= FALL_SEMESTER_TRANSITION_DAY);
  const startYear = startsNewAcademicYear ? date.getFullYear() : date.getFullYear() - 1;
  const academicYear = `${startYear}-${startYear + 1}`;

  return { semester, academicYear };
};

/**
 * Xác định thông tin học kỳ dựa trên ngày tháng.
 * @param {Date|string|number} value - Ngày cần xác định.
 * @returns {Object} Thông tin học kỳ và năm học.
 */
export const deriveSemesterInfo = (value) => deriveStaticSemester(value);

const mapAcademicYearLabel = (year) => {
  if (!year) return null;
  if (typeof year.ten === "string" && year.ten.trim()) return year.ten.trim();
  if (typeof year.nienKhoa === "string" && year.nienKhoa.trim()) return year.nienKhoa.trim();
  if (typeof year.ma === "string" && year.ma.trim()) return year.ma.trim();
  return null;
};

const normalizeIso = (value) => {
  const date = toDate(value);
  return date ? date.toISOString() : null;
};

/**
 * Xác định học kỳ và năm học dựa trên ngày, có tra cứu database.
 * @param {Date|string|number} value - Ngày cần xác định.
 * @returns {Promise<Object>} Thông tin chi tiết về học kỳ và năm học.
 */
export const resolveAcademicPeriodForDate = async (value) => {
  const targetDate = toDate(value);
  if (!targetDate) {
    return { hocKy: null, hocKyId: null, namHoc: null, namHocId: null };
  }

  const semester = await prisma.hocKy.findFirst({
    where: {
      isActive: true,
      batDau: { lte: targetDate },
      ketThuc: { gte: targetDate }
    },
    include: { namHoc: true },
    orderBy: [{ batDau: "desc" }, { thuTu: "asc" }]
  });

  if (semester) {
    const academicYear = semester.namHoc;
    return {
      hocKy: semester.ten?.trim() || null,
      hocKyId: semester.id,
      namHoc: mapAcademicYearLabel(academicYear),
      namHocId: academicYear?.id ?? null,
      hocKyRange: {
        startDate: normalizeIso(semester.batDau),
        endDate: normalizeIso(semester.ketThuc)
      },
      academicYearRange: {
        startDate: normalizeIso(academicYear?.batDau),
        endDate: normalizeIso(academicYear?.ketThuc)
      }
    };
  }

  const fallback = deriveStaticSemester(targetDate);
  return {
    hocKy: fallback.semester,
    hocKyId: null,
    namHoc: fallback.academicYear,
    namHocId: null,
    hocKyRange: null,
    academicYearRange: null
  };
};

/**
 * Map dữ liệu học kỳ từ database sang format API.
 * @param {Object} semester - Record học kỳ từ Prisma.
 * @param {Object} academicYear - Record năm học tương ứng.
 * @returns {Object|null} Object học kỳ đã format.
 */
export const mapSemesterRecord = (semester, academicYear) => {
  if (!semester) return null;
  const year = academicYear || semester.namHoc || null;

  return {
    id: semester.id,
    code: semester.ma,
    label: semester.ten,
    order: semester.thuTu,
    description: semester.moTa,
    startDate: normalizeIso(semester.batDau),
    endDate: normalizeIso(semester.ketThuc),
    isActive: semester.isActive,
    academicYearId: year?.id ?? null,
    academicYearCode: year?.ma ?? null,
    academicYearLabel: mapAcademicYearLabel(year),
    academicYearRange: {
      startDate: normalizeIso(year?.batDau),
      endDate: normalizeIso(year?.ketThuc)
    }
  };
};

/**
 * Map dữ liệu năm học từ database sang format API.
 * @param {Object} year - Record năm học từ Prisma.
 * @returns {Object|null} Object năm học đã format.
 */
export const mapAcademicYearRecord = (year) => {
  if (!year) return null;
  return {
    id: year.id,
    code: year.ma,
    label: mapAcademicYearLabel(year),
    startDate: normalizeIso(year.batDau),
    endDate: normalizeIso(year.ketThuc),
    isActive: year.isActive,
    createdAt: normalizeIso(year.createdAt),
    updatedAt: normalizeIso(year.updatedAt),
    semesters: Array.isArray(year.hocKy)
      ? year.hocKy.map((semester) => mapSemesterRecord(semester, year)).filter(Boolean)
      : []
  };
};

export default deriveSemesterInfo;