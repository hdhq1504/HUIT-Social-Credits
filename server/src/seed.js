import bcrypt from "bcrypt";
import prisma from "./prisma.js";

const seed = async () => {
  try {
    const email = "2001223947@huit.edu.vn";
    const maSV = email.split("@")[0];
    const plainPassword = process.env.SEED_PASSWORD || "1234";
    const hashed = await bcrypt.hash(plainPassword, 10);

    await prisma.nguoiDung.upsert({
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
        avatarUrl: "https://...",
        // ghiChu: "User seed mặc định"
      },
    });

    const activities = [
      {
        maHoatDong: "HD001",
        tieuDe: "Chiến dịch hiến máu nhân đạo 2024",
        moTa: "Tham gia hiến máu cứu người cùng Đoàn trường.",
        diemCong: 20,
        batDauLuc: new Date("2024-12-15T08:00:00+07:00"),
        ketThucLuc: new Date("2024-12-15T11:30:00+07:00"),
        diaDiem: "Nhà hát HUTECH, cơ sở Ung Văn Khiêm",
        sucChuaToiDa: 80,
        hinhAnh: "https://placehold.co/600x360?text=Hien+Mau",
        danhMuc: "Hiến máu",
        isFeatured: true
      },
      {
        maHoatDong: "HD002",
        tieuDe: "Xuân tình nguyện - Gói bánh chưng trao tặng",
        moTa: "Gói bánh chưng tặng các gia đình có hoàn cảnh khó khăn.",
        diemCong: 15,
        batDauLuc: new Date("2025-01-20T07:30:00+07:00"),
        ketThucLuc: new Date("2025-01-20T17:00:00+07:00"),
        diaDiem: "Khu A, ký túc xá Đại học HUTECH",
        sucChuaToiDa: 120,
        hinhAnh: "https://placehold.co/600x360?text=Xuan+Tinh+Nguyen",
        danhMuc: "Xuân tình nguyện",
        isFeatured: true
      },
      {
        maHoatDong: "HD003",
        tieuDe: "Vệ sinh môi trường - Chủ nhật xanh",
        moTa: "Ra quân dọn dẹp tuyến đường xanh - sạch - đẹp.",
        diemCong: 10,
        batDauLuc: new Date("2024-11-10T06:30:00+07:00"),
        ketThucLuc: new Date("2024-11-10T10:30:00+07:00"),
        diaDiem: "Khu phố 5, phường Hiệp Bình Chánh, TP. Thủ Đức",
        sucChuaToiDa: 60,
        hinhAnh: "https://placehold.co/600x360?text=Chu+Nhat+Xanh",
        danhMuc: "Chiến dịch xanh",
        isFeatured: false
      }
    ];

    for (const activity of activities) {
      await prisma.hoatDong.upsert({
        where: { maHoatDong: activity.maHoatDong },
        update: activity,
        create: activity
      });
    }

    const user = await prisma.nguoiDung.findUnique({ where: { email } });
    const hoatDong = await prisma.hoatDong.findUnique({ where: { maHoatDong: "HD001" } });
    if (user && hoatDong) {
      await prisma.dangKyHoatDong.upsert({
        where: {
          nguoiDungId_hoatDongId: { nguoiDungId: user.id, hoatDongId: hoatDong.id }
        },
        update: { trangThai: "DANG_KY" },
        create: {
          nguoiDungId: user.id,
          hoatDongId: hoatDong.id,
          trangThai: "DANG_KY"
        }
      });
    }

    console.log("Seeded NguoiDung:", email, "/", plainPassword);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

seed();
