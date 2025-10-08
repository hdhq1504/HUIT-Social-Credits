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
  activities: [
    {
      id: 'activity-001',
      title: 'Thăm và tặng quà cho các cụ già tại viện dưỡng lão',
      points: 15,
      dateTime: '15/12/2024 - 8:00 AM',
      location: 'Viện dưỡng lão Thị Nghè',
      participants: ['https://placehold.co/32x32', 'https://placehold.co/32x32', 'https://placehold.co/32x32'],
      capacity: '12/50',
      coverImage: 'activityCover.png',
      isFeatured: true,
      onRegister: () => console.log('Đăng ký ngay!'),
      onDetails: () => console.log('Xem chi tiết!'),
    },
    {
      id: 'activity-002',
      title: 'Thăm và tặng quà cho các cụ già tại viện dưỡng lão',
      points: 15,
      dateTime: '15/12/2024 - 8:00 AM',
      location: 'Viện dưỡng lão Thị Nghè',
      participants: ['https://placehold.co/32x32', 'https://placehold.co/32x32', 'https://placehold.co/32x32'],
      capacity: '12/50',
      coverImage: '/images/activity-cover.png',
      isFeatured: true,
      onRegister: () => console.log('Đăng ký ngay!'),
      onDetails: () => console.log('Xem chi tiết!'),
    },
    {
      id: 'activity-003',
      title: 'Thăm và tặng quà cho các cụ già tại viện dưỡng lão',
      points: 15,
      dateTime: '15/12/2024 - 8:00 AM',
      location: 'Viện dưỡng lão Thị Nghè',
      participants: ['https://placehold.co/32x32', 'https://placehold.co/32x32', 'https://placehold.co/32x32'],
      capacity: '12/50',
      coverImage: '/images/activity-cover.png',
      isFeatured: true,
      onRegister: () => console.log('Đăng ký ngay!'),
      onDetails: () => console.log('Xem chi tiết!'),
    },
    {
      id: 'activity-004',
      title: 'Thăm và tặng quà cho các cụ già tại viện dưỡng lão',
      points: 15,
      dateTime: '15/12/2024 - 8:00 AM',
      location: 'Viện dưỡng lão Thị Nghè',
      participants: ['https://placehold.co/32x32', 'https://placehold.co/32x32', 'https://placehold.co/32x32'],
      capacity: '12/50',
      coverImage: '/images/activity-cover.png',
      isFeatured: true,
      onRegister: () => console.log('Đăng ký ngay!'),
      onDetails: () => console.log('Xem chi tiết!'),
    },
    {
      id: 'activity-005',
      title: 'Thăm và tặng quà cho các cụ già tại viện dưỡng lão',
      points: 15,
      dateTime: '15/12/2024 - 8:00 AM',
      location: 'Viện dưỡng lão Thị Nghè',
      participants: ['https://placehold.co/32x32', 'https://placehold.co/32x32', 'https://placehold.co/32x32'],
      capacity: '12/50',
      coverImage: '/images/activity-cover.png',
      isFeatured: true,
      onRegister: () => console.log('Đăng ký ngay!'),
      onDetails: () => console.log('Xem chi tiết!'),
    },
    {
      id: 'activity-006',
      title: 'Thăm và tặng quà cho các cụ già tại viện dưỡng lão',
      points: 15,
      dateTime: '15/12/2024 - 8:00 AM',
      location: 'Viện dưỡng lão Thị Nghè',
      participants: ['https://placehold.co/32x32', 'https://placehold.co/32x32', 'https://placehold.co/32x32'],
      capacity: '12/50',
      coverImage: '/images/activity-cover.png',
      isFeatured: true,
      onRegister: () => console.log('Đăng ký ngay!'),
      onDetails: () => console.log('Xem chi tiết!'),
    },
    {
      id: 'activity-007',
      title: 'Thăm và tặng quà cho các cụ già tại viện dưỡng lão',
      points: 15,
      dateTime: '15/12/2024 - 8:00 AM',
      location: 'Viện dưỡng lão Thị Nghè',
      participants: ['https://placehold.co/32x32', 'https://placehold.co/32x32', 'https://placehold.co/32x32'],
      capacity: '12/50',
      coverImage: '/images/activity-cover.png',
      isFeatured: true,
      onRegister: () => console.log('Đăng ký ngay!'),
      onDetails: () => console.log('Xem chi tiết!'),
    },
    {
      id: 'activity-008',
      title: 'Thăm và tặng quà cho các cụ già tại viện dưỡng lão',
      points: 15,
      dateTime: '15/12/2024 - 8:00 AM',
      location: 'Viện dưỡng lão Thị Nghè',
      participants: ['https://placehold.co/32x32', 'https://placehold.co/32x32', 'https://placehold.co/32x32'],
      capacity: '12/50',
      coverImage: '/images/activity-cover.png',
      isFeatured: true,
      onRegister: () => console.log('Đăng ký ngay!'),
      onDetails: () => console.log('Xem chi tiết!'),
    },
  ],
  scoreRecords: [
    {
      id: 'sc-001',
      activityName: 'Hiến máu nhân đạo tháng 10',
      location: 'Hội trường A1, Đại học ABC',
      group: 'Nhóm 1',
      points: 10,
      date: '2024-10-15',
      status: 'confirmed',
    },
    {
      id: 'sc-002',
      activityName: 'Dạy học cho trẻ em mồ côi',
      location: 'Trung tâm Bảo trợ trẻ em',
      group: 'Nhóm 2,3',
      points: 12,
      date: '2024-10-08',
      status: 'confirmed',
    },
    {
      id: 'sc-003',
      activityName: 'Trồng cây xanh công viên',
      location: 'Công viên 29/3, TP.HCM',
      group: 'Nhóm 2,3',
      points: 6,
      date: '2024-10-05',
      status: 'confirmed',
    },
    {
      id: 'sc-004',
      activityName: 'Dọn dẹp bãi biển Cửa Đại',
      location: 'Bãi biển Cửa Đại, Hội An',
      group: 'Nhóm 2,3',
      points: 8,
      date: '2024-09-25',
      status: 'pending',
    },
    {
      id: 'sc-005',
      activityName: 'Tổ chức sự kiện tân sinh viên',
      location: 'Hội trường chính, Đại học ABC',
      group: 'Nhóm 2,3',
      points: 5,
      date: '2024-09-20',
      status: 'confirmed',
    },
    {
      id: 'sc-006',
      activityName: 'Chương trình hiến máu tình nguyện',
      location: 'Bệnh viện Chợ Rẫy',
      group: 'Nhóm 1',
      points: 15,
      date: '2024-08-15',
      status: 'confirmed',
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

  async getActivities() {
    const data = ensureData();
    return clone(data.activities);
  },

  async getScoreRecords() {
    const data = ensureData();
    return clone(data.scoreRecords);
  },
};

export const __mockData = {
  loadData,
  persist,
  ensureData,
};
