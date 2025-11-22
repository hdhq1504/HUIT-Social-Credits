import prisma from "../prisma.js";

/**
 * Lấy danh sách giảng viên (Admin).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getTeachers = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, status } = req.query;
    const skip = (page - 1) * pageSize;

    const where = {
      vaiTro: "GIANGVIEN",
      ...(search && {
        OR: [
          { hoTen: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { maCB: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status !== undefined && status !== 'all' && {
        isActive: status === 'active'
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
          isActive: true,
          lastLoginAt: true,
          avatarUrl: true,
          phanCong: {
            where: {
              loaiPhanCong: 'CHU_NHIEM',
              namHoc: {
                isActive: true
              }
            },
            select: {
              lopHoc: {
                select: {
                  id: true,
                  tenLop: true,
                  maLop: true,
                  namNhapHoc: true,
                  khoa: {
                    select: {
                      id: true,
                      tenKhoa: true,
                    }
                  }
                }
              },
              namHoc: {
                select: {
                  nienKhoa: true
                }
              }
            }
          }
        },
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { hoTen: "asc" },
      }),
      prisma.nguoiDung.count({ where }),
    ]);

    // Map teachers to match frontend expectations
    const mappedTeachers = teachers.map(teacher => ({
      id: teacher.id,
      staffCode: teacher.maCB,
      fullName: teacher.hoTen,
      email: teacher.email,
      isActive: teacher.isActive,
      lastLoginAt: teacher.lastLoginAt,
      avatarUrl: teacher.avatarUrl,
      department: teacher.phanCong?.[0]?.lopHoc?.khoa?.tenKhoa || null,
      homeroomClasses: teacher.phanCong?.map(pc => pc.lopHoc) || [],
    }));

    res.json({
      teachers: mappedTeachers,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get teachers error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách giảng viên" });
  }
};

/**
 * Phân công chủ nhiệm cho giảng viên.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
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

    // Get current academic year
    const currentNamHoc = await prisma.namHoc.findFirst({
      where: { isActive: true }
    });

    if (!currentNamHoc) {
      return res.status(400).json({ error: "Không tìm thấy năm học hiện tại" });
    }

    // Delete existing assignments for these classes in current year
    await prisma.phanCong.deleteMany({
      where: {
        lopHocId: { in: classIds },
        namHocId: currentNamHoc.id,
        loaiPhanCong: 'CHU_NHIEM'
      }
    });

    // Create new assignments
    await prisma.phanCong.createMany({
      data: classIds.map(lopHocId => ({
        giangVienId: teacherId,
        lopHocId,
        namHocId: currentNamHoc.id,
        loaiPhanCong: 'CHU_NHIEM'
      }))
    });

    res.json({ message: "Phân công chủ nhiệm thành công" });

  } catch (error) {
    console.error("Assign homeroom error:", error);
    res.status(500).json({ error: "Lỗi server khi phân công" });
  }
}

/**
 * Lấy danh sách lớp học khả dụng cho phân công.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
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
        phanCong: {
          where: {
            loaiPhanCong: 'CHU_NHIEM',
            namHoc: {
              isActive: true
            }
          },
          select: {
            giangVien: {
              select: { hoTen: true }
            }
          }
        }
      },
      orderBy: { tenLop: 'asc' }
    });

    // Map to include giangVienChuNhiem for frontend compatibility
    const mappedClasses = classes.map(cls => ({
      ...cls,
      giangVienChuNhiem: cls.phanCong?.[0]?.giangVien || null
    }));

    res.json(mappedClasses);
  } catch (error) {
    console.error("Get available classes error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
}
