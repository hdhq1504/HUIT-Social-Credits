# Test Suite Documentation

## Overview

This directory contains comprehensive test suites for the HUIT Social Credits activity management system, specifically focusing on:

- Activity registration functionality
- Activity attendance (check-in/check-out) functionality

## Test Files

### 1. `test-helpers.js`

Utility functions for creating test data and cleaning up:

- `generateTestToken()` - Generate JWT tokens for authentication
- `createTestUser()` - Create test users
- `createTestActivity()` - Create test activities
- `createTestRegistration()` - Create test registrations
- `createTestFaceProfile()` - Create face recognition profiles
- `cleanupTestData()` - Clean up test data after tests
- `createMockImageDataUrl()` - Generate mock image data
- `createMockFaceDescriptor()` - Generate mock face descriptors

### 2. `activity-registration.test.js`

Tests for activity registration functionality:

**Test Cases (9 total):**

- ✅ Successful registration for an activity
- ✅ Fail to register for non-existent activity
- ✅ Fail to register twice for same activity
- ✅ Fail to register when activity is full
- ✅ Fail to register for unpublished activity
- ✅ Re-registration after cancellation
- ✅ Successfully cancel registration
- ✅ Fail to cancel non-existent registration
- ✅ Fail to cancel already cancelled registration

### 3. `activity-attendance.test.js`

Tests for activity attendance functionality:

**Test Cases (13 total):**

**Check-in Tests:**

- ✅ Successful check-in with QR code
- ✅ Fail to check-in before activity starts
- ✅ Fail to check-in after activity ends
- ✅ Fail to check-in without registration
- ✅ Fail to check-in twice

**Check-out Tests:**

- ✅ Successful check-out with QR code
- ✅ Fail to check-out without check-in
- ✅ Fail to check-out twice

**Photo Attendance Tests:**

- ✅ Fail check-in without face profile
- ✅ Check-in with photo and face descriptor

**Absent Status Tests:**

- ✅ Automatic absent marking after activity ends

**Admin Tests:**

- ✅ Admin can approve attendance
- ✅ Admin can reject attendance

## Running Tests

### Install Dependencies

```bash
cd server
npm install
```

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
# Registration tests only
npm test -- activity-registration.test.js

# Attendance tests only
npm test -- activity-attendance.test.js
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Test Environment

- **Framework:** Jest 29.7.0
- **HTTP Testing:** Supertest 6.3.4
- **Database:** Prisma with PostgreSQL
- **Authentication:** JWT tokens

## Test Data Management

All tests use isolated test data that is created before each test and cleaned up after:

- Test users are created with unique emails
- Test activities are created with appropriate time ranges
- All test data is deleted after test completion

## Important Notes

1. **Database Connection:** Tests require a valid database connection configured in `.env`
2. **Isolation:** Each test is isolated and does not affect other tests
3. **Cleanup:** All test data is automatically cleaned up after tests run
4. **Authentication:** Tests use mock JWT tokens for authentication

## Test Coverage Goals

- **Registration Flow:** 100% coverage ✅
- **Attendance Flow:** 100% coverage ✅
- **Edge Cases:** All critical paths covered ✅
- **Error Handling:** All error scenarios tested ✅

## Troubleshooting

### Tests Failing Due to Database Connection

Ensure your `.env` file has correct database credentials:

```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### Tests Timing Out

Increase Jest timeout in `jest.config.js` if needed:

```javascript
testTimeout: 10000;
```

### Port Already in Use

If the test server port is in use, the tests will handle it automatically.

## Future Enhancements

- [ ] Add integration tests for feedback functionality
- [ ] Add tests for admin activity management
- [ ] Add tests for face recognition edge cases
- [ ] Add performance tests for bulk operations
