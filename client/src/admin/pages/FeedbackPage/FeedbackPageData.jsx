const proofListData = [
  {
    id: '1',
    stt: '01',
    avatar: 'https://placehold.co/40x40/E8EDFF/00008B?text=TM',
    name: 'Nguyễn Thị Mai',
    email: 'nguyenmaib@huit.edu.vn',
    mssv: '2001223660',
    khoa: 'Công nghệ thông tin',
    lop: '13DHTH02',
    hoatDong: 'Hiến máu nhân đạo tháng 10',
    ngayHoatDong: '15/12/2024',
    ngayGui: '09:00 15/10/2024',
    trangThai: 'Chờ duyệt',
  },
  {
    id: '2',
    stt: '02',
    avatar: 'https://placehold.co/40x40/E8EDFF/00008B?text=TM',
    name: 'Nguyễn Thị Mai',
    email: 'nguyenmaib@huit.edu.vn',
    mssv: '2001223660',
    khoa: 'Công nghệ thông tin',
    lop: '13DHTH02',
    hoatDong: 'Hiến máu nhân đạo tháng 10',
    ngayHoatDong: '15/12/2024',
    ngayGui: '09:00 15/10/2024',
    trangThai: 'Từ chối',
  },
  {
    id: '3',
    stt: '03',
    avatar: 'https://placehold.co/40x40/E8EDFF/00008B?text=TM',
    name: 'Nguyễn Thị Mai',
    email: 'nguyenmaib@huit.edu.vn',
    mssv: '2001223660',
    khoa: 'Công nghệ thông tin',
    lop: '13DHTH02',
    hoatDong: 'Hiến máu nhân đạo tháng 10',
    ngayHoatDong: '15/12/2024',
    ngayGui: '09:00 15/10/2024',
    trangThai: 'Đã duyệt',
  },
  {
    id: '4',
    stt: '04',
    avatar: 'https://placehold.co/40x40/E8EDFF/00008B?text=TM',
    name: 'Nguyễn Thị Mai',
    email: 'nguyenmaib@huit.edu.vn',
    mssv: '2001223660',
    khoa: 'Công nghệ thông tin',
    lop: '13DHTH02',
    hoatDong: 'Hiến máu nhân đạo tháng 10',
    ngayHoatDong: '15/12/2024',
    ngayGui: '09:00 15/10/2024',
    trangThai: 'Đã duyệt',
  },
  {
    id: '5',
    stt: '05',
    avatar: 'https://placehold.co/40x40/E8EDFF/00008B?text=TM',
    name: 'Nguyễn Thị Mai',
    email: 'nguyenmaib@huit.edu.vn',
    mssv: '2001223660',
    khoa: 'Công nghệ thông tin',
    lop: '13DHTH02',
    hoatDong: 'Hiến máu nhân đạo tháng 10',
    ngayHoatDong: '15/12/2024',
    ngayGui: '09:00 15/10/2024',
    trangThai: 'Đã duyệt',
  },
];

// Dữ liệu giả lập cho trang chi tiết
const feedbackDetailData = {
  id: '1',
  student: {
    name: 'Hà Huy Phong',
    avatar: 'https://placehold.co/150x150/E8EDFF/00008B?text=HP',
    mssv: '2001223660',
    khoa: 'Công nghệ thông tin',
    lop: '13DHTH02',
    phone: '0123 456 789',
    email: '2001223660@huit.edu.vn',
  },
  activity: {
    title: 'Hoạt động từ thiện cộng đồng - Trao tặng học bổng',
    type: 'Tình nguyện xã hội',
    points: 60,
    organizer: 'Nguyễn Văn An',
    location: 'Viện dưỡng lão Thành phố HCM',
    time: '08:00 - 17:00, 15/12/2024',
    participants: '45/50 sinh viên',
  },
  feedback: {
    content:
      'Em không được cộng điểm, đây là minh chứng em có tham giaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    status: 'Chờ xử lý',
    sentAt: '25/10/2024, 18:30',
    attachment: {
      name: 'Ảnh hoạt động.jpg',
      size: '1.8 MB',
      date: 'Tải lên 25/10/2024',
      url: '#',
    },
  },
};

const statsData = [
  {
    label: 'Tổng minh chứng',
    value: '2,847',
    color: '#00008B', // var(--primary-color)
    iconName: 'faFileLines',
    bg: '#e8edff',
  },
  {
    label: 'Chờ duyệt',
    value: '456',
    color: '#DB7B00', // var(--warning-color)
    iconName: 'faHourglassHalf',
    bg: '#fff3e0',
  },
  {
    label: 'Đã duyệt',
    value: '2,234',
    color: '#198754', // var(--success-color)
    iconName: 'faCircleCheck',
    bg: '#e6f8ee',
  },
  {
    label: 'Từ chối',
    value: '157',
    color: '#DC3545', // var(--danger-color)
    iconName: 'faCircleXmark',
    bg: '#fdeaea',
  },
];

export { proofListData, feedbackDetailData, statsData };
