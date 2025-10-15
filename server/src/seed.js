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
        // Các field tùy chọn bên dưới có thể bổ sung khi cần:
        // gioiTinh: "OTHER",
        maLop: "13DHTH02",
        // maKhoa: "CNTT",
        soDT: "0931318657",
        ngaySinh: new Date("2004-04-15"),
        avatarUrl: "https://...",
        // ghiChu: "User seed mặc định"
      },
    });

    console.log("Seeded NguoiDung:", email, "/", plainPassword);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

seed();
