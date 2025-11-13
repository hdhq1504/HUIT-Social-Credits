import prisma from "../prisma.js";

const safeTrim = (value, maxLength = 255) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (maxLength && trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
};

const sortAlpha = (a, b) => a.localeCompare(b, "vi", { sensitivity: "base" });

const mapClassRecord = (record, faculty) => {
  const code = safeTrim(record.ma, 100);
  const label = safeTrim(record.ten, 255) ?? code ?? "Lớp";
  return {
    id: record.id,
    value: code ?? record.id,
    label,
    code: code ?? null,
    facultyId: faculty?.id ?? null,
    facultyCode: faculty?.code ?? null,
  };
};

const mapFacultyRecord = (record) => {
  const code = safeTrim(record.ma, 100);
  const label = safeTrim(record.ten, 255) ?? code ?? "Khoa";
  const classes = (record.lop || [])
    .filter((item) => item?.isActive !== false)
    .map((item) => mapClassRecord(item, { id: record.id, code }))
    .sort((a, b) => sortAlpha(a.label, b.label));

  return {
    id: record.id,
    value: code ?? record.id,
    label,
    code: code ?? null,
    classes,
  };
};

export const fetchFacultyClassFilters = async ({ teacherId } = {}) => {
  const classWhere = teacherId
    ? {
        isActive: true,
        chuNhiemId: teacherId,
      }
    : { isActive: true };

  const facultyWhere = teacherId
    ? {
        isActive: true,
        lop: { some: { isActive: true, chuNhiemId: teacherId } },
      }
    : { isActive: true };

  const faculties = await prisma.khoa.findMany({
    where: facultyWhere,
    include: {
      lop: {
        where: classWhere,
        orderBy: [{ ma: "asc" }, { ten: "asc" }],
        select: { id: true, ma: true, ten: true, isActive: true },
      },
    },
    orderBy: [{ ten: "asc" }, { ma: "asc" }],
  });

  const mappedFaculties = faculties.map(mapFacultyRecord);
  const classes = mappedFaculties.flatMap((faculty) =>
    faculty.classes.map((item) => ({ ...item }))
  );

  return {
    faculties: mappedFaculties,
    classes,
  };
};

export default { fetchFacultyClassFilters };
