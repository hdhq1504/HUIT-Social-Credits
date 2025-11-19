import prisma from "../prisma.js";
import bcrypt from "bcrypt";

export const getStudents = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, khoaId, lopId, status } = req.query;
    const skip = (page - 1) * pageSize;

    const where = {
      vaiTro: "SINHVIEN",
      ...(search && {
        OR: [
          { hoTen: { contains: search, mode: "insensitive" } },
          { maSV: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status !== undefined && status !== 'all' && {
        isActive: status === 'active'
      }),
    };

    // Filter by khoaId through lopHoc relation
    if (khoaId) {
      where.lopHoc = {
        khoaId: khoaId
      };
    }

    // Filter by lopId
    if (lopId) {
      where.lopHocId = lopId;
    }

    const [students, total] = await Promise.all([
      prisma.nguoiDung.findMany({
        where,
        select: {
          id: true,
          maSV: true,
          hoTen: true,
          email: true,
          ngaySinh: true,
          gioiTinh: true,
          soDT: true,
          isActive: true,
          lastLoginAt: true,
          avatarUrl: true,
          lopHoc: {
            select: {
              id: true,
              tenLop: true,
              maLop: true,
              khoa: {
                select: {
                  id: true,
                  tenKhoa: true,
                }
              }
            }
          }
        },
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: [
          { lopHoc: { khoa: { tenKhoa: 'asc' } } },
          { lopHoc: { tenLop: 'asc' } },
          { hoTen: 'asc' }
        ],
      }),
      prisma.nguoiDung.count({ where }),
    ]);

    // Map students to include department and class info
    const mappedStudents = students.map(student => ({
      id: student.id,
      studentCode: student.maSV,
      fullName: student.hoTen,
      email: student.email,
      dateOfBirth: student.ngaySinh,
      gender: student.gioiTinh,
      phoneNumber: student.soDT,
      isActive: student.isActive,
      lastLoginAt: student.lastLoginAt,
      avatarUrl: student.avatarUrl,
      classCode: student.lopHoc?.maLop || null,
      className: student.lopHoc?.tenLop || null,
      department: student.lopHoc?.khoa?.tenKhoa || null,
      departmentId: student.lopHoc?.khoa?.id || null,
    }));

    res.json({
      students: mappedStudents,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách sinh viên" });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { maSV, hoTen, email, password, lopHocId, ngaySinh, gioiTinh, soDT } = req.body;

    if (!maSV || !hoTen || !email || !password) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    const existingUser = await prisma.nguoiDung.findFirst({
      where: {
        OR: [{ email }, { maSV }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email hoặc Mã SV đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await prisma.nguoiDung.create({
      data: {
        maSV,
        hoTen,
        email,
        matKhau: hashedPassword,
        vaiTro: "SINHVIEN",
        lopHocId,
        ngaySinh: ngaySinh ? new Date(ngaySinh) : null,
        gioiTinh,
        soDT,
      },
    });

    res.status(201).json({ message: "Tạo sinh viên thành công", data: newStudent });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({ error: "Lỗi server khi tạo sinh viên" });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { maSV, hoTen, email, lopHocId, ngaySinh, gioiTinh, soDT, isActive } = req.body;

    const student = await prisma.nguoiDung.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ error: "Không tìm thấy sinh viên" });

    // Check unique constraints if changing email/maSV
    if ((email && email !== student.email) || (maSV && maSV !== student.maSV)) {
      const existing = await prisma.nguoiDung.findFirst({
        where: {
          OR: [
            email ? { email, id: { not: id } } : {},
            maSV ? { maSV, id: { not: id } } : {}
          ]
        }
      });
      if (existing) return res.status(400).json({ error: "Email hoặc Mã SV đã được sử dụng" });
    }

    const updatedStudent = await prisma.nguoiDung.update({
      where: { id },
      data: {
        maSV,
        hoTen,
        email,
        lopHocId,
        ngaySinh: ngaySinh ? new Date(ngaySinh) : undefined,
        gioiTinh,
        soDT,
        isActive
      },
    });

    res.json({ message: "Cập nhật thành công", data: updatedStudent });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật sinh viên" });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    // Soft delete
    await prisma.nguoiDung.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ message: "Đã xóa sinh viên (soft delete)" });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ error: "Lỗi server khi xóa sinh viên" });
  }
}

export const getClassesByFaculty = async (req, res) => {
  try {
    const { khoaId } = req.params;
    const classes = await prisma.lopHoc.findMany({
      where: { khoaId },
      select: { id: true, tenLop: true, maLop: true }
    });
    res.json(classes);
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách lớp" });
  }
}

export const getFaculties = async (req, res) => {
  try {
    const faculties = await prisma.khoa.findMany({
      where: { isActive: true },
      select: { id: true, tenKhoa: true, maKhoa: true },
      orderBy: { tenKhoa: 'asc' }
    });
    res.json(faculties);
  } catch (error) {
    console.error("Get faculties error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách khoa" });
  }
}
