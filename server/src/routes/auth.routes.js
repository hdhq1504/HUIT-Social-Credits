import { Router } from "express";
import {
  login,
  me,
  refresh,
  logout,
  changePassword,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPasswordWithOtp,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();
/**
 * @route POST /api/auth/login
 * @desc Đăng nhập
 * @access Public
 */
router.post("/login", login);

/**
 * @route POST /api/auth/refresh
 * @desc Làm mới access token
 * @access Public
 */
router.post("/refresh", refresh);

/**
 * @route POST /api/auth/logout
 * @desc Đăng xuất
 * @access Public
 */
router.post("/logout", logout);

/**
 * @route GET /api/auth/me
 * @desc Lấy thông tin người dùng hiện tại
 * @access Authenticated
 */
router.get("/me", requireAuth, me);

/**
 * @route POST /api/auth/change-password
 * @desc Đổi mật khẩu
 * @access Authenticated
 */
router.post("/change-password", requireAuth, changePassword);

/**
 * @route POST /api/auth/forgot-password/request
 * @desc Yêu cầu đặt lại mật khẩu (Gửi OTP)
 * @access Public
 */
router.post("/forgot-password/request", requestPasswordReset);

/**
 * @route POST /api/auth/forgot-password/verify
 * @desc Xác thực OTP đặt lại mật khẩu
 * @access Public
 */
router.post("/forgot-password/verify", verifyPasswordResetOtp);

/**
 * @route POST /api/auth/forgot-password/reset
 * @desc Đặt lại mật khẩu mới
 * @access Public
 */
router.post("/forgot-password/reset", resetPasswordWithOtp);

export default router;
