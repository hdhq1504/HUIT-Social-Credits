import prisma from "../prisma.js";
import { calculateUserPoints } from "../utils/points.js";

/**
 * Lấy danh sách các lớp mà giảng viên đang chủ nhiệm
 */
export const getMyClasses = async (req, res) => {
  try {
    const userId = req.user.id;

    const classes = await prisma.lopHoc.findMany({
      where: {
        giangVienChuNhiemId: userId,
      },
      include: {
        khoa: {
          select: {
            id: true,
            tenKhoa: true,
            maKhoa: true,
          },
        },
        _count: {
          select: {
            sinhVien: true,
          },
        },
      },
      orderBy: [
        { namNhapHoc: "desc" },
        { maLop: "asc" },
      ],
    });

    res.json(classes);
  } catch (error) {
    console.error("Error fetching teacher's classes:", error);
    res.status(500).json({ error: "Không thể lấy danh sách lớp" });
  }
};

/**
 * Lấy chi tiết một lớp (chỉ nếu giảng viên là chủ nhiệm)
 */
export const getClassDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { classId } = req.params;

    const classDetail = await prisma.lopHoc.findFirst({
      where: {
        id: classId,
        giangVienChuNhiemId: userId,
      },
      include: {
        khoa: true,
        giangVienChuNhiem: {
          select: {
            id: true,
            hoTen: true,
            email: true,
          },
        },
      },
    });

    if (!classDetail) {
      return res.status(404).json({
        error: "Không tìm thấy lớp hoặc bạn không có quyền truy cập"
      });
    }

    res.json(classDetail);
  } catch (error) {
    console.error("Error fetching class detail:", error);
    res.status(500).json({ error: "Không thể lấy thông tin lớp" });
  }
};

/**
 * Lấy danh sách sinh viên trong lớp với điểm số
 */
export const getClassStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { classId } = req.params;
    const { hocKyId } = req.query; // Có thể filter theo học kỳ cụ thể

    // Kiểm tra quyền truy cập
    const lopHoc = await prisma.lopHoc.findFirst({
      where: {
        id: classId,
        giangVienChuNhiemId: userId,
      },
    });

    if (!lopHoc) {
      return res.status(403).json({
        error: "Bạn không có quyền xem lớp này"
      });
    }

    // Lấy danh sách sinh viên
    const students = await prisma.nguoiDung.findMany({
      where: {
        lopHocId: classId,
        vaiTro: "SINH_VIEN",
      },
      select: {
        id: true,
        maSinhVien: true,
        hoTen: true,
        email: true,
        soDienThoai: true,
        trangThai: true,
      },
      orderBy: {
        maSinhVien: "asc",
      },
    });

    // Tính điểm cho từng sinh viên
    const studentsWithPoints = await Promise.all(
      students.map(async (student) => {
        const points = await calculateUserPoints(student.id, hocKyId);
        return {
          ...student,
          diemRenLuyen: points,
        };
      })
    );

    res.json(studentsWithPoints);
  } catch (error) {
    console.error("Error fetching class students:", error);
    res.status(500).json({ error: "Không thể lấy danh sách sinh viên" });
  }
};

/**
 * Lấy chi tiết điểm của một sinh viên
 */
export const getStudentPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const { classId, studentId } = req.params;
    const { hocKyId } = req.query;

    // Kiểm tra quyền truy cập
    const student = await prisma.nguoiDung.findFirst({
      where: {
        id: studentId,
        lopHocId: classId,
        lopHoc: {
          giangVienChuNhiemId: userId,
        },
      },
      include: {
        lopHoc: {
          include: {
            khoa: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(403).json({
        error: "Không tìm thấy sinh viên hoặc bạn không có quyền xem"
      });
    }

    // Lấy thông tin điểm chi tiết
    const whereClause = {
      nguoiDungId: studentId,
      hoatDong: {
        trangThai: "DA_DIEN_RA",
      },
    };

    if (hocKyId) {
      whereClause.hoatDong.hocKyId = hocKyId;
    }

    const registrations = await prisma.dangKyHoatDong.findMany({
      where: whereClause,
      include: {
        hoatDong: {
          include: {
            hocKy: true,
            nhomDiem: true,
          },
        },
        phanHoi: {
          select: {
            id: true,
            trangThai: true,
            diemNhan: true,
          },
        },
      },
      orderBy: {
        hoatDong: {
          thoiGianBatDau: "desc",
        },
      },
    });

    // Tính tổng điểm theo nhóm
    const pointsByGroup = {};
    let totalPoints = 0;

    registrations.forEach((reg) => {
      if (reg.phanHoi?.trangThai === "DUYET" && reg.phanHoi?.diemNhan > 0) {
        const groupName = reg.hoatDong.nhomDiem?.tenNhom || "Khác";
        if (!pointsByGroup[groupName]) {
          pointsByGroup[groupName] = {
            tenNhom: groupName,
            diemToiDa: reg.hoatDong.nhomDiem?.diemToiDa || 0,
            tongDiem: 0,
            soHoatDong: 0,
          };
        }
        pointsByGroup[groupName].tongDiem += reg.phanHoi.diemNhan;
        pointsByGroup[groupName].soHoatDong += 1;
        totalPoints += reg.phanHoi.diemNhan;
      }
    });

    res.json({
      sinhVien: {
        id: student.id,
        maSinhVien: student.maSinhVien,
        hoTen: student.hoTen,
        email: student.email,
        lopHoc: student.lopHoc,
      },
      tongDiem: totalPoints,
      diemTheoNhom: Object.values(pointsByGroup),
      danhSachHoatDong: registrations.map((reg) => ({
        id: reg.id,
        hoatDong: {
          id: reg.hoatDong.id,
          tenHoatDong: reg.hoatDong.tenHoatDong,
          thoiGianBatDau: reg.hoatDong.thoiGianBatDau,
          nhomDiem: reg.hoatDong.nhomDiem?.tenNhom,
        },
        trangThaiDangKy: reg.trangThai,
        trangThaiDiemDanh: reg.trangThaiDiemDanh,
        phanHoi: reg.phanHoi ? {
          trangThai: reg.phanHoi.trangThai,
          diemNhan: reg.phanHoi.diemNhan,
        } : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching student points:", error);
    res.status(500).json({ error: "Không thể lấy thông tin điểm sinh viên" });
  }
};

/**
 * Xuất báo cáo điểm lớp theo định dạng
 */
export const exportClassReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { classId } = req.params;
    const { hocKyId, format = "json" } = req.query;

    // Kiểm tra quyền
    const lopHoc = await prisma.lopHoc.findFirst({
      where: {
        id: classId,
        giangVienChuNhiemId: userId,
      },
      include: {
        khoa: true,
      },
    });

    if (!lopHoc) {
      return res.status(403).json({
        error: "Bạn không có quyền xuất báo cáo lớp này"
      });
    }

    // Lấy dữ liệu sinh viên và điểm
    const students = await prisma.nguoiDung.findMany({
      where: {
        lopHocId: classId,
        vaiTro: "SINH_VIEN",
      },
      orderBy: {
        maSinhVien: "asc",
      },
    });

    const report = await Promise.all(
      students.map(async (student) => {
        const points = await calculateUserPoints(student.id, hocKyId);
        return {
          maSinhVien: student.maSinhVien,
          hoTen: student.hoTen,
          email: student.email,
          diemRenLuyen: points.tongDiem || 0,
          xepLoai: getClassification(points.tongDiem || 0),
        };
      })
    );

    // Trả về theo format
    if (format === "csv") {
      const csv = convertToCSV(report);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="diem-lop-${lopHoc.maLop}.csv"`
      );
      return res.send("\uFEFF" + csv); // BOM for UTF-8
    }

    res.json({
      lopHoc: {
        maLop: lopHoc.maLop,
        tenLop: lopHoc.tenLop,
        khoa: lopHoc.khoa.tenKhoa,
      },
      tongSinhVien: students.length,
      diemTrungBinh: report.reduce((sum, s) => sum + s.diemRenLuyen, 0) / report.length,
      danhSach: report,
    });
  } catch (error) {
    console.error("Error exporting class report:", error);
    res.status(500).json({ error: "Không thể xuất báo cáo" });
  }
};

// Helper functions
function getClassification(points) {
  if (points >= 90) return "Xuất sắc";
  if (points >= 80) return "Tốt";
  if (points >= 65) return "Khá";
  if (points >= 50) return "Trung bình";
  if (points >= 35) return "Yếu";
  return "Kém";
}

function convertToCSV(data) {
  const headers = ["Mã SV", "Họ và tên", "Email", "Điểm rèn luyện", "Xếp loại"];
  const rows = data.map((row) => [
    row.maSinhVien,
    row.hoTen,
    row.email,
    row.diemRenLuyen,
    row.xepLoai,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
}
