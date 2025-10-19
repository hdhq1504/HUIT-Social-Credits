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
      {
        maHoatDong: "HD001",
        tieuDe: "Chiến dịch hiến máu nhân đạo 2025",
        moTa: "Tham gia hiến máu cứu người cùng Đoàn trường.",
        diemCong: 20,
        batDauLuc: new Date("2025-12-15T08:00:00+07:00"),
        ketThucLuc: new Date("2025-12-15T11:30:00+07:00"),
        diaDiem: "Nhà hát HUTECH, cơ sở Ung Văn Khiêm",
        sucChuaToiDa: 80,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HIEN_MAU",
        isFeatured: true
      },
      {
        maHoatDong: "HD002",
        tieuDe: "Xuân tình nguyện - Gói bánh chưng trao tặng",
        moTa: "Gói bánh chưng tặng các gia đình có hoàn cảnh khó khăn.",
        diemCong: 15,
        batDauLuc: new Date("2025-10-20T07:30:00+07:00"),
        ketThucLuc: new Date("2025-10-20T17:00:00+07:00"),
        diaDiem: "Khu A, ký túc xá Đại học HUTECH",
        sucChuaToiDa: 120,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "XUAN_TINH_NGUYEN",
        isFeatured: true
      },
      {
        maHoatDong: "HD003",
        tieuDe: "Vệ sinh môi trường - Chủ nhật xanh",
        moTa: "Ra quân dọn dẹp tuyến đường xanh - sạch - đẹp.",
        diemCong: 10,
        batDauLuc: new Date("2025-11-10T06:30:00+07:00"),
        ketThucLuc: new Date("2025-11-10T10:30:00+07:00"),
        diaDiem: "Khu phố 5, phường Hiệp Bình Chánh, TP. Thủ Đức",
        sucChuaToiDa: 60,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "MUA_HE_XANH",
        isFeatured: false
      },
      {
        maHoatDong: "HD004",
        tieuDe: "Tư vấn hướng nghiệp - Kết nối doanh nghiệp",
        moTa: "Gặp gỡ doanh nghiệp để hiểu thêm về nhu cầu tuyển dụng và xu hướng nghề nghiệp.",
        diemCong: 8,
        batDauLuc: new Date("2025-12-05T13:30:00+07:00"),
        ketThucLuc: new Date("2025-12-05T16:30:00+07:00"),
        diaDiem: "Hội trường A-08.20, cơ sở Điện Biên Phủ",
        sucChuaToiDa: 150,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HO_TRO",
        isFeatured: false
      },
      {
        maHoatDong: "HD005",
        tieuDe: "Về việc triển khai tổ chức tham quan địa chỉ đỏ năm 2025",
        moTa: "Thực hiện kế hoạch năm học 2024-2025, Trường Đại học Công Thương Thành phố Hồ Chí Minh triển khai kế hoạch tổ chức tham quan địa chỉ đỏ năm 2025 cho SV theo học tại Trường.",
        diemCong: 60,
        batDauLuc: new Date("2025-12-12T09:00:00+07:00"),
        ketThucLuc: new Date("2025-12-12T12:00:00+07:00"),
        diaDiem: "Khu di tích lịch sử cấp quốc gia Văn Miếu Trấn Biên, TP. Biên Hòa, tỉnh Đồng Nai",
        sucChuaToiDa: 45,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "DIA_CHI_DO",
        isFeatured: true
      },
      {
        maHoatDong: "HD006",
        tieuDe: "Thông báo đăng ký tham gia CTXH tại viện chuyển đổi số",
        moTa: "",
        diemCong: 15,
        batDauLuc: new Date("2025-10-20T08:00:00+07:00"),
        ketThucLuc: new Date("2025-11-09T11:45:00+07:00"),
        diaDiem: "Viện chuyển đổi số",
        sucChuaToiDa: 200,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HO_TRO",
        isFeatured: false
      },
      // {
      //   maHoatDong: "HD007",
      //   tieuDe: "Ngày hội việc làm sinh viên 2025",
      //   moTa: "Giao lưu trực tiếp với hơn 30 doanh nghiệp và cơ hội tuyển dụng thực tập.",
      //   diemCong: 18,
      //   batDauLuc: new Date("2025-03-05T08:30:00+07:00"),
      //   ketThucLuc: new Date("2025-03-05T16:00:00+07:00"),
      //   diaDiem: "Sảnh chính cơ sở Điện Biên Phủ",
      //   sucChuaToiDa: 500,
      //   hinhAnh: "https://placehold.co/600x360?text=Job+Fair",
      //   danhMuc: "Ngày hội",
      //   isFeatured: true
      // },
      // {
      //   maHoatDong: "HD008",
      //   tieuDe: "Talkshow khởi nghiệp cùng cựu sinh viên",
      //   moTa: "Lắng nghe kinh nghiệm khởi nghiệp và hành trình xây dựng doanh nghiệp.",
      //   diemCong: 9,
      //   batDauLuc: new Date("2025-02-15T18:00:00+07:00"),
      //   ketThucLuc: new Date("2025-02-15T20:30:00+07:00"),
      //   diaDiem: "Hội trường B-02.01, cơ sở Thủ Đức",
      //   sucChuaToiDa: 120,
      //   hinhAnh: "https://placehold.co/600x360?text=Talkshow+Startup",
      //   danhMuc: "Khởi nghiệp",
      //   isFeatured: false
      // },
      // {
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
        nhomDiem: category?.nhomDiem ?? "NHOM_2_3"
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

    const registrationsData = [
      {
        maHoatDong: "HD005",
        trangThai: "DA_THAM_GIA",
        dangKyLuc: new Date("2025-12-05T08:00:00+07:00"),
        diemDanhLuc: new Date("2025-12-12T12:10:00+07:00")
      },
      {
        maHoatDong: "HD001",
        trangThai: "DA_THAM_GIA",
        dangKyLuc: new Date("2025-12-10T08:00:00+07:00"),
        diemDanhLuc: new Date("2025-12-15T11:45:00+07:00")
      }
    ];

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
