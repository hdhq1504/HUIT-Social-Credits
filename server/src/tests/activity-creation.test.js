import request from 'supertest';
import express from 'express';
import prisma from '../prisma.js';
import activityRoutes from '../routes/activity.routes.js';
import {
  generateTestToken,
  createTestUser,
  cleanupTestData,
} from './test-helpers.js';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/activities', activityRoutes);

describe('Activity Creation', () => {
  let testAdmin;
  let testTeacher;
  let testStudent;
  let adminToken;
  let teacherToken;
  let studentToken;
  let createdActivityIds = [];

  beforeAll(async () => {
    // Create test users - note: vaiTro must match VaiTro enum (SINHVIEN, GIANGVIEN, ADMIN)
    testAdmin = await createTestUser({
      email: `activity-create-admin-${Date.now()}@example.com`,
      maSV: 'ADMIN_CREATE001',
      vaiTro: 'ADMIN',
    });
    testTeacher = await createTestUser({
      email: `activity-create-teacher-${Date.now()}@example.com`,
      maCB: 'TEACHER_CREATE001',
      vaiTro: 'GIANGVIEN',
    });
    testStudent = await createTestUser({
      email: `activity-create-student-${Date.now()}@example.com`,
      maSV: 'STUDENT_CREATE001',
      vaiTro: 'SINHVIEN',
    });

    // Generate tokens - role must match VaiTro enum
    adminToken = generateTestToken(testAdmin.id, 'ADMIN');
    teacherToken = generateTestToken(testTeacher.id, 'GIANGVIEN');
    studentToken = generateTestToken(testStudent.id, 'SINHVIEN');
  });

  afterAll(async () => {
    // Cleanup created activities first
    if (createdActivityIds.length > 0) {
      await prisma.hoatDong.deleteMany({
        where: { id: { in: createdActivityIds } },
      });
    }
    // Cleanup users
    await cleanupTestData([testAdmin.id, testTeacher.id, testStudent.id], []);
    await prisma.$disconnect();
  });

  // Helper to create valid activity payload
  const createValidPayload = (overrides = {}) => {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 14); // 14 days from now

    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 2);

    const registrationDeadline = new Date(startTime);
    registrationDeadline.setDate(registrationDeadline.getDate() - 7); // 7 days before start

    const cancellationDeadline = new Date(registrationDeadline);
    cancellationDeadline.setDate(cancellationDeadline.getDate() - 1); // 1 day before registration deadline

    return {
      tieuDe: `Test Activity ${Date.now()}`,
      nhomDiem: 'NHOM_1',
      diemCong: 10,
      diaDiem: 'Test Location',
      sucChuaToiDa: 100,
      moTa: '<p>Test description</p>',
      yeuCau: ['Requirement 1', 'Requirement 2'],
      huongDan: ['Guideline 1', 'Guideline 2'],
      batDauLuc: startTime.toISOString(),
      ketThucLuc: endTime.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      cancellationDeadline: cancellationDeadline.toISOString(),
      attendanceMethod: 'PHOTO',
      ...overrides,
    };
  };

  describe('POST /api/activities - Basic Creation', () => {
    test('should create activity successfully with valid data (Admin)', async () => {
      const payload = createValidPayload();

      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('activity');
      expect(response.body.activity).toHaveProperty('id');
      expect(response.body.activity).toHaveProperty('title');
      createdActivityIds.push(response.body.activity.id);
    });

    test('should create activity successfully with valid data (Teacher)', async () => {
      const payload = createValidPayload({ tieuDe: `Teacher Activity ${Date.now()}` });

      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('activity');
      expect(response.body.activity).toHaveProperty('id');
      createdActivityIds.push(response.body.activity.id);
    });

    test('should fail without authentication', async () => {
      const payload = createValidPayload();

      await request(app)
        .post('/api/activities')
        .send(payload)
        .expect(401);
    });

    test('should fail for student role (Forbidden)', async () => {
      const payload = createValidPayload();

      await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(payload)
        .expect(403);
    });
  });

  describe('POST /api/activities - Date Validation', () => {
    test('should fail when registrationDeadline is less than 7 days before startTime', async () => {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + 14);

      const registrationDeadline = new Date(startTime);
      registrationDeadline.setDate(registrationDeadline.getDate() - 5); // Only 5 days before

      const cancellationDeadline = new Date(registrationDeadline);
      cancellationDeadline.setDate(cancellationDeadline.getDate() - 1);

      const payload = createValidPayload({
        batDauLuc: startTime.toISOString(),
        registrationDeadline: registrationDeadline.toISOString(),
        cancellationDeadline: cancellationDeadline.toISOString(),
      });

      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(400);

      expect(response.body.error).toContain('7 ngày');
    });

    test('should fail when cancellationDeadline is after registrationDeadline', async () => {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + 14);

      const registrationDeadline = new Date(startTime);
      registrationDeadline.setDate(registrationDeadline.getDate() - 7);

      const cancellationDeadline = new Date(registrationDeadline);
      cancellationDeadline.setDate(cancellationDeadline.getDate() + 2); // After registration deadline

      const payload = createValidPayload({
        batDauLuc: startTime.toISOString(),
        registrationDeadline: registrationDeadline.toISOString(),
        cancellationDeadline: cancellationDeadline.toISOString(),
      });

      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(400);

      expect(response.body.error).toContain('hủy đăng ký');
    });

    test('should succeed when registrationDeadline is exactly 7 days before startTime', async () => {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + 14);

      const registrationDeadline = new Date(startTime);
      registrationDeadline.setDate(registrationDeadline.getDate() - 7); // Exactly 7 days

      const cancellationDeadline = new Date(registrationDeadline);

      const payload = createValidPayload({
        batDauLuc: startTime.toISOString(),
        registrationDeadline: registrationDeadline.toISOString(),
        cancellationDeadline: cancellationDeadline.toISOString(),
      });

      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('activity');
      expect(response.body.activity).toHaveProperty('id');
      createdActivityIds.push(response.body.activity.id);
    });

    test('should succeed when cancellationDeadline equals registrationDeadline', async () => {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + 14);

      const registrationDeadline = new Date(startTime);
      registrationDeadline.setDate(registrationDeadline.getDate() - 7);

      const payload = createValidPayload({
        batDauLuc: startTime.toISOString(),
        registrationDeadline: registrationDeadline.toISOString(),
        cancellationDeadline: registrationDeadline.toISOString(), // Same as registration
      });

      const response = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('activity');
      expect(response.body.activity).toHaveProperty('id');
      createdActivityIds.push(response.body.activity.id);
    });
  });
});
