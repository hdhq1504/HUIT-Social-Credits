import request from 'supertest';
import express from 'express';
import prisma from '../prisma.js';
import activityRoutes from '../routes/activity.routes.js';
import {
  generateTestToken,
  createTestUser,
  createTestActivity,
  createTestRegistration,
  cleanupTestData,
} from './test-helpers.js';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/activities', activityRoutes);

describe('Activity Registration', () => {
  let testUser;
  let testAdmin;
  let testActivity;
  let userToken;
  let adminToken;

  beforeAll(async () => {
    // Create test users
    testUser = await createTestUser({
      email: 'registration-test-user@example.com',
      maSinhVien: 'REG001',
    });
    testAdmin = await createTestUser({
      email: 'registration-test-admin@example.com',
      maSinhVien: 'ADMIN001',
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
    // Create a fresh activity for each test
    testActivity = await createTestActivity(testAdmin.id, {
      tieuDe: 'Registration Test Activity',
      sucChuaToiDa: 10,
    });
  });

  afterEach(async () => {
    // Clean up activity after each test
    if (testActivity) {
      await prisma.dangKyHoatDong.deleteMany({
        where: { hoatDongId: testActivity.id },
      });
      await prisma.hoatDong.delete({
        where: { id: testActivity.id },
      });
      testActivity = null;
    }
  });

  describe('POST /api/activities/:id/register', () => {
    test('should successfully register for an activity', async () => {
      const response = await request(app)
        .post(`/api/activities/${testActivity.id}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ note: 'Test registration note' })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Đăng ký hoạt động thành công');
      expect(response.body).toHaveProperty('activity');
      expect(response.body.activity).toHaveProperty('id', testActivity.id);
      expect(response.body.activity).toHaveProperty('registrationStatus', 'DANG_KY');

      // Verify database record
      const registration = await prisma.dangKyHoatDong.findUnique({
        where: {
          nguoiDungId_hoatDongId: {
            nguoiDungId: testUser.id,
            hoatDongId: testActivity.id,
          },
        },
      });

      expect(registration).toBeTruthy();
      expect(registration.trangThai).toBe('DANG_KY');
      expect(registration.ghiChu).toBe('Test registration note');
    });

    test('should fail to register for non-existent activity', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post(`/api/activities/${fakeId}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send()
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Hoạt động không tồn tại');
    });

    test('should fail to register twice for the same activity', async () => {
      // First registration
      await request(app)
        .post(`/api/activities/${testActivity.id}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send()
        .expect(201);

      // Second registration attempt
      const response = await request(app)
        .post(`/api/activities/${testActivity.id}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send()
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Bạn đã đăng ký hoạt động này');
    });

    test('should fail to register when activity is full', async () => {
      // Create activity with capacity of 1
      const fullActivity = await createTestActivity(testAdmin.id, {
        tieuDe: 'Full Activity',
        sucChuaToiDa: 1,
      });

      // Create another user to fill the activity
      const otherUser = await createTestUser({
        email: 'other-user@example.com',
        maSinhVien: 'OTHER001',
      });

      // Register other user
      await createTestRegistration(otherUser.id, fullActivity.id);

      // Try to register test user
      const response = await request(app)
        .post(`/api/activities/${fullActivity.id}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send()
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Hoạt động đã đủ số lượng');

      // Cleanup
      await prisma.dangKyHoatDong.deleteMany({
        where: { hoatDongId: fullActivity.id },
      });
      await prisma.hoatDong.delete({ where: { id: fullActivity.id } });
      await prisma.nguoiDung.delete({ where: { id: otherUser.id } });
    });

    test('should fail to register for unpublished activity', async () => {
      const unpublishedActivity = await createTestActivity(testAdmin.id, {
        tieuDe: 'Unpublished Activity',
        isPublished: false,
      });

      const response = await request(app)
        .post(`/api/activities/${unpublishedActivity.id}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send()
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Hoạt động không tồn tại');

      // Cleanup
      await prisma.hoatDong.delete({ where: { id: unpublishedActivity.id } });
    });

    test('should allow re-registration after cancellation', async () => {
      // Initial registration
      await request(app)
        .post(`/api/activities/${testActivity.id}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ note: 'First registration' })
        .expect(201);

      // Cancel registration
      await request(app)
        .post(`/api/activities/${testActivity.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      // Re-register
      const response = await request(app)
        .post(`/api/activities/${testActivity.id}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ note: 'Re-registration' })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Đăng ký hoạt động thành công');

      // Verify database
      const registration = await prisma.dangKyHoatDong.findUnique({
        where: {
          nguoiDungId_hoatDongId: {
            nguoiDungId: testUser.id,
            hoatDongId: testActivity.id,
          },
        },
      });

      expect(registration.trangThai).toBe('DANG_KY');
      expect(registration.ghiChu).toBe('Re-registration');
      expect(registration.lyDoHuy).toBeNull();
    });
  });

  describe('POST /api/activities/:id/cancel', () => {
    beforeEach(async () => {
      // Register user for activity before each cancel test
      await createTestRegistration(testUser.id, testActivity.id);
    });

    test('should successfully cancel registration', async () => {
      const response = await request(app)
        .post(`/api/activities/${testActivity.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reason: 'Cannot attend',
          note: 'Personal reasons',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Hủy đăng ký thành công');

      // Verify database
      const registration = await prisma.dangKyHoatDong.findUnique({
        where: {
          nguoiDungId_hoatDongId: {
            nguoiDungId: testUser.id,
            hoatDongId: testActivity.id,
          },
        },
      });

      expect(registration.trangThai).toBe('DA_HUY');
      expect(registration.lyDoHuy).toBe('Cannot attend');
      expect(registration.ghiChu).toBe('Personal reasons');
    });

    test('should fail to cancel non-existent registration', async () => {
      const otherActivity = await createTestActivity(testAdmin.id, {
        tieuDe: 'Other Activity',
      });

      const response = await request(app)
        .post(`/api/activities/${otherActivity.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send()
        .expect(404);

      expect(response.body).toHaveProperty(
        'error',
        'Bạn chưa đăng ký hoạt động này hoặc đã hủy trước đó'
      );

      // Cleanup
      await prisma.hoatDong.delete({ where: { id: otherActivity.id } });
    });

    test('should fail to cancel already cancelled registration', async () => {
      // First cancellation
      await request(app)
        .post(`/api/activities/${testActivity.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'First cancel' })
        .expect(200);

      // Second cancellation attempt
      const response = await request(app)
        .post(`/api/activities/${testActivity.id}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Second cancel' })
        .expect(404);

      expect(response.body).toHaveProperty(
        'error',
        'Bạn chưa đăng ký hoạt động này hoặc đã hủy trước đó'
      );
    });
  });

  describe('GET /api/activities/mine', () => {
    test('should list user registrations', async () => {
      // Create multiple registrations
      const activity1 = await createTestActivity(testAdmin.id, {
        tieuDe: 'Activity 1',
      });
      const activity2 = await createTestActivity(testAdmin.id, {
        tieuDe: 'Activity 2',
      });

      await createTestRegistration(testUser.id, activity1.id);
      await createTestRegistration(testUser.id, activity2.id, {
        trangThai: 'DA_THAM_GIA',
      });

      const response = await request(app)
        .get('/api/activities/mine')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('registrations');
      expect(Array.isArray(response.body.registrations)).toBe(true);
      expect(response.body.registrations.length).toBeGreaterThanOrEqual(2);

      // Cleanup
      await prisma.dangKyHoatDong.deleteMany({
        where: { hoatDongId: { in: [activity1.id, activity2.id] } },
      });
      await prisma.hoatDong.deleteMany({
        where: { id: { in: [activity1.id, activity2.id] } },
      });
    });

    test('should filter registrations by status', async () => {
      const activity = await createTestActivity(testAdmin.id);
      await createTestRegistration(testUser.id, activity.id, {
        trangThai: 'DA_THAM_GIA',
      });

      const response = await request(app)
        .get('/api/activities/mine?status=DA_THAM_GIA')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.registrations).toBeTruthy();
      response.body.registrations.forEach((reg) => {
        expect(reg.status).toBe('DA_THAM_GIA');
      });

      // Cleanup
      await prisma.dangKyHoatDong.deleteMany({
        where: { hoatDongId: activity.id },
      });
      await prisma.hoatDong.delete({ where: { id: activity.id } });
    });
  });
});
