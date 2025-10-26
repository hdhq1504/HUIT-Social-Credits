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
        tieuDe: "TUYỂN TÌNH NGUYỆN VIÊN ĐĂNG KÝ HIẾN MÁU TÌNH NGUYỆN ❤🩸",
        moTa: "🩸Muốn cứu vớt thế giới thì không cần phải là siêu anh hùng đội mũ bảo hiểm xanh đâu, bạn có thể là một nhà anh hùng trong mắt những người cần giúp đỡ bằng cách trở thành một tình nguyện viên hiến máu! Đây không chỉ là một hành động nhân ái, mà còn là cơ hội để bạn thể hiện tình yêu thương và sẻ chia với cộng đồng.",
        diemCong: 25,
        batDauLuc: new Date("2025-12-31T06:30:00+07:00"),
        ketThucLuc: new Date("2025-12-31T11:30:00+07:00"),
        diaDiem: "Nhà hàng tiệc cưới Đồng Xanh, 1320 Lê Đức Thọ, phường 13, quận Gò Vấp",
        sucChuaToiDa: 120,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HIEN_MAU",
        isFeatured: false
      },
      {
        maHoatDong: "HD002",
        tieuDe: "THAM GIA CÙNG HSS - MÙA HÈ XANH 2024!",
        moTa: null,
        diemCong: 30,
        batDauLuc: new Date("2025-10-15T16:30:00+07:00"),
        ketThucLuc: null,
        diaDiem: "Phòng B301",
        sucChuaToiDa: 30,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HO_TRO",
        isFeatured: true
      },
      {
        maHoatDong: "HD003",
        tieuDe: "HỖ TRỢ TTQLCL",
        moTa: "💥 Chiến dịch Mùa Hè Xanh 2024 hứa hẹn mang đến những trải nghiệm đặc biệt và kích thích sự sáng tạo. Tại đây, bạn sẽ được thử sức, khám phá và hòa mình vào những hoạt động đầy thử thách và ý nghĩa, góp phần thay đổi tích cực cho xã hội và để lại dấu ấn đậm nét trong lòng mọi người.",
        diemCong: 50,
        batDauLuc: new Date("2024-07-15"),
        ketThucLuc: new Date("2024-07-25"),
        diaDiem: "Xã Long Chữ huyện Bến Cầu tỉnh Tây Ninh",
        sucChuaToiDa: null,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "MUA_HE_XANH",
        isFeatured: true
      },
      {
        maHoatDong: "HD004",
        tieuDe: "Test",
        moTa: "Đây là mô tả",
        diemCong: 50,
        batDauLuc: new Date("2025-10-27T12:45:00+07:00"),
        ketThucLuc: null,
        diaDiem: null,
        sucChuaToiDa: null,
        hinhAnh: "/images/activity-cover.png",
        categoryCode: "HO_TRO",
        isFeatured: false
      },
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
