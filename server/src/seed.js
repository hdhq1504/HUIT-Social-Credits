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
        avatarUrl: "/images/profile.png",
        // ghiChu: "User seed mặc định"
      },
    });

    const activities = [
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
        hinhAnh: "/images/activity-cover.png",
        danhMuc: "Xuân tình nguyện",
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
        danhMuc: "Mùa hè xanh",
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
        danhMuc: "Hỗ trợ",
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
        danhMuc: "Địa chỉ đỏ",
        isFeatured: true
      },
      {
        maHoatDong: "HD006",
        tieuDe: "Thông báo đăng ký tham gia CTXH tại viện chuyển đổi số ",
        moTa: "",
        diemCong: 15,
        batDauLuc: new Date("2025-10-20T08:00:00+07:00"),
        ketThucLuc: new Date("2025-11-09T11:45:00+07:00"),
        diaDiem: "Viện chuyển đổi số",
        sucChuaToiDa: 200,
        hinhAnh: "/images/activity-cover.png",
        danhMuc: "Hỗ trợ",
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
      //   maHoatDong: "HD009",
      //   tieuDe: "Tập huấn kỹ năng mềm - Thuyết trình hiệu quả",
      //   moTa: "Rèn luyện kỹ năng thuyết trình, tương tác và xử lý tình huống.",
      //   diemCong: 11,
      //   batDauLuc: new Date("2025-12-22T08:00:00+07:00"),
      //   ketThucLuc: new Date("2024-12-22T12:00:00+07:00"),
      //   diaDiem: "Phòng hội thảo A-02.05, cơ sở Điện Biên Phủ",
      //   sucChuaToiDa: 90,
      //   hinhAnh: "https://placehold.co/600x360?text=Ky+Nang+Mem",
      //   danhMuc: "Kỹ năng mềm",
      //   isFeatured: false
      // },
      // {
      //   maHoatDong: "HD010",
      //   tieuDe: "Trại xuân truyền thống khoa CNTT",
      //   moTa: "Các trò chơi tập thể, giao lưu văn nghệ chào mừng năm mới.",
      //   diemCong: 16,
      //   batDauLuc: new Date("2025-01-12T15:00:00+07:00"),
      //   ketThucLuc: new Date("2025-01-13T09:00:00+07:00"),
      //   diaDiem: "Khu du lịch Văn Thánh",
      //   sucChuaToiDa: 250,
      //   hinhAnh: "https://placehold.co/600x360?text=Trai+Xuan",
      //   danhMuc: "Trại xuân",
      //   isFeatured: true
      // },
      // {
      //   maHoatDong: "HD011",
      //   tieuDe: "Cuộc thi lập trình HUTECH Hackathon",
      //   moTa: "Giải quyết các bài toán thực tế trong 24 giờ cùng đồng đội.",
      //   diemCong: 22,
      //   batDauLuc: new Date("2025-03-22T09:00:00+07:00"),
      //   ketThucLuc: new Date("2025-03-23T09:00:00+07:00"),
      //   diaDiem: "Innovation Lab, cơ sở Ung Văn Khiêm",
      //   sucChuaToiDa: 80,
      //   hinhAnh: "https://placehold.co/600x360?text=Hackathon",
      //   danhMuc: "Cuộc thi",
      //   isFeatured: true
      // },
      // {
      //   maHoatDong: "HD012",
      //   tieuDe: "Tình nguyện viên tiếp sức mùa thi",
      //   moTa: "Hỗ trợ thí sinh và phụ huynh trong kỳ thi tốt nghiệp THPT.",
      //   diemCong: 19,
      //   batDauLuc: new Date("2025-06-30T05:30:00+07:00"),
      //   ketThucLuc: new Date("2025-07-02T18:00:00+07:00"),
      //   diaDiem: "Các điểm thi trên địa bàn TP.HCM",
      //   sucChuaToiDa: 300,
      //   hinhAnh: "https://placehold.co/600x360?text=Tiep+Suc+Mua+Thi",
      //   danhMuc: "Tình nguyện",
      //   isFeatured: false
      // },
      // {
      //   maHoatDong: "HD013",
      //   tieuDe: "Ngày hội văn hóa các CLB học thuật",
      //   moTa: "Gian hàng giới thiệu hoạt động và kết nạp thành viên mới.",
      //   diemCong: 7,
      //   batDauLuc: new Date("2025-04-18T08:00:00+07:00"),
      //   ketThucLuc: new Date("2025-04-18T15:00:00+07:00"),
      //   diaDiem: "Sảnh B, cơ sở Điện Biên Phủ",
      //   sucChuaToiDa: 400,
      //   hinhAnh: "https://placehold.co/600x360?text=CLB+Hoc+Thuat",
      //   danhMuc: "Văn hóa",
      //   isFeatured: false
      // }
    ];

    for (const activity of activities) {
      await prisma.hoatDong.upsert({
        where: { maHoatDong: activity.maHoatDong },
        update: activity,
        create: activity
      });
    }

    const user = await prisma.nguoiDung.findUnique({ where: { email } });
    const hoatDong = await prisma.hoatDong.findUnique({ where: { maHoatDong: "HD002" } });
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
