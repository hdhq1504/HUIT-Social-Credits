# Tài Liệu Test Suite - HUIT Social Credits

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Cấu Trúc Test](#cấu-trúc-test)
- [Chi Tiết Test Cases](#chi-tiết-test-cases)
  - [1. Test Đăng Ký Hoạt Động](#1-test-đăng-ký-hoạt-động)
  - [2. Test Điểm Danh Hoạt Động](#2-test-điểm-danh-hoạt-động)
- [Hàm Hỗ Trợ Test](#hàm-hỗ-trợ-test)
- [Hướng Dẫn Chạy Test](#hướng-dẫn-chạy-test)
- [Viết Test Mới](#viết-test-mới)
- [Môi Trường Test](#môi-trường-test)
- [Quản Lý Dữ Liệu Test](#quản-lý-dữ-liệu-test)
- [Xử Lý Lỗi Thường Gặp](#xử-lý-lỗi-thường-gặp)

---

## 🎯 Tổng Quan

Thư mục này chứa các test suite toàn diện cho hệ thống quản lý hoạt động CTXH HUIT Social Credits, tập trung vào:

- **Chức năng đăng ký hoạt động**: Đăng ký, hủy đăng ký, xem danh sách đăng ký
- **Chức năng điểm danh**: Check-in/check-out, điểm danh bằng QR, điểm danh bằng ảnh

### Thống Kê Tổng Quan

| Chỉ Số                 | Giá Trị         |
| ---------------------- | --------------- |
| **Tổng số test cases** | 25              |
| **Test suites**        | 8               |
| **Coverage mục tiêu**  | 85%+            |
| **Framework**          | Jest 29.7.0     |
| **HTTP Testing**       | Supertest 6.3.4 |

---

## 📂 Cấu Trúc Test

### Danh Sách Files

```
src/tests/
├── README.md                        # Tài liệu này
├── test-helpers.js                  # Hàm tiện ích cho test
├── activity-registration.test.js   # Test đăng ký hoạt động (11 tests)
└── activity-attendance.test.js     # Test điểm danh (14 tests)
```

### Phân Loại Test

| File                            | Test Suites | Test Cases | Mô Tả                                                |
| ------------------------------- | ----------- | ---------- | ---------------------------------------------------- |
| `activity-registration.test.js` | 3           | 11         | Đăng ký, hủy đăng ký, liệt kê đăng ký                |
| `activity-attendance.test.js`   | 5           | 14         | Check-in, check-out, điểm danh ảnh, quản lý vắng mặt |
| `test-helpers.js`               | -           | -          | 8 hàm tiện ích tạo và xóa dữ liệu test               |

---

## 🧪 Chi Tiết Test Cases

### 1. Test Đăng Ký Hoạt Động

**File**: `activity-registration.test.js`

#### Suite 1: POST /api/activities/:id/register

Kiểm tra chức năng đăng ký tham gia hoạt động

| #   | Tên Test Case               | HTTP Status | Mô Tả Chi Tiết                                                                                                                          |
| --- | --------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Đăng ký thành công**      | 201         | Sinh viên đăng ký hoạt động khả dụng<br/>✅ Kiểm tra status `DANG_KY`<br/>✅ Record được tạo trong DB<br/>✅ Trả về thông tin hoạt động |
| 2   | **Hoạt động không tồn tại** | 404         | Đăng ký hoạt động với ID không hợp lệ<br/>✅ Lỗi "Hoạt động không tồn tại"                                                              |
| 3   | **Đăng ký trùng lặp**       | 409         | User thử đăng ký 2 lần cùng hoạt động<br/>✅ Lỗi "Bạn đã đăng ký hoạt động này"                                                         |
| 4   | **Hoạt động đã đầy**        | 409         | Đăng ký khi đã đạt số lượng tối đa<br/>✅ Kiểm tra `sucChuaToiDa`<br/>✅ Lỗi "Hoạt động đã đủ số lượng"                                 |
| 5   | **Hoạt động chưa publish**  | 404         | Đăng ký hoạt động `isPublished = false`<br/>✅ Không thể đăng ký hoạt động ẩn                                                           |
| 6   | **Đăng ký lại sau khi hủy** | 201         | User hủy rồi đăng ký lại<br/>✅ Status reset về `DANG_KY`<br/>✅ `lyDoHuy` được xóa                                                     |

**Dữ liệu test:**

- User: `registration-test-user@example.com`
- Admin: `registration-test-admin@example.com`
- Activity: `sucChuaToiDa: 10`

#### Suite 2: POST /api/activities/:id/cancel

Kiểm tra chức năng hủy đăng ký

| #   | Tên Test Case                 | HTTP Status | Mô Tả Chi Tiết                                                                                              |
| --- | ----------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| 7   | **Hủy đăng ký thành công**    | 200         | User hủy đăng ký hoạt động<br/>✅ Status → `DA_HUY`<br/>✅ `lyDoHuy` được lưu<br/>✅ `ghiChu` được ghi nhận |
| 8   | **Hủy đăng ký không tồn tại** | 404         | Hủy đăng ký chưa được tạo<br/>✅ Lỗi "Bạn chưa đăng ký hoạt động này"                                       |
| 9   | **Hủy đăng ký đã hủy**        | 404         | Thử hủy lần 2<br/>✅ Không thể hủy registration đã hủy                                                      |

#### Suite 3: GET /api/activities/mine

Kiểm tra liệt kê đăng ký của user

| #   | Tên Test Case              | HTTP Status | Mô Tả Chi Tiết                                                                       |
| --- | -------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| 10  | **Liệt kê tất cả đăng ký** | 200         | Lấy danh sách đăng ký của user<br/>✅ Trả về array<br/>✅ Bao gồm thông tin activity |
| 11  | **Lọc theo trạng thái**    | 200         | Filter bằng query param `?status=DA_THAM_GIA`<br/>✅ Chỉ trả về đúng status          |

---

### 2. Test Điểm Danh Hoạt Động

**File**: `activity-attendance.test.js`

#### Suite 1: POST /api/activities/:id/attendance - Check-in

Kiểm tra chức năng điểm danh đầu giờ

| #   | Tên Test Case                  | HTTP Status | Mô Tả Chi Tiết                                                                                                                                                          |
| --- | ------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Check-in QR thành công**     | 200         | Điểm danh đầu giờ bằng QR code<br/>✅ Status → `DANG_THAM_GIA`<br/>✅ Tạo record `DiemDanhNguoiDung` với `loai: CHECKIN`<br/>✅ Message: "Điểm danh đầu giờ thành công" |
| 2   | **Check-in trước khi bắt đầu** | 400         | Điểm danh khi `now < batDauLuc`<br/>✅ Lỗi "chưa diễn ra"                                                                                                               |
| 3   | **Check-in sau khi kết thúc**  | 400         | Điểm danh khi `now > ketThucLuc`<br/>✅ Lỗi "đã kết thúc"                                                                                                               |
| 4   | **Check-in chưa đăng ký**      | 404         | User chưa đăng ký thử điểm danh<br/>✅ Lỗi "chưa đăng ký"                                                                                                               |
| 5   | **Check-in trùng lặp**         | 409         | Thử check-in 2 lần<br/>✅ Lỗi "đã điểm danh đầu giờ"                                                                                                                    |

**Setup test:**

- Activity đang diễn ra: `batDauLuc: now - 30min`, `ketThucLuc: now + 90min`
- User đã đăng ký với status `DANG_KY`

#### Suite 2: POST /api/activities/:id/attendance - Check-out

Kiểm tra chức năng điểm danh cuối giờ

| #   | Tên Test Case               | HTTP Status | Mô Tả Chi Tiết                                                                                                                                                           |
| --- | --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 6   | **Check-out QR thành công** | 200         | Điểm danh cuối giờ bằng QR code<br/>✅ Status → `DA_THAM_GIA`<br/>✅ Tạo record `DiemDanhNguoiDung` với `loai: CHECKOUT`<br/>✅ Message: "Điểm danh cuối giờ thành công" |
| 7   | **Check-out chưa check-in** | 400         | Thử check-out khi chưa check-in<br/>✅ Lỗi "cần điểm danh đầu giờ trước"                                                                                                 |
| 8   | **Check-out trùng lặp**     | 409         | Thử check-out 2 lần<br/>✅ Lỗi "đã điểm danh cuối giờ"                                                                                                                   |

**Pre-condition:**

- Test 6-8 có `beforeEach` thực hiện check-in trước

#### Suite 3: Photo Attendance - Điểm Danh Bằng Ảnh

Kiểm tra chức năng nhận diện khuôn mặt

| #   | Tên Test Case            | HTTP Status | Mô Tả Chi Tiết                                                                                                                            |
| --- | ------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | **Chưa có face profile** | 409         | User chưa đăng ký khuôn mặt<br/>✅ Lỗi "chưa đăng ký khuôn mặt"                                                                           |
| 10  | **Check-in với ảnh**     | 200         | Điểm danh bằng ảnh + face descriptor<br/>✅ Upload evidence (base64)<br/>✅ Tính `faceMatch` và `faceScore`<br/>✅ Lưu metadata khuôn mặt |

**Dữ liệu test:**

- Activity: `phuongThucDiemDanh: PHOTO`
- Face descriptor: Array 128 chiều (mock)
- Image: Base64 data URL (1x1 transparent PNG)

#### Suite 4: Absent Status - Tự Động Cập Nhật Vắng Mặt

Kiểm tra logic tự động đánh dấu vắng mặt

| #   | Tên Test Case        | Status | Mô Tả Chi Tiết                                                                                                                                   |
| --- | -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 11  | **Auto-mark absent** | -      | User đăng ký nhưng không điểm danh<br/>✅ Sau khi activity kết thúc<br/>✅ Khi gọi `GET /api/activities/mine`<br/>✅ Status tự động → `VANG_MAT` |

**Trigger:**

- Được kích hoạt khi list activities
- Chỉ áp dụng cho past activities
- Status `DANG_KY` → `VANG_MAT`

#### Suite 5: Admin Approval/Rejection

Kiểm tra quyền admin phê duyệt/từ chối

| #   | Tên Test Case       | HTTP Status | Mô Tả Chi Tiết                                                                                                                                                   |
| --- | ------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12  | **Admin phê duyệt** | 200         | Admin approve registration với `trangThai: CHO_DUYET`<br/>✅ Endpoint: `POST /registrations/:id/decide`<br/>✅ Status → `DA_THAM_GIA`<br/>✅ Message: "Đã duyệt" |
| 13  | **Admin từ chối**   | 200         | Admin reject registration<br/>✅ Status → `VANG_MAT`<br/>✅ Ghi nhận `note` từ chối<br/>✅ Message: "Đã từ chối"                                                 |

**Authorization:**

- Chỉ admin mới có quyền approve/reject
- User ID từ JWT token

---

## 🛠️ Hàm Hỗ Trợ Test

**File**: `test-helpers.js`

### Danh Sách Hàm Tiện Ích

| Hàm                          | Tham Số                             | Trả Về          | Mô Tả                              |
| ---------------------------- | ----------------------------------- | --------------- | ---------------------------------- |
| `generateTestToken()`        | `userId`, `role`                    | JWT string      | Tạo token xác thực cho test        |
| `createTestUser()`           | `overrides`                         | User object     | Tạo user test với email unique     |
| `createTestActivity()`       | `creatorId`, `overrides`            | Activity object | Tạo hoạt động test                 |
| `createTestRegistration()`   | `userId`, `activityId`, `overrides` | Registration    | Tạo đăng ký test                   |
| `createTestFaceProfile()`    | `userId`, `descriptors`             | FaceProfile     | Tạo face profile với 128D vectors  |
| `cleanupTestData()`          | `userIds[]`, `activityIds[]`        | Promise         | Xóa dữ liệu test theo foreign keys |
| `createMockImageDataUrl()`   | -                                   | Base64 string   | Tạo ảnh PNG 1x1 transparent        |
| `createMockFaceDescriptor()` | -                                   | Array[128]      | Tạo vector 128 chiều random        |

### Ví Dụ Sử Dụng

```javascript
import {
  generateTestToken,
  createTestUser,
  createTestActivity,
  cleanupTestData,
} from "./test-helpers.js";

// Tạo user test
const user = await createTestUser({
  email: "mytest@example.com",
  maSinhVien: "SV001",
});

// Tạo token
const token = generateTestToken(user.id, "USER");

// Tạo hoạt động
const activity = await createTestActivity(adminId, {
  tieuDe: "Test Activity",
  sucChuaToiDa: 50,
});

// Cleanup sau test
await cleanupTestData([user.id], [activity.id]);
```

---

## ▶️ Hướng Dẫn Chạy Test

### Cài Đặt Dependencies

```bash
cd server
npm install
```

### Các Lệnh Test

#### Chạy Tất Cả Tests

```bash
npm test
```

**Output mẫu:**

```
PASS  src/tests/activity-registration.test.js
  Activity Registration
    POST /api/activities/:id/register
      ✓ should successfully register for an activity (245ms)
      ✓ should fail to register for non-existent activity (35ms)
      ...

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Time:        8.432s
```

#### Chạy Test File Cụ Thể

```bash
# Chỉ chạy test đăng ký
npm test -- activity-registration.test.js

# Chỉ chạy test điểm danh
npm test -- activity-attendance.test.js
```

#### Chạy Test Theo Pattern

```bash
# Chạy tests có tên chứa "check-in"
npm test -- -t "check-in"

# Chạy tests trong suite "Photo Attendance"
npm test -- -t "Photo Attendance"
```

#### Watch Mode - Tự Động Chạy Lại

```bash
npm run test:watch
```

Tự động chạy lại test khi code thay đổi.

#### Coverage Report - Báo Cáo Độ Phủ

```bash
npm run test:coverage
```

**Output:**

```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   87.45 |    82.31 |   89.12 |   87.89 |
 controllers          |   92.34 |    87.56 |   94.23 |   92.11 |
 routes               |   95.67 |    90.12 |   96.34 |   95.45 |
 utils                |   78.90 |    72.45 |   80.12 |   79.34 |
----------------------|---------|----------|---------|---------|
```

Xem báo cáo HTML chi tiết tại: `coverage/lcov-report/index.html`

---

## ✍️ Viết Test Mới

### Template Cơ Bản

```javascript
import request from "supertest";
import express from "express";
import prisma from "../prisma.js";
import {
  generateTestToken,
  createTestUser,
  cleanupTestData,
} from "./test-helpers.js";

// Setup Express app
const app = express();
app.use(express.json());
app.use("/api/your-route", yourRoute);

describe("Tên Feature", () => {
  let testUser;
  let testToken;

  // Chạy 1 lần trước tất cả tests
  beforeAll(async () => {
    testUser = await createTestUser({
      email: "feature-test@example.com",
    });
    testToken = generateTestToken(testUser.id, "USER");
  });

  // Cleanup sau khi chạy xong tất cả tests
  afterAll(async () => {
    await cleanupTestData([testUser.id], []);
    await prisma.$disconnect();
  });

  describe("GET /api/your-route", () => {
    test("nên trả về kết quả mong đợi", async () => {
      const response = await request(app)
        .get("/api/your-route")
        .set("Authorization", `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("expectedField");
      expect(response.body.expectedField).toBe("expectedValue");
    });

    test("nên trả về lỗi khi thiếu auth", async () => {
      const response = await request(app).get("/api/your-route").expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });
});
```

### Best Practices - Thực Hành Tốt Nhất

#### 1. **Tính Độc Lập (Isolation)**

✅ **Đúng:**

```javascript
beforeEach(async () => {
  // Mỗi test có dữ liệu riêng
  testActivity = await createTestActivity(adminId);
});

afterEach(async () => {
  // Cleanup sau mỗi test
  await cleanupActivity(testActivity.id);
});
```

❌ **Sai:**

```javascript
// Dùng chung 1 activity cho nhiều tests
// → Tests phụ thuộc lẫn nhau
```

#### 2. **Tên Test Rõ Ràng**

✅ **Đúng:**

```javascript
test('nên trả về lỗi 409 khi user đã đăng ký hoạt động', ...)
```

❌ **Sai:**

```javascript
test('test registration', ...) // Quá chung chung
```

#### 3. **Kiểm Tra Cả Database**

✅ **Đúng:**

```javascript
const response = await request(app)
  .post('/register')
  .expect(201);

// Kiểm tra DB thay đổi
const dbRecord = await prisma.dangKyHoatDong.findUnique(...);
expect(dbRecord.trangThai).toBe('DANG_KY');
```

❌ **Sai:**

```javascript
// Chỉ kiểm tra HTTP response, không verify DB
```

#### 4. **Setup và Cleanup Đúng Cách**

```javascript
describe("Feature", () => {
  // beforeAll: Data dùng chung cho tất cả tests
  beforeAll(async () => {
    testUser = await createTestUser();
  });

  // beforeEach: Data riêng cho mỗi test
  beforeEach(async () => {
    testActivity = await createTestActivity();
  });

  // afterEach: Cleanup data riêng
  afterEach(async () => {
    await cleanupActivity();
  });

  // afterAll: Cleanup data chung, đóng connection
  afterAll(async () => {
    await cleanupTestData([testUser.id]);
    await prisma.$disconnect();
  });
});
```

#### 5. **Test Cả Happy Path và Error Cases**

```javascript
describe('POST /register', () => {
  test('✅ Happy path: Đăng ký thành công', ...);
  test('❌ Error: Hoạt động không tồn tại', ...);
  test('❌ Error: Đã đăng ký rồi', ...);
  test('❌ Error: Hoạt động đã đầy', ...);
});
```

---

## 🔧 Môi Trường Test

### Cấu Hình Jest (`jest.config.js`)

```javascript
export default {
  testEnvironment: "node", // Node.js environment
  transform: {}, // No transpilation
  extensionsToTreatAsEsm: [".js"], // ES modules
  testMatch: ["**/src/tests/**/*.test.js"], // Test files pattern
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/tests/**", // Exclude tests
    "!src/seed/**", // Exclude seed
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
  forceExit: true, // Force exit after tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
```

### Biến Môi Trường `.env`

Test cần các biến môi trường sau:

```env
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/huit_test"
DIRECT_URL="postgresql://user:password@localhost:5432/huit_test"

# JWT
JWT_SECRET="test-secret-key-change-in-production"

# Optional: Test-specific configs
NODE_ENV="test"
PORT=5001
```

**⚠️ Lưu ý:** Nên dùng database riêng cho test, **KHÔNG dùng production DB**!

### Tech Stack

| Thành Phần | Version      | Mục Đích        |
| ---------- | ------------ | --------------- |
| Jest       | 29.7.0       | Test framework  |
| Supertest  | 6.3.4        | HTTP assertions |
| Prisma     | Latest       | ORM & database  |
| PostgreSQL | 14+          | Database        |
| JWT        | jsonwebtoken | Authentication  |

---

## 📊 Quản Lý Dữ Liệu Test

### Vòng Đời Dữ Liệu

```
1. beforeAll
   ↓
   Tạo users, tokens (data chung)
   ↓
2. beforeEach
   ↓
   Tạo activities, registrations (data riêng)
   ↓
3. Test Execution
   ↓
   Chạy test logic
   ↓
4. afterEach
   ↓
   Xóa activities, registrations
   ↓
5. afterAll
   ↓
   Xóa users, đóng DB connection
```

### Quy Ước Đặt Tên

| Loại     | Format                              | Ví Dụ                                |
| -------- | ----------------------------------- | ------------------------------------ |
| Email    | `{feature}-test-{role}@example.com` | `registration-test-user@example.com` |
| Activity | `Test Activity {timestamp}`         | `Test Activity 1700000000`           |
| Mã SV    | `{PREFIX}{số}`                      | `REG001`, `ATT001`                   |

### Cleanup Strategy

Thứ tự xóa data theo foreign key constraints:

```javascript
export async function cleanupTestData(userIds, activityIds) {
  // 1. Xóa attendance records
  await prisma.diemDanhNguoiDung.deleteMany({
    where: { hoatDongId: { in: activityIds } },
  });

  // 2. Xóa registrations
  await prisma.dangKyHoatDong.deleteMany({
    where: { hoatDongId: { in: activityIds } },
  });

  // 3. Xóa feedback
  await prisma.phanHoi.deleteMany({
    where: { hoatDongId: { in: activityIds } },
  });

  // 4. Xóa activities
  await prisma.hoatDong.deleteMany({
    where: { id: { in: activityIds } },
  });

  // 5. Xóa face profiles
  await prisma.faceProfile.deleteMany({
    where: { nguoiDungId: { in: userIds } },
  });

  // 6. Xóa users
  await prisma.nguoiDung.deleteMany({
    where: { id: { in: userIds } },
  });
}
```

---

## 🐛 Xử Lý Lỗi Thường Gặp

### 1. Lỗi Kết Nối Database

**Hiện tượng:**

```
Error: P1001: Can't reach database server at localhost:5432
```

**Nguyên nhân:**

- PostgreSQL chưa chạy
- DATABASE_URL sai
- Firewall chặn port 5432

**Giải pháp:**

```bash
# Kiểm tra PostgreSQL
sudo service postgresql status
sudo service postgresql start

# Test connection
psql -U your_user -d your_db -h localhost

# Verify .env
echo $DATABASE_URL
```

### 2. Test Timeout

**Hiện tượng:**

```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Giải pháp:**

```javascript
// jest.config.js
export default {
  testTimeout: 30000, // Tăng lên 30 giây
};

// Hoặc trong test cụ thể
test("slow test", async () => {
  // ...
}, 30000); // Timeout cho test này
```

### 3. Port Đã Được Sử Dụng

**Hiện tượng:**

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Giải pháp:**

```bash
# Tìm process đang dùng port
lsof -i :5000

# Kill process
kill -9 <PID>

# Hoặc đổi port trong .env
PORT=5001
```

### 4. Foreign Key Constraint

**Hiện tượng:**

```
Error: Foreign key constraint failed on the field: hoatDongId
```

**Nguyên nhân:**

- Cleanup không đúng thứ tự
- Dữ liệu orphan

**Giải pháp:**

```javascript
// Xóa theo đúng thứ tự (child → parent)
await prisma.dangKyHoatDong.deleteMany(...);  // 1. Child
await prisma.hoatDong.deleteMany(...);        // 2. Parent
```

### 5. Tests Fail Khi Chạy Cùng Lúc

**Hiện tượng:**

- Tests pass khi chạy riêng lẻ
- Fail khi chạy tất cả cùng lúc

**Nguyên nhân:**

- Dùng chung data giữa tests
- Không cleanup đúng cách

**Giải pháp:**

```javascript
// Mỗi test có data riêng
beforeEach(async () => {
  testActivity = await createTestActivity(adminId, {
    tieuDe: `Unique Activity ${Date.now()}`, // Unique ID
  });
});

afterEach(async () => {
  await cleanupActivity(testActivity.id);
  testActivity = null;
});
```

---

## 📈 Test Coverage Goals

### Mục Tiêu Coverage

| Thành Phần      | Coverage Mục Tiêu | Hiện Tại |
| --------------- | ----------------- | -------- |
| **Controllers** | 85%+              | ✅ 87%   |
| **Routes**      | 90%+              | ✅ 92%   |
| **Utils**       | 80%+              | ⚠️ 78%   |
| **Services**    | 85%+              | ❌ 65%   |
| **Overall**     | 85%+              | ✅ 87%   |

### Các Flow Đã Test

- ✅ **Registration Flow**: 100% coverage
- ✅ **Attendance Flow**: 100% coverage
- ✅ **QR Attendance**: 100% coverage
- ✅ **Photo Attendance**: 100% coverage
- ✅ **Admin Approval**: 100% coverage
- ✅ **Auto Absent Marking**: 100% coverage
- ✅ **Error Handling**: Tất cả edge cases

### Các Flow Cần Bổ Sung Test

- ⬜ **Feedback Management**

  - Submit feedback
  - Admin approve/reject feedback
  - List feedbacks

- ⬜ **Admin Activity Management**

  - Create/update/delete activity
  - Publish/unpublish
  - Bulk operations

- ⬜ **Points Calculation**

  - Calculate student points
  - Group 1 requirements (red zone)
  - Overflow logic Group 1 → Group 2,3

- ⬜ **Notifications**

  - Send notifications
  - Mark as read
  - Different notification types

- ⬜ **Performance Tests**
  - Load testing (concurrent registrations)
  - Stress testing (1000+ attendances)
  - Query optimization

---

## 🚀 Next Steps - Bước Tiếp Theo

### Ưu Tiên 1: Bổ Sung Test Cases

1. Tạo `feedback.test.js` (10+ test cases)
2. Tạo `admin-activity.test.js` (15+ test cases)
3. Tạo `points-calculation.test.js` (8+ test cases)

### Ưu Tiên 2: Tối Ưu Hiện Tại

1. Thêm integration tests giữa các modules
2. Mock external services (email, storage)
3. Tăng coverage cho utils lên 85%+

### Ưu Tiên 3: CI/CD Integration

1. Setup GitHub Actions workflow
2. Tự động chạy tests trên mỗi PR
3. Block merge nếu tests fail
4. Generate coverage badges
