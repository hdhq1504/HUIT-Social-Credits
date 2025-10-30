import bcrypt from "bcrypt";
import prisma from "./prisma.js";

const seed = async () => {
  try {
    const email = "2001223947@huit.edu.vn";
    const maSV = email.split("@")[0];
    const plainPassword = process.env.SEED_PASSWORD || "1234";
    const hashed = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.nguoiDung.upsert({
      where: { email },
      update: {},
      create: {
        email,
        matKhau: hashed,
        hoTen: "Hồ Đức Hoàng Quân",
        vaiTro: "SINHVIEN",
        maSV,
        isActive: true,
        gioiTinh: "Nam",
        maLop: "13DHTH02",
        maKhoa: "CNTT",
        soDT: "0931318657",
        ngaySinh: new Date("2004-04-15"),
        avatarUrl: "/images/profile.png",
      },
    });

    const categoriesData = [
      { ma: "DIA_CHI_DO", ten: "Địa chỉ đỏ", moTa: "Hoạt động bắt buộc", nhomDiem: "NHOM_1" },
      { ma: "HIEN_MAU", ten: "Hiến máu", moTa: "Cứu người, cứu đời", nhomDiem: "NHOM_2_3" },
      { ma: "MUA_HE_XANH", ten: "Mùa hè xanh", moTa: "Bảo vệ môi trường", nhomDiem: "NHOM_2_3" },
      { ma: "XUAN_TINH_NGUYEN", ten: "Xuân tình nguyện", moTa: "Hoạt động mùa xuân", nhomDiem: "NHOM_2_3" },
      { ma: "HO_TRO", ten: "Hỗ trợ", moTa: "Hỗ trợ cộng đồng", nhomDiem: "NHOM_2_3" }
    ];

    const categoryMap = {};
    for (const category of categoriesData) {
      const created = await prisma.danhMucHoatDong.upsert({
        where: { ma: category.ma },
        update: {
          ten: category.ten,
          moTa: category.moTa,
          nhomDiem: category.nhomDiem,
          isActive: true
        },
        create: {
          ...category,
          isActive: true
        }
      });
      categoryMap[category.ma] = created;
    }

    const activitiesData = [
      // ===== ĐANG DIỄN RA (bắt đầu trước 11:00 và kết thúc sau 11:00, 30/10/2025) =====
      {
        maHoatDong: "HD20251030-ONGO-01",
        tieuDe: "Vệ sinh khuôn viên khoa CNTT",
        moTa: "Tổng vệ sinh khuôn viên, sắp xếp lại ghế đá và bảng thông báo.",
        diemCong: 10,
        batDauLuc: new Date("2025-10-30T08:00:00+07:00"),
        ketThucLuc: new Date("2025-10-30T12:00:00+07:00"),
        diaDiem: "Khuôn viên khoa CNTT, cơ sở Gò Vấp",
        sucChuaToiDa: 60,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HO_TRO",
        isFeatured: true
      },
      {
        maHoatDong: "HD20251030-ONGO-02",
        tieuDe: "Hỗ trợ hướng dẫn tân sinh viên",
        moTa: "Trực bàn hướng dẫn, chỉ đường và hỗ trợ thủ tục.",
        diemCong: 8,
        batDauLuc: new Date("2025-10-30T09:30:00+07:00"),
        ketThucLuc: new Date("2025-10-30T11:45:00+07:00"),
        diaDiem: "Sảnh A, cơ sở Quang Trung",
        sucChuaToiDa: 30,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HO_TRO",
        isFeatured: false
      },
      {
        maHoatDong: "HD20251030-ONGO-03",
        tieuDe: "Chăm sóc vườn cây khoa",
        moTa: "Tưới cây, cắt tỉa lá khô, thu gom rác quanh bồn cây.",
        diemCong: 12,
        batDauLuc: new Date("2025-10-30T07:00:00+07:00"),
        ketThucLuc: new Date("2025-10-30T23:00:00+07:00"),
        diaDiem: "Sân sau nhà E",
        sucChuaToiDa: 25,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "MUA_HE_XANH",
        isFeatured: false
      },
      {
        maHoatDong: "HD20251030-ONGO-04",
        tieuDe: "Xuân yêu thương – gói quà sớm",
        moTa: "Chuẩn bị quà Tết sớm cho hoạt động gây quỹ Xuân tình nguyện.",
        diemCong: 15,
        batDauLuc: new Date("2025-10-30T10:00:00+07:00"),
        ketThucLuc: new Date("2025-10-30T15:00:00+07:00"),
        diaDiem: "Phòng Công tác sinh viên",
        sucChuaToiDa: 40,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "XUAN_TINH_NGUYEN",
        isFeatured: true
      },

      // ===== SẮP DIỄN RA (bắt đầu sau 11:00, 30/10/2025) =====
      {
        maHoatDong: "HD20251030-UP-01",
        tieuDe: "Tập huấn an toàn khi hiến máu",
        moTa: "Hướng dẫn kiến thức an toàn và dinh dưỡng trước – sau hiến máu.",
        diemCong: 6,
        batDauLuc: new Date("2025-10-30T12:30:00+07:00"),
        ketThucLuc: new Date("2025-10-30T12:40:00+07:00"),
        diaDiem: "Hội trường lớn",
        sucChuaToiDa: 100,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HIEN_MAU",
        isFeatured: false
      },
      {
        maHoatDong: "HD20251031-UP-01",
        tieuDe: "Tham quan Địa chỉ đỏ: Bảo tàng Chứng tích Chiến tranh",
        moTa: "Chuyến tham quan học tập truyền thống cách mạng.",
        diemCong: 60,
        batDauLuc: new Date("2025-10-30T12:15:00+07:00"),
        ketThucLuc: new Date("2025-10-30T12:20:00+07:00"),
        diaDiem: "28 Võ Văn Tần, Q.3",
        sucChuaToiDa: 90,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "DIA_CHI_DO",
        isFeatured: true
      },
      {
        maHoatDong: "HD20251105-UP-01",
        tieuDe: "Ngày hội hiến máu – Giọt hồng IT",
        moTa: "Hiến máu tình nguyện vì cộng đồng.",
        diemCong: 25,
        batDauLuc: new Date("2025-11-05T07:30:00+07:00"),
        ketThucLuc: new Date("2025-11-05T10:30:00+07:00"),
        diaDiem: "Sảnh nhà A",
        sucChuaToiDa: 150,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HIEN_MAU",
        isFeatured: true
      },
      {
        maHoatDong: "HD20251110-UP-01",
        tieuDe: "Dọn rác tuyến kênh Tham Lương",
        moTa: "Hoạt động bảo vệ môi trường thiết thực.",
        diemCong: 18,
        batDauLuc: new Date("2025-11-10T07:00:00+07:00"),
        ketThucLuc: new Date("2025-11-10T11:00:00+07:00"),
        diaDiem: "Kênh Tham Lương, Q.12",
        sucChuaToiDa: 80,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "MUA_HE_XANH",
        isFeatured: false
      },
      {
        maHoatDong: "HD20251120-UP-01",
        tieuDe: "Hỗ trợ tổ chức Ngày Nhà giáo Việt Nam 20/11",
        moTa: "Trang trí, sắp xếp chỗ ngồi, đón khách.",
        diemCong: 10,
        batDauLuc: new Date("2025-11-20T06:30:00+07:00"),
        ketThucLuc: new Date("2025-11-20T12:00:00+07:00"),
        diaDiem: "Hội trường lớn",
        sucChuaToiDa: 50,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HO_TRO",
        isFeatured: true
      },
      {
        maHoatDong: "HD20251201-UP-01",
        tieuDe: "Xuân tình nguyện – Gây quỹ ấm no",
        moTa: "Bán hàng gây quỹ chuẩn bị cho chuyến đi vùng sâu.",
        diemCong: 16,
        batDauLuc: new Date("2025-12-01T08:00:00+07:00"),
        ketThucLuc: new Date("2025-12-01T17:00:00+07:00"),
        diaDiem: "Sảnh nhà B",
        sucChuaToiDa: 70,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "XUAN_TINH_NGUYEN",
        isFeatured: false
      },
      {
        maHoatDong: "HD20260115-UP-01",
        tieuDe: "Mùa hè xanh – Tập huấn tiền trạm",
        moTa: "Tập huấn kỹ năng sinh hoạt tập thể, an toàn lao động.",
        diemCong: 15,
        batDauLuc: new Date("2026-01-15T08:00:00+07:00"),
        ketThucLuc: new Date("2026-01-15T11:00:00+07:00"),
        diaDiem: "Sân bóng khoa CNTT",
        sucChuaToiDa: 120,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "MUA_HE_XANH",
        isFeatured: false
      },

      // ===== ĐÃ KẾT THÚC (kết thúc trước 11:00, 30/10/2025) =====
      {
        maHoatDong: "HIENMAU291025",
        tieuDe: "TUYỂN TÌNH NGUYỆN VIÊN ĐĂNG KÝ HIẾN MÁU TÌNH NGUYỆN ❤🩸",
        moTa: "Trở thành anh hùng thầm lặng bằng cách tham gia hiến máu.",
        diemCong: 25,
        batDauLuc: new Date("2025-10-30T10:20:00+07:00"),
        ketThucLuc: new Date("2025-10-30T10:55:00+07:00"),
        diaDiem: "Nhà hàng Đồng Xanh, 1320 Lê Đức Thọ, Gò Vấp",
        sucChuaToiDa: 120,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HIEN_MAU",
        isFeatured: false
      },
      {
        maHoatDong: "HD20251029-END-01",
        tieuDe: "Chỉnh trang bảng tin khoa",
        moTa: "Thay poster cũ, gom rác quanh khu vực bảng tin.",
        diemCong: 6,
        batDauLuc: new Date("2025-10-29T09:00:00+07:00"),
        ketThucLuc: new Date("2025-10-29T12:00:00+07:00"),
        diaDiem: "Hành lang nhà E",
        sucChuaToiDa: 20,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HO_TRO",
        isFeatured: false
      },
      {
        maHoatDong: "HD20251020-END-01",
        tieuDe: "Tuyên truyền an toàn giao thông",
        moTa: "Phát tờ rơi, hướng dẫn đội mũ bảo hiểm đúng quy cách.",
        diemCong: 10,
        batDauLuc: new Date("2025-10-20T07:00:00+07:00"),
        ketThucLuc: new Date("2025-10-20T11:30:00+07:00"),
        diaDiem: "Cổng trường",
        sucChuaToiDa: 100,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HO_TRO",
        isFeatured: false
      },
      {
        maHoatDong: "HD20251001-END-01",
        tieuDe: "Đêm hội trăng rằm – hỗ trợ chương trình",
        moTa: "Sắp xếp chỗ ngồi, phát quà cho thiếu nhi khu vực lân cận.",
        diemCong: 12,
        batDauLuc: new Date("2025-10-01T18:00:00+07:00"),
        ketThucLuc: new Date("2025-10-01T20:00:00+07:00"),
        diaDiem: "Sân trường",
        sucChuaToiDa: 80,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "XUAN_TINH_NGUYEN",
        isFeatured: false
      },
      {
        maHoatDong: "HD20250915-END-01",
        tieuDe: "Tham quan Địa đạo Củ Chi",
        moTa: "Học tập lịch sử đấu tranh cách mạng dân tộc.",
        diemCong: 20,
        batDauLuc: new Date("2025-09-15T08:00:00+07:00"),
        ketThucLuc: new Date("2025-09-15T11:00:00+07:00"),
        diaDiem: "Địa đạo Củ Chi",
        sucChuaToiDa: 120,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "DIA_CHI_DO",
        isFeatured: true
      },
      {
        maHoatDong: "HD20251010-END-01",
        tieuDe: "Dọn vệ sinh phòng máy",
        moTa: "Lau màn hình, vệ sinh bàn ghế, gom rác điện tử.",
        diemCong: 8,
        batDauLuc: new Date("2025-10-10T13:30:00+07:00"),
        ketThucLuc: new Date("2025-10-10T16:30:00+07:00"),
        diaDiem: "Phòng Lab 3",
        sucChuaToiDa: 25,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HO_TRO",
        isFeatured: false
      },
      {
        maHoatDong: "HD20251005-END-01",
        tieuDe: "Nhặt rác – Tuyến đường xanh",
        moTa: "Làm sạch tuyến đường trước cổng trường.",
        diemCong: 9,
        batDauLuc: new Date("2025-10-05T07:00:00+07:00"),
        ketThucLuc: new Date("2025-10-05T09:30:00+07:00"),
        diaDiem: "Đường Lê Đức Thọ",
        sucChuaToiDa: 60,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "MUA_HE_XANH",
        isFeatured: false
      },
      {
        maHoatDong: "HD20250925-END-01",
        tieuDe: "Tập huấn PCCC cơ bản",
        moTa: "Hướng dẫn sử dụng bình chữa cháy, kỹ năng thoát hiểm.",
        diemCong: 7,
        batDauLuc: new Date("2025-09-25T08:00:00+07:00"),
        ketThucLuc: new Date("2025-09-25T10:00:00+07:00"),
        diaDiem: "Bãi xe nhà A",
        sucChuaToiDa: 100,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HO_TRO",
        isFeatured: true
      },
      {
        maHoatDong: "HD20250920-END-01",
        tieuDe: "Hiến máu – HUIT vì cộng đồng",
        moTa: "Sự kiện hiến máu định kỳ của khoa.",
        diemCong: 25,
        batDauLuc: new Date("2025-09-20T07:30:00+07:00"),
        ketThucLuc: new Date("2025-09-20T11:00:00+07:00"),
        diaDiem: "Sảnh chính",
        sucChuaToiDa: 140,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HIEN_MAU",
        isFeatured: false
      },
      {
        maHoatDong: "HD20250910-END-01",
        tieuDe: "Địa chỉ đỏ: Bảo tàng Hồ Chí Minh – Chi nhánh TP.HCM",
        moTa: "Hành trình về nguồn dành cho tân sinh viên.",
        diemCong: 20,
        batDauLuc: new Date("2025-09-10T08:00:00+07:00"),
        ketThucLuc: new Date("2025-09-10T11:00:00+07:00"),
        diaDiem: "1 Nguyễn Tất Thành, Q.4",
        sucChuaToiDa: 100,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "DIA_CHI_DO",
        isFeatured: false
      },
      {
        maHoatDong: "HD20250830-END-01",
        tieuDe: "Tiếp sức mùa thi – tổng kết",
        moTa: "Tổng kết chiến dịch, trao giấy chứng nhận TNV.",
        diemCong: 15,
        batDauLuc: new Date("2025-08-30T09:00:00+07:00"),
        ketThucLuc: new Date("2025-08-30T11:00:00+07:00"),
        diaDiem: "Hội trường tầng 2",
        sucChuaToiDa: 200,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HO_TRO",
        isFeatured: true
      }
    ];

    const activityMap = {};
    for (const activity of activitiesData) {
      const category = activity.categoryCode ? categoryMap[activity.categoryCode] : null;
      const payload = {
        tieuDe: activity.tieuDe,
        moTa: activity.moTa,
        diemCong: activity.diemCong,
        batDauLuc: activity.batDauLuc,
        ketThucLuc: activity.ketThucLuc,
        diaDiem: activity.diaDiem,
        sucChuaToiDa: activity.sucChuaToiDa,
        hinhAnh: activity.hinhAnh,
        isFeatured: activity.isFeatured,
        isPublished: true,
        danhMucId: category?.id ?? null,
        nhomDiem: category?.nhomDiem
      };

      const created = await prisma.hoatDong.upsert({
        where: { maHoatDong: activity.maHoatDong },
        update: payload,
        create: {
          maHoatDong: activity.maHoatDong,
          ...payload
        }
      });
      activityMap[activity.maHoatDong] = created;
    }

    const registrationsData = [];

    const now = new Date();
    for (const registration of registrationsData) {
      const activity = activityMap[registration.maHoatDong];
      if (!activity) continue;
      await prisma.dangKyHoatDong.upsert({
        where: {
          nguoiDungId_hoatDongId: {
            nguoiDungId: user.id,
            hoatDongId: activity.id
          }
        },
        update: {
          trangThai: registration.trangThai,
          dangKyLuc: registration.dangKyLuc ?? now,
          diemDanhLuc: registration.diemDanhLuc ?? now,
          diemDanhBoiId: user.id,
          lyDoHuy: null,
          ghiChu: null,
          diemDanhGhiChu: null
        },
        create: {
          nguoiDungId: user.id,
          hoatDongId: activity.id,
          trangThai: registration.trangThai,
          dangKyLuc: registration.dangKyLuc ?? now,
          diemDanhLuc: registration.diemDanhLuc ?? now,
          diemDanhBoiId: user.id
        }
      });
    }

    console.log("Tạo seed thành công");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

seed();
