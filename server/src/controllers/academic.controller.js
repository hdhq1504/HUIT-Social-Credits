import prisma from "../prisma.js";
import { mapAcademicYearRecord, mapSemesterRecord } from "../utils/academic.js";

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

export default {
  listSemesters,
  listAcademicYears,
  resolveAcademicPeriod
};