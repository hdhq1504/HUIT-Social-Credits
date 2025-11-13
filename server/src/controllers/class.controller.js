import prisma from "../prisma.js";
import { fetchFacultyClassFilters } from "../utils/facultyFilters.js";

const safeTrim = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const roundNumber = (value, precision = 2) => {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export const listTeacherClasses = async (req, res) => {
  const userId = req.user?.sub;
  const role = req.user?.role;

  if (!userId || role !== "GIANGVIEN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const [classRecords, filterOptions] = await Promise.all([
    prisma.lop.findMany({
      where: { chuNhiemId: userId, isActive: true },
      include: {
        khoa: { select: { id: true, ma: true, ten: true } }
      },
      orderBy: [{ ma: "asc" }, { ten: "asc" }]
    }),
    fetchFacultyClassFilters({ teacherId: userId })
  ]);

  if (!classRecords.length) {
    return res.json({
      classes: [],
      summary: { totalClasses: 0, totalStudents: 0, totalPoints: 0, averagePointsPerStudent: 0 },
      filters: filterOptions,
    });
  }

  const classIdMap = new Map();
  const classCodeMap = new Map();

  classRecords.forEach((record) => {
    classIdMap.set(record.id, []);
    const code = safeTrim(record.ma);
    if (code) {
      classCodeMap.set(code, record.id);
    }
  });

  const classIds = Array.from(classIdMap.keys());
  const classCodes = Array.from(classCodeMap.keys());

  const students = await prisma.nguoiDung.findMany({
    where: {
      vaiTro: "SINHVIEN",
      OR: [
        { lopId: { in: classIds } },
        classCodes.length ? { maLop: { in: classCodes } } : undefined
      ].filter(Boolean)
    },
    select: {
      id: true,
      hoTen: true,
      email: true,
      maSV: true,
      maLop: true,
      maKhoa: true,
      avatarUrl: true,
      lopId: true
    }
  });

  const studentIds = students.map((student) => student.id);

  const attendance = studentIds.length
    ? await prisma.dangKyHoatDong.findMany({
        where: {
          nguoiDungId: { in: studentIds },
          trangThai: "DA_THAM_GIA"
        },
        select: {
          nguoiDungId: true,
          hoatDong: { select: { diemCong: true } }
        }
      })
    : [];

  const pointMap = new Map();
  attendance.forEach((entry) => {
    const current = pointMap.get(entry.nguoiDungId) ?? 0;
    const points = Number(entry.hoatDong?.diemCong) || 0;
    pointMap.set(entry.nguoiDungId, current + points);
  });

  students.forEach((student) => {
    let targetClassId = student.lopId && classIdMap.has(student.lopId) ? student.lopId : null;
    if (!targetClassId) {
      const classCode = safeTrim(student.maLop);
      if (classCode && classCodeMap.has(classCode)) {
        targetClassId = classCodeMap.get(classCode);
      }
    }

    if (targetClassId && classIdMap.has(targetClassId)) {
      classIdMap.get(targetClassId).push(student);
    }
  });

  let totalStudents = 0;
  let totalPoints = 0;

  const classes = classRecords.map((record) => {
    const classStudents = classIdMap.get(record.id) || [];
    const faculty = record.khoa;
    const classPointSum = classStudents.reduce((acc, student) => acc + (pointMap.get(student.id) ?? 0), 0);

    totalStudents += classStudents.length;
    totalPoints += classPointSum;

    return {
      id: record.id,
      code: safeTrim(record.ma),
      name: safeTrim(record.ten) ?? safeTrim(record.ma),
      faculty: faculty
        ? {
            id: faculty.id,
            code: safeTrim(faculty.ma),
            name: safeTrim(faculty.ten) ?? safeTrim(faculty.ma)
          }
        : null,
      studentCount: classStudents.length,
      totalPoints: classPointSum,
      students: classStudents.map((student) => ({
        id: student.id,
        name: safeTrim(student.hoTen) ?? "Sinh viên",
        email: safeTrim(student.email),
        studentCode: safeTrim(student.maSV),
        classCode: safeTrim(student.maLop) ?? safeTrim(record.ma),
        facultyCode: safeTrim(student.maKhoa) ?? safeTrim(faculty?.ma),
        avatarUrl: student.avatarUrl ?? null,
        totalPoints: pointMap.get(student.id) ?? 0
      }))
    };
  });

  const summary = {
    totalClasses: classes.length,
    totalStudents,
    totalPoints,
    averagePointsPerStudent: totalStudents ? roundNumber(totalPoints / totalStudents) : 0
  };

  res.json({ classes, summary, filters: filterOptions });
};

export const listClassFilters = async (req, res) => {
  const userId = req.user?.sub;
  const role = req.user?.role;

  if (!userId || !role) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (role === "GIANGVIEN") {
    const filters = await fetchFacultyClassFilters({ teacherId: userId });
    return res.json({ filters });
  }

  if (role === "ADMIN" || role === "NHANVIEN") {
    const filters = await fetchFacultyClassFilters();
    return res.json({ filters });
  }

  return res.status(403).json({ error: "Forbidden" });
};

export default { listTeacherClasses, listClassFilters };
