import prisma from "../prisma.js";
import { mapAcademicYearRecord, mapSemesterRecord } from "../utils/academic.js";

/**
 * Lấy danh sách năm học và học kỳ (đã format).
 * @param {Object} _req - Express request object.
 * @param {Object} res - Express response object.
 */
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

/**
 * Lấy danh sách năm học (đã format).
 * @param {Object} _req - Express request object.
 * @param {Object} res - Express response object.
 */
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

/**
 * Xác định học kỳ dựa trên ngày tháng.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
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

// Admin CRUD operations for NamHoc

/**
 * Lấy danh sách năm học (Admin CRUD).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getNamHocs = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;

    const [namHocs, total] = await Promise.all([
      prisma.namHoc.findMany({
        select: {
          id: true,
          ma: true,
          nienKhoa: true,
          ten: true,
          batDau: true,
          ketThuc: true,
          isActive: true,
          _count: {
            select: {
              hocKy: true
            }
          }
        },
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { batDau: 'desc' }
      }),
      prisma.namHoc.count()
    ]);

    res.json({
      namHocs,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error("Get nam hocs error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách năm học" });
  }
};

/**
 * Tạo năm học mới.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const createNamHoc = async (req, res) => {
  try {
    const { ma, nienKhoa, ten, batDau, ketThuc } = req.body;

    if (!ma || !nienKhoa || !batDau || !ketThuc) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const existing = await prisma.namHoc.findUnique({ where: { ma } });
    if (existing) {
      return res.status(400).json({ error: "Mã năm học đã tồn tại" });
    }

    const namHoc = await prisma.namHoc.create({
      data: {
        ma,
        nienKhoa,
        ten,
        batDau: new Date(batDau),
        ketThuc: new Date(ketThuc),
        isActive: false
      }
    });

    res.status(201).json({ message: "Tạo năm học thành công", namHoc });
  } catch (error) {
    console.error("Create nam hoc error:", error);
    res.status(500).json({ error: "Lỗi server khi tạo năm học" });
  }
};

/**
 * Cập nhật năm học.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const updateNamHoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { ma, nienKhoa, ten, batDau, ketThuc } = req.body;

    const namHoc = await prisma.namHoc.update({
      where: { id },
      data: {
        ...(ma && { ma }),
        ...(nienKhoa && { nienKhoa }),
        ...(ten !== undefined && { ten }),
        ...(batDau && { batDau: new Date(batDau) }),
        ...(ketThuc && { ketThuc: new Date(ketThuc) })
      }
    });

    res.json({ message: "Cập nhật năm học thành công", namHoc });
  } catch (error) {
    console.error("Update nam hoc error:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật năm học" });
  }
};

/**
 * Xóa năm học.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const deleteNamHoc = async (req, res) => {
  try {
    const { id } = req.params;

    const assignmentCount = await prisma.phanCong.count({
      where: { namHocId: id }
    });

    if (assignmentCount > 0) {
      return res.status(400).json({
        error: "Không thể xóa năm học đã có phân công giảng viên"
      });
    }

    await prisma.namHoc.delete({ where: { id } });

    res.json({ message: "Xóa năm học thành công" });
  } catch (error) {
    console.error("Delete nam hoc error:", error);
    res.status(500).json({ error: "Lỗi server khi xóa năm học" });
  }
};

/**
 * Kích hoạt năm học.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const activateNamHoc = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.namHoc.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    const namHoc = await prisma.namHoc.update({
      where: { id },
      data: { isActive: true }
    });

    res.json({ message: "Kích hoạt năm học thành công", namHoc });
  } catch (error) {
    console.error("Activate nam hoc error:", error);
    res.status(500).json({ error: "Lỗi server khi kích hoạt năm học" });
  }
};

/**
 * Lấy danh sách học kỳ của một năm học.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getHocKys = async (req, res) => {
  try {
    const { namHocId } = req.params;

    const hocKys = await prisma.hocKy.findMany({
      where: { namHocId },
      orderBy: { thuTu: 'asc' }
    });

    res.json(hocKys);
  } catch (error) {
    console.error("Get hoc kys error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách học kỳ" });
  }
};

/**
 * Tạo học kỳ mới.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const createHocKy = async (req, res) => {
  try {
    const { namHocId } = req.params;
    const { ma, ten, thuTu, moTa, batDau, ketThuc } = req.body;

    if (!ma || !ten || !batDau || !ketThuc) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const hocKy = await prisma.hocKy.create({
      data: {
        ma,
        ten,
        thuTu,
        moTa,
        batDau: new Date(batDau),
        ketThuc: new Date(ketThuc),
        namHocId
      }
    });

    res.status(201).json({ message: "Tạo học kỳ thành công", hocKy });
  } catch (error) {
    console.error("Create hoc ky error:", error);
    res.status(500).json({ error: "Lỗi server khi tạo học kỳ" });
  }
};

/**
 * Cập nhật học kỳ.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const updateHocKy = async (req, res) => {
  try {
    const { id } = req.params;
    const { ma, ten, thuTu, moTa, batDau, ketThuc } = req.body;

    const hocKy = await prisma.hocKy.update({
      where: { id },
      data: {
        ...(ma && { ma }),
        ...(ten && { ten }),
        ...(thuTu !== undefined && { thuTu }),
        ...(moTa !== undefined && { moTa }),
        ...(batDau && { batDau: new Date(batDau) }),
        ...(ketThuc && { ketThuc: new Date(ketThuc) })
      }
    });

    res.json({ message: "Cập nhật học kỳ thành công", hocKy });
  } catch (error) {
    console.error("Update hoc ky error:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật học kỳ" });
  }
};

/**
 * Xóa học kỳ.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const deleteHocKy = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.hocKy.delete({ where: { id } });

    res.json({ message: "Xóa học kỳ thành công" });
  } catch (error) {
    console.error("Delete hoc ky error:", error);
    res.status(500).json({ error: "Lỗi server khi xóa học kỳ" });
  }
};

export default {
  listSemesters,
  listAcademicYears,
  resolveAcademicPeriod,
  getNamHocs,
  createNamHoc,
  updateNamHoc,
  deleteNamHoc,
  activateNamHoc,
  getHocKys,
  createHocKy,
  updateHocKy,
  deleteHocKy
};