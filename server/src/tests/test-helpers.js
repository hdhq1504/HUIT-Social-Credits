import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import prisma from '../prisma.js';

/**
 * Generate a mock JWT token for testing
 */
export function generateTestToken(userId, role = 'USER') {
  const payload = {
    sub: userId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };
  return jwt.sign(payload, env.JWT_SECRET);
}

/**
 * Create a test user
 */
export async function createTestUser(overrides = {}) {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    matKhau: 'hashedpassword123',
    hoTen: 'Test User',
    maSinhVien: `SV${Date.now()}`,
    vaiTro: 'USER',
    ...overrides,
  };

  return prisma.nguoiDung.create({
    data: defaultUser,
  });
}

/**
 * Create a test activity
 */
export async function createTestActivity(creatorId, overrides = {}) {
  const now = new Date();
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  const defaultActivity = {
    tieuDe: `Test Activity ${Date.now()}`,
    moTa: 'Test activity description',
    diaDiem: 'Test Location',
    batDauLuc: startTime,
    ketThucLuc: endTime,
    diemCong: 10,
    nhomDiem: 'HOAT_DONG_KHAC',
    phuongThucDiemDanh: 'QR',
    isPublished: true,
    taoBoiId: creatorId,
    ...overrides,
  };

  return prisma.hoatDong.create({
    data: defaultActivity,
  });
}

/**
 * Create a test registration
 */
export async function createTestRegistration(userId, activityId, overrides = {}) {
  const defaultRegistration = {
    nguoiDungId: userId,
    hoatDongId: activityId,
    trangThai: 'DANG_KY',
    ...overrides,
  };

  return prisma.dangKyHoatDong.create({
    data: defaultRegistration,
  });
}

/**
 * Create a test face profile
 */
export async function createTestFaceProfile(userId, descriptors = []) {
  const defaultDescriptors = descriptors.length
    ? descriptors
    : [Array(128).fill(0).map(() => Math.random())];

  return prisma.faceProfile.create({
    data: {
      nguoiDungId: userId,
      descriptors: defaultDescriptors,
    },
  });
}

/**
 * Clean up test data
 */
export async function cleanupTestData(userIds = [], activityIds = []) {
  // Delete in correct order to respect foreign key constraints
  if (activityIds.length) {
    await prisma.diemDanhNguoiDung.deleteMany({
      where: { hoatDongId: { in: activityIds } },
    });
    await prisma.dangKyHoatDong.deleteMany({
      where: { hoatDongId: { in: activityIds } },
    });
    await prisma.phanHoi.deleteMany({
      where: { hoatDongId: { in: activityIds } },
    });
    await prisma.hoatDong.deleteMany({
      where: { id: { in: activityIds } },
    });
  }

  if (userIds.length) {
    await prisma.faceProfile.deleteMany({
      where: { nguoiDungId: { in: userIds } },
    });
    await prisma.thongBao.deleteMany({
      where: { nguoiDungId: { in: userIds } },
    });
    await prisma.nguoiDung.deleteMany({
      where: { id: { in: userIds } },
    });
  }
}

/**
 * Wait for a specified time (for testing async operations)
 */
export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock base64 image data URL
 */
export function createMockImageDataUrl() {
  // 1x1 transparent PNG
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

/**
 * Create a mock face descriptor (128-dimensional array)
 */
export function createMockFaceDescriptor() {
  return Array(128).fill(0).map(() => Math.random() * 2 - 1);
}
