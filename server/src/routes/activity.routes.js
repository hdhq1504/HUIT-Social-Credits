import { Router } from 'express';
import { getActivity, listActivities } from '../controllers/activity/activity-public.controller.js';
import {
  cancelActivityRegistration,
  listActivityRegistrationsAdmin,
  listMyActivities,
  registerForActivity,
} from '../controllers/activity/activity-registrations.controller.js';
import { markAttendance } from '../controllers/activity/activity-attendance.controller.js';
import { submitActivityFeedback } from '../controllers/activity/activity-feedback.controller.js';
import {
  createActivity,
  updateActivity,
  deleteActivity,
  approveActivity,
  rejectActivity,
} from '../controllers/activity/activity-management.controller.js';
import { optionalAuth, requireAuth, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// CRUD hoạt động
/**
 * @route POST /api/activities
 * @desc Tạo hoạt động mới
 * @access Admin, GiangVien
 */
router.post('/', requireRoles('ADMIN', 'GIANGVIEN'), createActivity);

/**
 * @route PUT /api/activities/:id
 * @desc Cập nhật hoạt động
 * @access Admin, GiangVien
 */
router.put('/:id', requireRoles('ADMIN', 'GIANGVIEN'), updateActivity);

/**
 * @route DELETE /api/activities/:id
 * @desc Xóa hoạt động
 * @access Admin
 */
router.delete('/:id', requireRoles('ADMIN'), deleteActivity);

/**
 * @route PUT /api/activities/:id/approve
 * @desc Duyệt hoạt động
 * @access Admin
 */
router.put('/:id/approve', requireRoles('ADMIN'), approveActivity);

/**
 * @route PUT /api/activities/:id/reject
 * @desc Từ chối hoạt động
 * @access Admin
 */
router.put('/:id/reject', requireRoles('ADMIN'), rejectActivity);

/**
 * @route GET /api/activities
 * @desc Lấy danh sách hoạt động (Public/Authenticated)
 * @access Public/Authenticated
 */
router.get('/', optionalAuth, listActivities);

/**
 * @route GET /api/activities/my
 * @desc Lấy danh sách hoạt động của tôi
 * @access Authenticated
 */
router.get('/my', requireAuth, listMyActivities);

/**
 * @route GET /api/activities/:id
 * @desc Lấy chi tiết hoạt động
 * @access Public/Authenticated
 */
router.get('/:id', optionalAuth, getActivity);

/**
 * @route GET /api/activities/:id/registrations
 * @desc Lấy danh sách đăng ký của hoạt động (Admin/GiangVien)
 * @access Admin, GiangVien
 */
router.get('/:id/registrations', requireRoles('ADMIN', 'GIANGVIEN'), listActivityRegistrationsAdmin);

/**
 * @route POST /api/activities/:id/registrations
 * @desc Đăng ký tham gia hoạt động
 * @access SinhVien
 */
router.post('/:id/registrations', requireRoles('SINHVIEN'), registerForActivity);

/**
 * @route POST /api/activities/:id/registrations/cancel
 * @desc Hủy đăng ký tham gia hoạt động
 * @access SinhVien
 */
router.post('/:id/registrations/cancel', requireRoles('SINHVIEN'), cancelActivityRegistration);

/**
 * @route POST /api/activities/:id/attendance
 * @desc Điểm danh tham gia hoạt động
 * @access Admin, GiangVien, SinhVien
 */
router.post('/:id/attendance', requireRoles('ADMIN', 'GIANGVIEN', 'SINHVIEN'), markAttendance);

/**
 * @route POST /api/activities/:id/feedback
 * @desc Gửi phản hồi hoạt động
 * @access SinhVien
 */
router.post('/:id/feedback', requireRoles('SINHVIEN'), submitActivityFeedback);

export default router;
