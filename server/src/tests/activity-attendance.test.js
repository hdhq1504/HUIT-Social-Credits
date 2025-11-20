import request from 'supertest';
import express from 'express';
import prisma from '../prisma.js';
import activityRoutes from '../routes/activity.routes.js';
import {
  generateTestToken,
  createTestUser,
  createTestActivity,
  createTestRegistration,
  createTestFaceProfile,
  createMockImageDataUrl,
  createMockFaceDescriptor,
  cleanupTestData,
} from './test-helpers.js';

// Create Express app for testing
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api/activities', activityRoutes);

describe('Activity Attendance', () => {
  let testUser;
  let testAdmin;
  let testActivity;
  let userToken;
  let adminToken;

  beforeAll(async () => {
    // Create test users
    testUser = await createTestUser({
      email: 'attendance-test-user@example.com',
      maSinhVien: 'ATT001',
    });
    testAdmin = await createTestUser({
      email: 'attendance-test-admin@example.com',
      maSinhVien: 'ADMIN002',
      vaiTro: 'ADMIN',
    });

    // Generate tokens
    userToken = generateTestToken(testUser.id, 'USER');
    adminToken = generateTestToken(testAdmin.id, 'ADMIN');
  });

  afterAll(async () => {
    // Cleanup
    const activityIds = testActivity ? [testActivity.id] : [];
    const userIds = [testUser.id, testAdmin.id];
    await cleanupTestData(userIds, activityIds);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create activity that is currently ongoing
    const now = new Date();
    const startTime = new Date(now.getTime() - 30 * 60 * 1000); // Started 30 min ago
    const endTime = new Date(now.getTime() + 90 * 60 * 1000); // Ends in 90 min

    testActivity = await createTestActivity(testAdmin.id, {
      tieuDe: 'Attendance Test Activity',
      batDauLuc: startTime,
      ketThucLuc: endTime,
      phuongThucDiemDanh: 'QR',
    });

    // Register user for activity
    await createTestRegistration(testUser.id, testActivity.id);
  });

  afterEach(async () => {
    // Clean up activity after each test
    if (testActivity) {
      await prisma.diemDanhNguoiDung.deleteMany({
        where: { hoatDongId: testActivity.id },
      });
      await prisma.dangKyHoatDong.deleteMany({
        where: { hoatDongId: testActivity.id },
      });
      await prisma.hoatDong.delete({
        where: { id: testActivity.id },
      });
      testActivity = null;
    }
  });

  describe('POST /api/activities/:id/attendance - Check-in', () => {
    test('should successfully check-in with QR code', async () => {
      const response = await request(app)
        .post(`/api/activities/${testActivity.id}/attendance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'present',
          phase: 'checkin',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Điểm danh đầu giờ thành công');

      // Verify database
      const registration = await prisma.dangKyHoatDong.findUnique({
        where: {
          nguoiDungId_hoatDongId: {
            nguoiDungId: testUser.id,
            hoatDongId: testActivity.id,
          },
        },
        include: { lichSuDiemDanh: true },
      });

      expect(registration.trangThai).toBe('DANG_THAM_GIA');
      expect(registration.lichSuDiemDanh.length).toBe(1);
      expect(registration.lichSuDiemDanh[0].loai).toBe('CHECKIN');
      expect(registration.lichSuDiemDanh[0].trangThai).toBe('DANG_THAM_GIA');
    });

    test('should fail to check-in before activity starts', async () => {
      // Create future activity
      const now = new Date();
      const futureActivity = await createTestActivity(testAdmin.id, {
        tieuDe: 'Future Activity',
        batDauLuc: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        ketThucLuc: new Date(now.getTime() + 26 * 60 * 60 * 1000),
      });

      await createTestRegistration(testUser.id, futureActivity.id);

      const response = await request(app)
        .post(`/api/activities/${futureActivity.id}/attendance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'present', phase: 'checkin' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('chưa diễn ra');

      // Cleanup
      await prisma.dangKyHoatDong.deleteMany({
        where: { hoatDongId: futureActivity.id },
      });
      await prisma.hoatDong.delete({ where: { id: futureActivity.id } });
    });

    test('should fail to check-in after activity ends', async () => {
      // Create past activity
      const now = new Date();
      const pastActivity = await createTestActivity(testAdmin.id, {
        tieuDe: 'Past Activity',
        batDauLuc: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        ketThucLuc: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      });

      await createTestRegistration(testUser.id, pastActivity.id);

      const response = await request(app)
        .post(`/api/activities/${pastActivity.id}/attendance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'present', phase: 'checkin' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('đã kết thúc');

      // Cleanup
      await prisma.dangKyHoatDong.deleteMany({
        where: { hoatDongId: pastActivity.id },
      });
      await prisma.hoatDong.delete({ where: { id: pastActivity.id } });
    });

    test('should fail to check-in without registration', async () => {
      const otherUser = await createTestUser({
        email: 'other-attendance@example.com',
        maSinhVien: 'OTHER002',
      });
      const otherToken = generateTestToken(otherUser.id, 'USER');

      const response = await request(app)
        .post(`/api/activities/${testActivity.id}/attendance`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ status: 'present', phase: 'checkin' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('chưa đăng ký');

      // Cleanup
      await prisma.nguoiDung.delete({ where: { id: otherUser.id } });
    });

    test('should fail to check-in twice', async () => {
      // First check-in
      await request(app)
        .post(`/api/activities/${testActivity.id}/attendance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'present', phase: 'checkin' })
        .expect(200);

      // Second check-in attempt
      const response = await request(app)
        .post(`/api/activities/${testActivity.id}/attendance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'present', phase: 'checkin' })
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('đã điểm danh đầu giờ');
    });
  });

  describe('POST /api/activities/:id/attendance - Check-out', () => {
    beforeEach(async () => {
      // Check-in before each checkout test
      await request(app)
        .post(`/api/activities/${testActivity.id}/attendance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'present', phase: 'checkin' })
        .expect(200);
    });

    test('should successfully check-out with QR code', async () => {
      const response = await request(app)
        .post(`/api/activities/${testActivity.id}/attendance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'present',
          phase: 'checkout',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Điểm danh cuối giờ thành công');

      // Verify database
      const registration = await prisma.dangKyHoatDong.findUnique({
        where: {
          nguoiDungId_hoatDongId: {
            nguoiDungId: testUser.id,
            hoatDongId: testActivity.id,
          },
        },
        include: { lichSuDiemDanh: true },
      });

      expect(registration.trangThai).toBe('DA_THAM_GIA');
      expect(registration.lichSuDiemDanh.length).toBe(2);
      expect(registration.lichSuDiemDanh[1].loai).toBe('CHECKOUT');
      expect(registration.lichSuDiemDanh[1].trangThai).toBe('DA_THAM_GIA');
    });

    test('should fail to check-out without check-in', async () => {
      // Create new activity and registration without check-in
      const now = new Date();
      const newActivity = await createTestActivity(testAdmin.id, {
        tieuDe: 'No Checkin Activity',
        batDauLuc: new Date(now.getTime() - 30 * 60 * 1000),
        ketThucLuc: new Date(now.getTime() + 90 * 60 * 1000),
      });

      await createTestRegistration(testUser.id, newActivity.id);

      const response = await request(app)
        .post(`/api/activities/${newActivity.id}/attendance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'present', phase: 'checkout' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('cần điểm danh đầu giờ trước');

      // Cleanup
      await prisma.dangKyHoatDong.deleteMany({
        where: { hoatDongId: newActivity.id },
      });
      await prisma.hoatDong.delete({ where: { id: newActivity.id } });
    });

    test('should fail to check-out twice', async () => {
      // First checkout
      await request(app)
        .post(`/api/activities/${testActivity.id}/attendance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'present', phase: 'checkout' })
        .expect(200);

      // Second checkout attempt
      const response = await request(app)
        .post(`/api/activities/${testActivity.id}/attendance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'present', phase: 'checkout' })
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('đã điểm danh cuối giờ');
    });
  });

  describe('POST /api/activities/:id/attendance - Photo Attendance', () => {
    let photoActivity;
    let faceProfile;

    beforeEach(async () => {
      // Create activity with photo attendance
      const now = new Date();
      photoActivity = await createTestActivity(testAdmin.id, {
        tieuDe: 'Photo Attendance Activity',
        batDauLuc: new Date(now.getTime() - 30 * 60 * 1000),
        ketThucLuc: new Date(now.getTime() + 90 * 60 * 1000),
        phuongThucDiemDanh: 'PHOTO',
      });

      await createTestRegistration(testUser.id, photoActivity.id);

      // Create face profile for user
      faceProfile = await createTestFaceProfile(testUser.id);
    });

    afterEach(async () => {
      if (photoActivity) {
        await prisma.diemDanhNguoiDung.deleteMany({
          where: { hoatDongId: photoActivity.id },
        });
        await prisma.dangKyHoatDong.deleteMany({
          where: { hoatDongId: photoActivity.id },
        });
        await prisma.hoatDong.delete({ where: { id: photoActivity.id } });
      }
      if (faceProfile) {
        await prisma.faceProfile.delete({ where: { id: faceProfile.id } });
      }
    });

    test('should fail check-in without face profile', async () => {
      // Delete face profile
      await prisma.faceProfile.delete({ where: { id: faceProfile.id } });
      faceProfile = null;

      const response = await request(app)
        .post(`/api/activities/${photoActivity.id}/attendance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'present',
          phase: 'checkin',
          evidence: { data: createMockImageDataUrl() },
          faceDescriptor: createMockFaceDescriptor(),
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('chưa đăng ký khuôn mặt');
    });

    test('should check-in with photo and face descriptor', async () => {
      const response = await request(app)
        .post(`/api/activities/${photoActivity.id}/attendance`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'present',
          phase: 'checkin',
          evidence: {
            data: createMockImageDataUrl(),
            mimeType: 'image/png',
            fileName: 'checkin.png',
          },
          faceDescriptor: createMockFaceDescriptor(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify attendance record created
      const attendance = await prisma.diemDanhNguoiDung.findFirst({
        where: {
          nguoiDungId: testUser.id,
          hoatDongId: photoActivity.id,
          loai: 'CHECKIN',
        },
      });

      expect(attendance).toBeTruthy();
      expect(attendance.faceMatch).toBeTruthy();
      expect(attendance.faceScore).toBeTruthy();
    });
  });

  describe('Absent Status - Automatic Update', () => {
    test('should mark user as absent if no attendance after activity ends', async () => {
      // Create past activity
      const now = new Date();
      const pastActivity = await createTestActivity(testAdmin.id, {
        tieuDe: 'Past Activity for Absent Test',
        batDauLuc: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        ketThucLuc: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      });

      await createTestRegistration(testUser.id, pastActivity.id, {
        trangThai: 'DANG_KY',
      });

      // Call listMyActivities which triggers absent status update
      await request(app)
        .get('/api/activities/mine')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify status updated to VANG_MAT
      const registration = await prisma.dangKyHoatDong.findUnique({
        where: {
          nguoiDungId_hoatDongId: {
            nguoiDungId: testUser.id,
            hoatDongId: pastActivity.id,
          },
        },
      });

      expect(registration.trangThai).toBe('VANG_MAT');

      // Cleanup
      await prisma.dangKyHoatDong.deleteMany({
        where: { hoatDongId: pastActivity.id },
      });
      await prisma.hoatDong.delete({ where: { id: pastActivity.id } });
    });
  });

  describe('Admin Approval/Rejection', () => {
    let pendingRegistration;

    beforeEach(async () => {
      // Create registration with pending status
      const registration = await prisma.dangKyHoatDong.findUnique({
        where: {
          nguoiDungId_hoatDongId: {
            nguoiDungId: testUser.id,
            hoatDongId: testActivity.id,
          },
        },
      });

      await prisma.dangKyHoatDong.update({
        where: { id: registration.id },
        data: { trangThai: 'CHO_DUYET' },
      });

      pendingRegistration = registration;
    });

    test('should allow admin to approve attendance', async () => {
      const response = await request(app)
        .post(`/api/activities/registrations/${pendingRegistration.id}/decide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'APPROVE',
          note: 'Approved by admin',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Đã duyệt');

      // Verify status
      const updated = await prisma.dangKyHoatDong.findUnique({
        where: { id: pendingRegistration.id },
      });

      expect(updated.trangThai).toBe('DA_THAM_GIA');
    });

    test('should allow admin to reject attendance', async () => {
      const response = await request(app)
        .post(`/api/activities/registrations/${pendingRegistration.id}/decide`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'REJECT',
          note: 'Invalid evidence',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Đã từ chối');

      // Verify status
      const updated = await prisma.dangKyHoatDong.findUnique({
        where: { id: pendingRegistration.id },
      });

      expect(updated.trangThai).toBe('VANG_MAT');
    });
  });
});
