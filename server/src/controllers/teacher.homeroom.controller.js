import prisma from "../prisma.js";

// Get teacher's homeroom classes (current academic year)
export const getMyClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const assignments = await prisma.phanCong.findMany({
      where: {
        giangVienId: teacherId,
        loaiPhanCong: 'CHU_NHIEM',
        namHoc: {
          isActive: true
        }
      },
      select: {
        lopHoc: {
          select: {
            id: true,
            maLop: true,
            tenLop: true,
            namNhapHoc: true,
            khoa: {
              select: {
                id: true,
                tenKhoa: true
              }
            },
            _count: {
              select: {
                sinhVien: true
              }
            }
          }
        },
        namHoc: {
          select: {
            nienKhoa: true
          }
        }
      },
      orderBy: {
        lopHoc: {
          maLop: 'asc'
        }
      }
    });

    // Map to simpler structure
    const classes = assignments.map(assignment => ({
      ...assignment.lopHoc,
      studentCount: assignment.lopHoc._count.sinhVien,
      nienKhoa: assignment.namHoc.nienKhoa
    }));

    res.json(classes);
  } catch (error) {
    console.error("Get my classes error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách lớp" });
  }
};

// Get students in a specific class
export const getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;

    // Verify teacher is homeroom teacher for this class
    const assignment = await prisma.phanCong.findFirst({
      where: {
        giangVienId: teacherId,
        lopHocId: classId,
        loaiPhanCong: 'CHU_NHIEM',
        namHoc: {
          isActive: true
        }
      }
    });

    if (!assignment) {
      return res.status(403).json({ error: "Bạn không có quyền truy cập lớp này" });
    }

    // Get class info
    const classInfo = await prisma.lopHoc.findUnique({
      where: { id: classId },
      select: {
        maLop: true,
        tenLop: true,
        khoa: {
          select: {
            tenKhoa: true
          }
        }
      }
    });

    // Get students
    const students = await prisma.nguoiDung.findMany({
      where: {
        lopHocId: classId,
        vaiTro: 'SINHVIEN'
      },
      select: {
        id: true,
        maSV: true,
        hoTen: true,
        email: true,
        ngaySinh: true,
        gioiTinh: true,
        soDT: true,
        avatarUrl: true
      },
      orderBy: {
        hoTen: 'asc'
      }
    });

    res.json({
      classInfo,
      students
    });
  } catch (error) {
    console.error("Get class students error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách sinh viên" });
  }
};

// Get student scores/activities
export const getStudentScores = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacherId = req.user.id;

    // Get student info and verify teacher has access
    const student = await prisma.nguoiDung.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        maSV: true,
        hoTen: true,
        email: true,
        lopHocId: true,
        lopHoc: {
          select: {
            maLop: true,
            tenLop: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: "Không tìm thấy sinh viên" });
    }

    // Verify teacher is homeroom teacher for student's class
    const assignment = await prisma.phanCong.findFirst({
      where: {
        giangVienId: teacherId,
        lopHocId: student.lopHocId,
        loaiPhanCong: 'CHU_NHIEM',
        namHoc: {
          isActive: true
        }
      }
    });

    if (!assignment) {
      return res.status(403).json({ error: "Bạn không có quyền xem thông tin sinh viên này" });
    }

    // Get student's activity registrations and scores
    const activities = await prisma.dangKyHoatDong.findMany({
      where: {
        nguoiDungId: studentId,
        hoatDong: {
          namHoc: {
            isActive: true
          }
        }
      },
      select: {
        id: true,
        trangThai: true,
        diemDanh: true,
        createdAt: true,
        hoatDong: {
          select: {
            id: true,
            ten: true,
            loai: true,
            diem: true,
            ngayToChuc: true,
            diaDiem: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate total score
    const totalScore = activities
      .filter(a => a.trangThai === 'APPROVED' && a.diemDanh)
      .reduce((sum, a) => sum + (a.hoatDong.diem || 0), 0);

    res.json({
      student: {
        id: student.id,
        maSV: student.maSV,
        hoTen: student.hoTen,
        email: student.email,
        lopHoc: student.lopHoc
      },
      activities,
      totalScore
    });
  } catch (error) {
    console.error("Get student scores error:", error);
    res.status(500).json({ error: "Lỗi server khi lấy điểm sinh viên" });
  }
};
