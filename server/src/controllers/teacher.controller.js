import prisma from "../prisma.js";

export const getTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      vaiTro: "GIANGVIEN",
      isActive: true,
      ...(search && {
        OR: [
          { hoTen: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { maCB: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [teachers, total] = await Promise.all([
      prisma.nguoiDung.findMany({
        where,
        select: {
          id: true,
          maCB: true,
          hoTen: true,
          email: true,
          lopChuNhiem: {
            select: {
              id: true,
              tenLop: true,
              maLop: true,
              namNhapHoc: true
            }
          }
        },
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.nguoiDung.count({ where }),
    ]);

    res.json({
      data: teachers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get teachers error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách giảng viên" });
  }
};

export const assignHomeroom = async (req, res) => {
  try {
    const { teacherId, classIds } = req.body; // classIds is array of strings

    if (!teacherId || !Array.isArray(classIds)) {
      return res.status(400).json({ error: "Dữ liệu không hợp lệ" });
    }

    // Verify teacher exists and is a GIANGVIEN
    const teacher = await prisma.nguoiDung.findUnique({
      where: { id: teacherId }
    });

    if (!teacher || teacher.vaiTro !== 'GIANGVIEN') {
      return res.status(400).json({ error: "Giảng viên không hợp lệ" });
    }

    // Update classes
    // First, we might want to clear previous homeroom for these classes? 
    // Requirement says "giảng viên có thể chủ nhiệm nhiều lớp", implies one class has one homeroom teacher.
    // So we just update the classes to point to this teacher.

    await prisma.lopHoc.updateMany({
      where: {
        id: { in: classIds }
      },
      data: {
        giangVienChuNhiemId: teacherId
      }
    });

    res.json({ message: "Phân công chủ nhiệm thành công" });

  } catch (error) {
    console.error("Assign homeroom error:", error);
    res.status(500).json({ error: "Lỗi server khi phân công" });
  }
}

export const getAvailableClasses = async (req, res) => {
  try {
    // Get classes that don't have a homeroom teacher OR just all classes?
    // Usually for assignment, we might want to see who is currently assigned.
    // Let's return all classes with their current homeroom teacher info
    const classes = await prisma.lopHoc.findMany({
      select: {
        id: true,
        tenLop: true,
        maLop: true,
        khoa: { select: { tenKhoa: true } },
        giangVienChuNhiem: {
          select: { hoTen: true }
        }
      },
      orderBy: { tenLop: 'asc' }
    });
    res.json(classes);
  } catch (error) {
    console.error("Get available classes error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
}
