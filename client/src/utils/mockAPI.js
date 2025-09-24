const STORAGE_KEY = 'huit-social-credits-mock-data';

const defaultData = {
  users: [
    {
      id: 'user-001',
      email: 'sinhvien@huit.edu.vn',
      password: '123456',
      TenNguoiDung: 'Nguyễn Văn A',
      VaiTro: 'Sinh viên',
      MaNguoiDung: 'SV001',
      GioiTinh: 'Nam',
      NgaySinh: '2002-05-01',
      Sdt: '0900123456',
      AnhDaiDien: '/images/student-photo.png',
    },
    {
      id: 'user-002',
      email: 'giangvien@huit.edu.vn',
      password: '123456',
      TenNguoiDung: 'Trần Thị B',
      VaiTro: 'Giảng viên',
      MaNguoiDung: 'GV001',
      GioiTinh: 'Nữ',
      NgaySinh: '1990-09-12',
      Sdt: '0912345678',
      AnhDaiDien: '/images/student-photo.png',
    },
  ],
  faculties: [
    {
      id: 'faculty-ict',
      MaKhoa: 'CNTT',
      TenKhoa: 'Công nghệ Thông tin',
      GioiThieu: 'Cung cấp kiến thức chuyên sâu về công nghệ thông tin và khoa học dữ liệu.',
      AnhKhoa: '/images/faculty-it.jpg',
    },
    {
      id: 'faculty-kt',
      MaKhoa: 'KT',
      TenKhoa: 'Kinh tế',
      GioiThieu: 'Đào tạo các chuyên ngành về kinh tế và quản trị.',
      AnhKhoa: '/images/faculty-economics.jpg',
    },
    {
      id: 'faculty-qt',
      MaKhoa: 'QT',
      TenKhoa: 'Quản trị kinh doanh',
      GioiThieu: 'Trang bị kiến thức quản lý và vận hành doanh nghiệp.',
      AnhKhoa: '/images/faculty-business.jpg',
    },
  ],
  subjects: [
    {
      id: 'subject-ct101',
      MaMH: 'CT101',
      TenMH: 'Nhập môn lập trình',
      MaKhoa: 'CNTT',
      AnhMon: '/images/no-image.jpg',
      MoTa: 'Giới thiệu các khái niệm cơ bản về lập trình và cấu trúc dữ liệu.',
    },
    {
      id: 'subject-ct201',
      MaMH: 'CT201',
      TenMH: 'Cơ sở dữ liệu',
      MaKhoa: 'CNTT',
      AnhMon: '/images/no-image.jpg',
      MoTa: 'Nền tảng về thiết kế và quản trị cơ sở dữ liệu quan hệ.',
    },
    {
      id: 'subject-kt101',
      MaMH: 'KT101',
      TenMH: 'Kinh tế vi mô',
      MaKhoa: 'KT',
      AnhMon: '/images/no-image.jpg',
      MoTa: 'Các khái niệm cơ bản về cung cầu và hành vi người tiêu dùng.',
    },
    {
      id: 'subject-qt301',
      MaMH: 'QT301',
      TenMH: 'Quản trị chiến lược',
      MaKhoa: 'QT',
      AnhMon: '/images/no-image.jpg',
      MoTa: 'Xây dựng và triển khai chiến lược kinh doanh cho doanh nghiệp.',
    },
  ],
  documents: [
    {
      id: 'doc-ct101-1',
      maMH: 'CT101',
      maKhoa: 'CNTT',
      tenTaiLieu: 'Giáo trình Nhập môn lập trình',
      moTa: 'Tài liệu bao gồm các bài giảng và ví dụ minh họa bằng ngôn ngữ C.',
      loai: 'PDF',
      kichThuoc: '2.4 MB',
      luotTaiVe: 125,
      luotThich: 54,
      ngayDang: '2024-02-10T08:30:00.000Z',
      previewImages: ['/images/no-image.jpg'],
      uRL: '#',
      nguoiDang: 'SV001',
      trangThai: 'Đã duyệt',
    },
    {
      id: 'doc-ct201-1',
      maMH: 'CT201',
      maKhoa: 'CNTT',
      tenTaiLieu: 'Bài tập Cơ sở dữ liệu',
      moTa: 'Tổng hợp các bài tập thực hành về thiết kế cơ sở dữ liệu.',
      loai: 'DOCX',
      kichThuoc: '1.2 MB',
      luotTaiVe: 98,
      luotThich: 41,
      ngayDang: '2024-03-05T10:00:00.000Z',
      previewImages: ['/images/no-image.jpg'],
      uRL: '#',
      nguoiDang: 'SV001',
      trangThai: 'Đã duyệt',
    },
    {
      id: 'doc-kt101-1',
      maMH: 'KT101',
      maKhoa: 'KT',
      tenTaiLieu: 'Slide Kinh tế vi mô',
      moTa: 'Slide bài giảng tuần 1-5 môn Kinh tế vi mô.',
      loai: 'PPTX',
      kichThuoc: '3.1 MB',
      luotTaiVe: 150,
      luotThich: 67,
      ngayDang: '2024-01-20T09:15:00.000Z',
      previewImages: ['/images/no-image.jpg'],
      uRL: '#',
      nguoiDang: 'GV001',
      trangThai: 'Đã duyệt',
    },
  ],
  tests: [
    {
      id: 'test-1',
      MaNguoiDung: 'SV001',
      MaMon: 'CT101',
      MaDe: 'DE0001',
      TenDe: 'CT101 - Đề số 1',
      SoLuongCauHoi: 30,
    },
    {
      id: 'test-2',
      MaNguoiDung: 'SV001',
      MaMon: 'CT201',
      MaDe: 'DE0005',
      TenDe: 'CT201 - Ôn tập chương 1',
      SoLuongCauHoi: 25,
    },
  ],
  news: [
    {
      id: 'news-1',
      title: 'HUIT Social Credits ra mắt phiên bản mới',
      description: 'Nền tảng hỗ trợ theo dõi điểm công tác xã hội với nhiều tính năng cải tiến.',
      content:
        'Phiên bản mới của HUIT Social Credits mang đến trải nghiệm mượt mà hơn cùng nhiều tính năng như quản lý tài liệu, tạo bài kiểm tra nhanh và theo dõi tiến độ học tập.',
      imageUrl: '/images/no-image.jpg',
      date: '2024-02-15T00:00:00.000Z',
      views: 1245,
    },
    {
      id: 'news-2',
      title: 'Thông báo lịch hoạt động tháng 3',
      description: 'Cập nhật lịch hoạt động công tác xã hội cho sinh viên toàn trường.',
      content:
        'Trong tháng 3, sinh viên sẽ tham gia nhiều hoạt động tình nguyện, hội thảo nghề nghiệp và khóa học kỹ năng mềm. Hãy đăng ký sớm để giữ chỗ!',
      imageUrl: '/images/no-image.jpg',
      date: '2024-03-01T00:00:00.000Z',
      views: 890,
    },
  ],
};

let dataCache = null;
const otpStore = new Map();

const clone = (value) => JSON.parse(JSON.stringify(value));

const loadData = () => {
  if (dataCache) {
    return dataCache;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      dataCache = { ...defaultData, ...parsed };
      return dataCache;
    }
  } catch (error) {
    console.warn('Không thể đọc dữ liệu mock từ localStorage:', error);
  }
  dataCache = clone(defaultData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataCache));
  return dataCache;
};

const persist = () => {
  if (dataCache) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataCache));
  }
};

const ensureData = () => {
  if (!dataCache) {
    loadData();
  }
  return dataCache;
};

const normalizeEmail = (email) => email.trim().toLowerCase();

export const mockApi = {
  async loginWithEmail(email, password) {
    const data = ensureData();
    const user = data.users.find((item) => normalizeEmail(item.email) === normalizeEmail(email));
    if (!user || user.password !== password) {
      throw new Error('Thông tin đăng nhập không chính xác.');
    }
    return {
      email: user.email,
      uid: user.id,
      AnhDaiDien: user.AnhDaiDien || '',
      GioiTinh: user.GioiTinh || '',
      MaNguoiDung: user.MaNguoiDung || '',
      NgaySinh: user.NgaySinh || '',
      Sdt: user.Sdt || '',
      TenNguoiDung: user.TenNguoiDung || '',
      VaiTro: user.VaiTro || '',
      token: `mock-token-${user.id}`,
    };
  },

  async requestPasswordOtp(email) {
    const data = ensureData();
    const user = data.users.find((item) => normalizeEmail(item.email) === normalizeEmail(email));
    if (!user) {
      throw new Error('Tài khoản không tồn tại trong hệ thống.');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(normalizeEmail(email), { otp, expiresAt });
    return { otp, expiresAt };
  },

  async verifyPasswordOtp(email, otp) {
    const record = otpStore.get(normalizeEmail(email));
    if (!record) {
      throw new Error('Mã OTP không tồn tại hoặc đã hết hạn.');
    }
    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizeEmail(email));
      throw new Error('Mã OTP đã hết hạn.');
    }
    if (record.otp !== otp) {
      throw new Error('Mã OTP không chính xác.');
    }
    return true;
  },

  async resetPassword(email, newPassword) {
    const data = ensureData();
    const normalizedEmail = normalizeEmail(email);
    const user = data.users.find((item) => normalizeEmail(item.email) === normalizedEmail);
    if (!user) {
      throw new Error('Không tìm thấy người dùng để đặt lại mật khẩu.');
    }
    user.password = newPassword;
    otpStore.delete(normalizedEmail);
    persist();
    return true;
  },

  async verifyCurrentPassword(userId, password) {
    const data = ensureData();
    const user = data.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error('Không tìm thấy người dùng.');
    }
    return user.password === password;
  },

  async updateUserProfile(userId, updates) {
    const data = ensureData();
    const user = data.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error('Không tìm thấy người dùng để cập nhật.');
    }
    Object.assign(user, updates);
    persist();
    return {
      email: user.email,
      uid: user.id,
      AnhDaiDien: user.AnhDaiDien || '',
      GioiTinh: user.GioiTinh || '',
      MaNguoiDung: user.MaNguoiDung || '',
      NgaySinh: user.NgaySinh || '',
      Sdt: user.Sdt || '',
      TenNguoiDung: user.TenNguoiDung || '',
      VaiTro: user.VaiTro || '',
    };
  },

  async getFaculties() {
    const data = ensureData();
    return clone(data.faculties);
  },

  async getSubjects() {
    const data = ensureData();
    return clone(data.subjects);
  },

  async getDocuments() {
    const data = ensureData();
    return clone(data.documents);
  },

  async getDocumentById(id) {
    const data = ensureData();
    const document = data.documents.find((item) => item.id === id);
    if (!document) {
      throw new Error('Không tìm thấy tài liệu.');
    }
    return clone(document);
  },

  async addDocument(document) {
    const data = ensureData();
    const newDocument = {
      id: `doc-${Date.now()}`,
      ...document,
      ngayDang: new Date().toISOString(),
      luotTaiVe: 0,
      luotThich: 0,
      trangThai: 'Chờ duyệt',
    };
    data.documents.push(newDocument);
    persist();
    return clone(newDocument);
  },

  async getNewsById(id) {
    const data = ensureData();
    const news = data.news.find((item) => item.id === id);
    if (!news) {
      throw new Error('Không tìm thấy bài viết.');
    }
    return clone(news);
  },

  async getUserTests(userCode) {
    const data = ensureData();
    if (!userCode) {
      return [];
    }
    const tests = data.tests.filter((item) => item.MaNguoiDung === userCode);
    return clone(tests);
  },

  async addUserTest(test) {
    const data = ensureData();
    const newTest = { id: `test-${Date.now()}`, ...test };
    data.tests.push(newTest);
    persist();
    return clone(newTest);
  },
};

export const __mockData = {
  loadData,
  persist,
  ensureData,
};
