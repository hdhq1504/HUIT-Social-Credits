import { Router } from 'express';
import {
  listRegistrationsAdmin,
  getRegistrationDetailAdmin,
  decideRegistrationAttendance,
} from '../controllers/activity/activity-registrations.controller.js';
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route GET /api/registrations
 * @desc Lấy danh sách đăng ký (Admin/GiangVien)
 * @access Admin, GiangVien
 */
router.get('/', requireRoles('ADMIN', 'GIANGVIEN'), listRegistrationsAdmin);

/**
 * @route GET /api/registrations/:id
 * @desc Lấy chi tiết đăng ký (Admin/GiangVien)
 * @access Admin, GiangVien
 */
router.get('/:id', requireRoles('ADMIN', 'GIANGVIEN'), getRegistrationDetailAdmin);

/**
 * @route POST /api/registrations/:id/decision
 * @desc Duyệt điểm danh đăng ký (Admin/GiangVien)
 * @access Admin, GiangVien
 */
router.post('/:id/decision', requireRoles('ADMIN', 'GIANGVIEN'), decideRegistrationAttendance);

export default router;
