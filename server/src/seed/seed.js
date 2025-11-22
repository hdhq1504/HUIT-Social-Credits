import bcrypt from "bcrypt";
import prisma from "../prisma.js";
import { resolveAcademicPeriodForDate } from "../utils/academic.js";

const seed = async () => {
  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@huit.edu.vn";
    const adminPlainPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
    const adminHashedPassword = await bcrypt.hash(adminPlainPassword, 10);

    // ==================== SEED ADMIN ====================
    const admin = await prisma.nguoiDung.upsert({
      where: { email: adminEmail },
      update: {
        matKhau: adminHashedPassword,
        hoTen: "Nguyễn Văn A",
        vaiTro: "ADMIN",
        maCB: "ADMIN001",
        isActive: true,
      },
      create: {
        email: adminEmail,
        matKhau: adminHashedPassword,
        hoTen: "Nguyễn Văn A",
        vaiTro: "ADMIN",
        maCB: "ADMIN001",
        isActive: true,
        soDT: "0900000000",
        avatarUrl: "/images/profile.png",
      },
    });

    const plainPassword = process.env.SEED_PASSWORD || "1234";
    const hashed = await bcrypt.hash(plainPassword, 10);

    // ==================== SEED KHOA ====================
    const khoaData = [
      {
        maKhoa: "CNTT",
        tenKhoa: "Công nghệ Thông tin",
        moTa: "Khoa Công nghệ Thông tin - Đào tạo các ngành về phần mềm, mạng máy tính, an ninh mạng",
      },
      {
        maKhoa: "ATTT",
        tenKhoa: "An toàn thông tin",
        moTa: "Khoa An toàn Thông tin - Đào tạo về bảo mật, dữ liệu, mạng máy tính",
      },
      {
        maKhoa: "KHDL",
        tenKhoa: "Khoa học dữ liệu",
        moTa: "Khoa Khoa học dữ liệu - Đào tạo về dữ liệu, AI, máy học",
      },
    ];

    for (const khoa of khoaData) {
      await prisma.khoa.upsert({
        where: { maKhoa: khoa.maKhoa },
        update: {
          tenKhoa: khoa.tenKhoa,
          moTa: khoa.moTa,
          isActive: true,
        },
        create: khoa,
      });
    }

    // ==================== SEED GIẢNG VIÊN ====================
    const lecturer = await prisma.nguoiDung.upsert({
      where: { email: "huunt@huit.edu.vn" },
      update: {
        matKhau: adminHashedPassword,
        hoTen: "Nguyễn Thế Hũu",
        vaiTro: "GIANGVIEN",
        maCB: "GV001",
        maKhoa: "CNTT",
        isActive: true,
      },
      create: {
        email: "huunt@huit.edu.vn",
        matKhau: adminHashedPassword,
        hoTen: "Nguyễn Thế Hữu",
        vaiTro: "GIANGVIEN",
        maCB: "GV001",
        maKhoa: "CNTT",
        maLop: null,
        soDT: "0912345678",
        avatarUrl: "/images/profile.png",
        isActive: true,
      },
    });

    // Lấy khoa CNTT để dùng ID cho lớp học
    const khoaCNTT = await prisma.khoa.findUnique({
      where: { maKhoa: "CNTT" },
    });

    if (!khoaCNTT) {
      throw new Error("Không tìm thấy khoa CNTT");
    }

    // ==================== SEED LỚP HỌC ====================
    const lopHocData = [
      {
        maLop: "13DHTH01",
        tenLop: "13 Đại học Tin học 01",
        khoaId: khoaCNTT.id,
        namNhapHoc: 2022,
        giangVienChuNhiemId: lecturer.id,
      },
      {
        maLop: "13DHTH02",
        tenLop: "13 Đại học Tin học 02",
        khoaId: khoaCNTT.id,
        namNhapHoc: 2022,
        giangVienChuNhiemId: lecturer.id,
      },
      {
        maLop: "13DHTH03",
        tenLop: "13 Đại học Tin học 03",
        khoaId: khoaCNTT.id,
        namNhapHoc: 2022,
        giangVienChuNhiemId: null,
      },
    ];

    for (const lop of lopHocData) {
      await prisma.lopHoc.upsert({
        where: { maLop: lop.maLop },
        update: {
          tenLop: lop.tenLop,
          khoaId: lop.khoaId,
          namNhapHoc: lop.namNhapHoc,
        },
        create: {
          maLop: lop.maLop,
          tenLop: lop.tenLop,
          khoaId: lop.khoaId,
          namNhapHoc: lop.namNhapHoc,
        },
      });
    }

    // ==================== SEED PHÂN CÔNG CHỦ NHIỆM ====================
    // Get active academic year
    const activeNamHoc = await prisma.namHoc.findFirst({
      where: { isActive: true },
      orderBy: { batDau: 'desc' }
    });

    if (activeNamHoc) {
      // Create PhanCong records for homeroom teachers
      for (const lop of lopHocData) {
        if (lop.giangVienChuNhiemId) {
          const lopHoc = await prisma.lopHoc.findUnique({
            where: { maLop: lop.maLop }
          });

          if (lopHoc) {
            await prisma.phanCong.upsert({
              where: {
                giangVienId_lopHocId_namHocId_loaiPhanCong: {
                  giangVienId: lop.giangVienChuNhiemId,
                  lopHocId: lopHoc.id,
                  namHocId: activeNamHoc.id,
                  loaiPhanCong: 'CHU_NHIEM'
                }
              },
              update: {},
              create: {
                giangVienId: lop.giangVienChuNhiemId,
                lopHocId: lopHoc.id,
                namHocId: activeNamHoc.id,
                loaiPhanCong: 'CHU_NHIEM'
              }
            });
          }
        }
      }
      console.log("✓ Đã tạo phân công chủ nhiệm");
    } else {
      console.warn("⚠ Không tìm thấy năm học active, bỏ qua tạo phân công");
    }

    // ==================== SEED SINH VIÊN ====================
    const Students = [
      {
        email: "2001223947@huit.edu.vn",
        hoTen: "Hồ Đức Hoàng Quân",
        gioiTinh: "Nam",
        maLop: "13DHTH02",
        vaiTro: "SINHVIEN",
        maKhoa: "CNTT",
        soDT: "0931318657",
        ngaySinh: new Date("2004-04-15"),
      },
      {
        email: "2001220001@huit.edu.vn",
        hoTen: "Trần Thị Bích",
        gioiTinh: "Nữ",
        maLop: "13DHTH01",
        maKhoa: "CNTT",
        soDT: "0912345671",
        ngaySinh: new Date("2004-01-20"),
      },
      {
        email: "2001220002@huit.edu.vn",
        hoTen: "Lê Minh Cường",
        gioiTinh: "Nam",
        maLop: "13DHTH02",
        maKhoa: "CNTT",
        soDT: "0912345672",
        ngaySinh: new Date("2004-02-15"),
      },
      {
        email: "2001220003@huit.edu.vn",
        hoTen: "Phạm Văn Dũng",
        gioiTinh: "Nam",
        maLop: "13DHTH03",
        maKhoa: "CNTT",
        soDT: "0912345673",
        ngaySinh: new Date("2004-03-10"),
      },
      {
        email: "2001220004@huit.edu.vn",
        hoTen: "Võ Thị Em",
        gioiTinh: "Nữ",
        maLop: "13DHTH01",
        maKhoa: "CNTT",
        soDT: "0912345674",
        ngaySinh: new Date("2004-05-05"),
      },
      {
        email: "2001220005@huit.edu.vn",
        hoTen: "Nguyễn Hoàng Phúc",
        gioiTinh: "Nam",
        maLop: "13DHTH02",
        maKhoa: "CNTT",
        soDT: "0912345675",
        ngaySinh: new Date("2004-06-22"),
      },
    ];

    for (const student of Students) {
      const lop = await prisma.lopHoc.findUnique({
        where: { maLop: student.maLop },
      });

      if (lop) {
        const maSV = student.email.split("@")[0];
        await prisma.nguoiDung.upsert({
          where: { email: student.email },
          update: {
            lopHocId: lop.id,
          },
          create: {
            ...student,
            maSV,
            matKhau: hashed,
            vaiTro: "SINHVIEN",
            isActive: true,
            avatarUrl: "/images/profile.png",
            lopHocId: lop.id,
          },
        });
      }
    }

    const BENEFITS_PRESET = [
      "Cộng điểm rèn luyện",
      "Giấy chứng nhận (nếu đủ điều kiện)",
      "Kỹ năng làm việc nhóm",
      "Kỹ năng tổ chức sự kiện",
      "Trải nghiệm hoạt động cộng đồng",
    ];

    const REQUIREMENTS_PRESET = [
      "Đúng giờ, mang thẻ SV",
      "Trang phục gọn gàng",
      "Tuân thủ phân công",
      "Giữ vệ sinh khu vực",
      "Ứng xử văn minh",
    ];

    const GUIDES_PRESET = [
      "Tập trung tại điểm danh trước 15 phút",
      "Theo dõi thông báo trên dashboard",
      "Nhóm trưởng nhận dụng cụ tại phòng CTSV",
      "Báo cáo nhanh cuối buổi cho phụ trách",
    ];

    const RESPONSIBILITIES_PRESET = [
      "Hỗ trợ hậu cần",
      "Dẫn đường – hướng dẫn",
      "Dọn vệ sinh – thu gom",
      "Truyền thông – chụp ảnh",
      "Điều phối hàng ghế",
    ];

    const pickSome = (arr, n = 3) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy.slice(0, Math.min(n, copy.length));
    };

    const buildRichDescription = (summary, benefits = [], responsibilities = []) => {
      const safeSummary = typeof summary === "string" && summary.trim() ? summary.trim() : null;
      const listItems = (items) =>
        items
          .filter((item) => typeof item === "string" && item.trim())
          .map((item) => `<li>${item.trim()}</li>`)
          .join("");

      const benefitList = listItems(benefits);
      const responsibilityList = listItems(responsibilities);

      return [
        safeSummary ? `<p>${safeSummary}</p>` : null,
        benefitList ? `<h3>Quyền lợi</h3><ul>${benefitList}</ul>` : null,
        responsibilityList ? `<h3>Trách nhiệm</h3><ul>${responsibilityList}</ul>` : null,
      ]
        .filter(Boolean)
        .join("");
    };

    const activitiesData = [
      {
        tieuDe: "Vệ sinh khuôn viên khoa CNTT",
        moTa: "Tổng vệ sinh khuôn viên, sắp xếp lại ghế đá và bảng thông báo.",
        diemCong: 10,
        batDauLuc: new Date("2025-10-30T08:00:00+07:00"),
        ketThucLuc: new Date("2025-10-30T12:00:00+07:00"),
        diaDiem: "Khuôn viên khoa CNTT, cơ sở Gò Vấp",
        sucChuaToiDa: 60,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_3",
        isFeatured: true,
        trangThaiDuyet: "DA_DUYET",
        nguoiTaoId: admin.id,
      },
      {
        tieuDe: "Hỗ trợ hướng dẫn tân sinh viên",
        moTa: "Trực bàn hướng dẫn, chỉ đường và hỗ trợ thủ tục.",
        diemCong: 8,
        batDauLuc: new Date("2025-10-30T09:30:00+07:00"),
        ketThucLuc: new Date("2025-10-30T11:45:00+07:00"),
        diaDiem: "Sảnh A, cơ sở Quang Trung",
        sucChuaToiDa: 30,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_3",
        isFeatured: false,
        trangThaiDuyet: "CHO_DUYET",
        nguoiTaoId: lecturer.id,
      },
      {
        tieuDe: "Chăm sóc vườn cây khoa",
        moTa: "Tưới cây, cắt tỉa lá khô, thu gom rác quanh bồn cây.",
        diemCong: 12,
        batDauLuc: new Date("2025-10-30T07:00:00+07:00"),
        ketThucLuc: new Date("2025-10-30T23:00:00+07:00"),
        diaDiem: "Sân sau nhà E",
        sucChuaToiDa: 25,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_2",
        isFeatured: false,
        trangThaiDuyet: "DA_DUYET",
        nguoiTaoId: lecturer.id,
      },
      {
        tieuDe: "Xuân yêu thương – gói quà sớm",
        moTa: "Chuẩn bị quà Tết sớm cho hoạt động gây quỹ Xuân tình nguyện.",
        diemCong: 15,
        batDauLuc: new Date("2025-10-30T10:00:00+07:00"),
        ketThucLuc: new Date("2025-10-30T15:00:00+07:00"),
        diaDiem: "Phòng Công tác sinh viên",
        sucChuaToiDa: 40,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_1",
        isFeatured: true,
        trangThaiDuyet: "BI_TU_CHOI",
        lyDoTuChoi: "Thông tin chưa đầy đủ, vui lòng bổ sung kế hoạch chi tiết.",
        nguoiTaoId: lecturer.id,
      },
      {
        tieuDe: "Tập huấn an toàn khi hiến máu",
        moTa: "Hướng dẫn kiến thức an toàn và dinh dưỡng trước – sau hiến máu.",
        diemCong: 15,
        batDauLuc: new Date("2025-11-03T23:45:00+07:00"),
        ketThucLuc: new Date("2025-11-04T12:00:00+07:00"),
        diaDiem: "Hội trường lớn",
        sucChuaToiDa: 100,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_3",
        isFeatured: false,
      },
      {
        tieuDe: "Tham quan Địa chỉ đỏ: Bảo tàng Chứng tích Chiến tranh",
        moTa: "Chuyến tham quan học tập truyền thống cách mạng.",
        diemCong: 60,
        batDauLuc: new Date("2025-11-03T23:45:00+07:00"),
        ketThucLuc: new Date("2025-11-04T12:00:00+07:00"),
        diaDiem: "28 Võ Văn Tần, Q.3",
        sucChuaToiDa: 90,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_1",
        isFeatured: true,
      },
      {
        tieuDe: "Ngày hội hiến máu – Giọt hồng IT",
        moTa: "Hiến máu tình nguyện vì cộng đồng.",
        diemCong: 25,
        batDauLuc: new Date("2025-11-05T07:30:00+07:00"),
        ketThucLuc: new Date("2025-11-05T10:30:00+07:00"),
        diaDiem: "Sảnh nhà A",
        sucChuaToiDa: 150,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_3",
        isFeatured: true,
      },
      {
        tieuDe: "Dọn rác tuyến kênh Tham Lương",
        moTa: "Hoạt động bảo vệ môi trường thiết thực.",
        diemCong: 18,
        batDauLuc: new Date("2025-11-10T07:00:00+07:00"),
        ketThucLuc: new Date("2025-11-10T11:00:00+07:00"),
        diaDiem: "Kênh Tham Lương, Q.12",
        sucChuaToiDa: 80,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_2",
        isFeatured: false,
      },
      {
        tieuDe: "Hỗ trợ tổ chức Ngày Nhà giáo Việt Nam 20/11",
        moTa: "Trang trí, sắp xếp chỗ ngồi, đón khách.",
        diemCong: 10,
        batDauLuc: new Date("2025-11-20T06:30:00+07:00"),
        ketThucLuc: new Date("2025-11-20T12:00:00+07:00"),
        diaDiem: "Hội trường lớn",
        sucChuaToiDa: 50,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_3",
        isFeatured: true,
      },
      {
        tieuDe: "Xuân tình nguyện – Gây quỹ ấm no",
        moTa: "Bán hàng gây quỹ chuẩn bị cho chuyến đi vùng sâu.",
        diemCong: 16,
        batDauLuc: new Date("2025-12-01T08:00:00+07:00"),
        ketThucLuc: new Date("2025-12-01T17:00:00+07:00"),
        diaDiem: "Sảnh nhà B",
        sucChuaToiDa: 70,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_1",
        isFeatured: false,
      },
      {
        tieuDe: "Mùa hè xanh – Tập huấn tiền trạm",
        moTa: "Tập huấn kỹ năng sinh hoạt tập thể, an toàn lao động.",
        diemCong: 15,
        batDauLuc: new Date("2026-01-15T08:00:00+07:00"),
        ketThucLuc: new Date("2026-01-15T11:00:00+07:00"),
        diaDiem: "Sân bóng khoa CNTT",
        sucChuaToiDa: 120,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_2",
        isFeatured: false,
      },
      {
        tieuDe: "TUYỂN TÌNH NGUYỆN VIÊN ĐĂNG KÝ HIẾN MÁU TÌNH NGUYỆN ❤🩸",
        moTa: "Trở thành anh hùng thầm lặng bằng cách tham gia hiến máu.",
        diemCong: 25,
        batDauLuc: new Date("2025-10-30T10:20:00+07:00"),
        ketThucLuc: new Date("2025-10-30T10:55:00+07:00"),
        diaDiem: "Nhà hàng Đồng Xanh, 1320 Lê Đức Thọ, Gò Vấp",
        sucChuaToiDa: 120,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_3",
        isFeatured: false,
      },
      {
        tieuDe: "Chỉnh trang bảng tin khoa",
        moTa: "Thay poster cũ, gom rác quanh khu vực bảng tin.",
        diemCong: 6,
        batDauLuc: new Date("2025-10-29T09:00:00+07:00"),
        ketThucLuc: new Date("2025-10-29T12:00:00+07:00"),
        diaDiem: "Hành lang nhà E",
        sucChuaToiDa: 20,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_3",
        isFeatured: false,
      },
      {
        tieuDe: "Tuyên truyền an toàn giao thông",
        moTa: "Phát tờ rơi, hướng dẫn đội mũ bảo hiểm đúng quy cách.",
        diemCong: 10,
        batDauLuc: new Date("2025-10-20T07:00:00+07:00"),
        ketThucLuc: new Date("2025-10-20T11:30:00+07:00"),
        diaDiem: "Cổng trường",
        sucChuaToiDa: 100,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_3",
        isFeatured: false,
      },
      {
        tieuDe: "Đêm hội trăng rằm – hỗ trợ chương trình",
        moTa: "Sắp xếp chỗ ngồi, phát quà cho thiếu nhi khu vực lân cận.",
        diemCong: 12,
        batDauLuc: new Date("2025-10-01T18:00:00+07:00"),
        ketThucLuc: new Date("2025-10-01T20:00:00+07:00"),
        diaDiem: "Sân trường",
        sucChuaToiDa: 80,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_1",
        isFeatured: false,
      },
      {
        tieuDe: "Tham quan Địa đạo Củ Chi",
        moTa: "Học tập lịch sử đấu tranh cách mạng dân tộc.",
        diemCong: 20,
        batDauLuc: new Date("2025-09-15T08:00:00+07:00"),
        ketThucLuc: new Date("2025-09-15T11:00:00+07:00"),
        diaDiem: "Địa đạo Củ Chi",
        sucChuaToiDa: 120,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_1",
        isFeatured: true,
      },
      {
        tieuDe: "Dọn vệ sinh phòng máy",
        moTa: "Lau màn hình, vệ sinh bàn ghế, gom rác điện tử.",
        diemCong: 8,
        batDauLuc: new Date("2025-10-10T13:30:00+07:00"),
        ketThucLuc: new Date("2025-10-10T16:30:00+07:00"),
        diaDiem: "Phòng Lab 3",
        sucChuaToiDa: 25,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_3",
        isFeatured: false,
      },
      {
        tieuDe: "Nhặt rác – Tuyến đường xanh",
        moTa: "Làm sạch tuyến đường trước cổng trường.",
        diemCong: 9,
        batDauLuc: new Date("2025-10-05T07:00:00+07:00"),
        ketThucLuc: new Date("2025-10-05T09:30:00+07:00"),
        diaDiem: "Đường Lê Đức Thọ",
        sucChuaToiDa: 60,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_2",
        isFeatured: false,
      },
      {
        tieuDe: "Tập huấn PCCC cơ bản",
        moTa: "Hướng dẫn sử dụng bình chữa cháy, kỹ năng thoát hiểm.",
        diemCong: 7,
        batDauLuc: new Date("2025-09-25T08:00:00+07:00"),
        ketThucLuc: new Date("2025-09-25T10:00:00+07:00"),
        diaDiem: "Bãi xe nhà A",
        sucChuaToiDa: 100,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_3",
        isFeatured: true,
      },
      {
        tieuDe: "Hiến máu – HUIT vì cộng đồng",
        moTa: "Sự kiện hiến máu định kỳ của khoa.",
        diemCong: 25,
        batDauLuc: new Date("2025-09-20T07:30:00+07:00"),
        ketThucLuc: new Date("2025-09-20T11:00:00+07:00"),
        diaDiem: "Sảnh chính",
        sucChuaToiDa: 140,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_3",
        isFeatured: false,
      },
      {
        tieuDe: "Địa chỉ đỏ: Bảo tàng Hồ Chí Minh – Chi nhánh TP.HCM",
        moTa: "Hành trình về nguồn dành cho tân sinh viên.",
        diemCong: 20,
        batDauLuc: new Date("2025-09-10T08:00:00+07:00"),
        ketThucLuc: new Date("2025-09-10T11:00:00+07:00"),
        diaDiem: "1 Nguyễn Tất Thành, Q.4",
        sucChuaToiDa: 100,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_1",
        isFeatured: false,
      },
      {
        tieuDe: "Tiếp sức mùa thi – tổng kết",
        moTa: "Tổng kết chiến dịch, trao giấy chứng nhận TNV.",
        diemCong: 15,
        batDauLuc: new Date("2025-08-30T09:00:00+07:00"),
        ketThucLuc: new Date("2025-08-30T11:00:00+07:00"),
        diaDiem: "Hội trường tầng 2",
        sucChuaToiDa: 200,
        hinhAnh: "/images/fallback-cover.png",
        nhomDiem: "NHOM_3",
        isFeatured: true,
      },
    ];

    for (const activity of activitiesData) {
      const academicPeriod = await resolveAcademicPeriodForDate(
        activity.batDauLuc ?? activity.ketThucLuc
      );
      const benefits = activity.benefits ?? pickSome(BENEFITS_PRESET, 3);
      const responsibilities = activity.responsibilities ?? pickSome(RESPONSIBILITIES_PRESET, 3);
      const richDescription = buildRichDescription(activity.moTa, benefits, responsibilities);

      const payload = {
        tieuDe: activity.tieuDe,
        moTa: richDescription || null,
        yeuCau: activity.yeuCau ?? pickSome(REQUIREMENTS_PRESET, 3),
        huongDan: activity.huongDan ?? pickSome(GUIDES_PRESET, 3),
        diemCong: activity.diemCong,
        batDauLuc: activity.batDauLuc,
        ketThucLuc: activity.ketThucLuc,
        diaDiem: activity.diaDiem,
        sucChuaToiDa: activity.sucChuaToiDa,
        hinhAnh: activity.hinhAnh,
        isFeatured: activity.isFeatured,
        phuongThucDiemDanh: activity.phuongThucDiemDanh ?? "PHOTO",
        hocKyId: activity.hocKyId ?? academicPeriod.hocKyId,
        namHocId: activity.namHocId ?? academicPeriod.namHocId,
        isPublished: activity.isPublished ?? true,
        nhomDiem: activity.nhomDiem ?? "NHOM_2",
        trangThaiDuyet: activity.trangThaiDuyet ?? "DA_DUYET",
        nguoiTaoId: activity.nguoiTaoId ?? admin.id,
        lyDoTuChoi: activity.lyDoTuChoi ?? null,
      };

      const existing = await prisma.hoatDong.findFirst({ where: { tieuDe: activity.tieuDe } });
      if (existing) {
        await prisma.hoatDong.update({ where: { id: existing.id }, data: payload });
      } else {
        await prisma.hoatDong.create({ data: payload });
      }
    }

    console.log("Tạo seed thành công");
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
};

seed();
