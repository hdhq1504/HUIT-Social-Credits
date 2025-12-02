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
import { validate } from "../middlewares/validate.middleware.js";
import {
  loginSchema,
  changePasswordSchema,
  requestPasswordResetSchema,
  verifyPasswordResetOtpSchema,
  resetPasswordWithOtpSchema,
} from "../utils/validationSchemas.js";

const router = Router();
/**
 * @route POST /api/auth/login
 * @desc Đăng nhập
 * @access Public
 */
router.post("/login", validate(loginSchema), login);

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
router.post("/change-password", requireAuth, validate(changePasswordSchema), changePassword);

/**
 * @route POST /api/auth/forgot-password/request
 * @desc Yêu cầu đặt lại mật khẩu (Gửi OTP)
 * @access Public
 */
router.post("/forgot-password/request", validate(requestPasswordResetSchema), requestPasswordReset);

/**
 * @route POST /api/auth/forgot-password/verify
 * @desc Xác thực OTP đặt lại mật khẩu
 * @access Public
 */
router.post("/forgot-password/verify", validate(verifyPasswordResetOtpSchema), verifyPasswordResetOtp);

/**
 * @route POST /api/auth/forgot-password/reset
 * @desc Đặt lại mật khẩu mới
 * @access Public
 */
router.post("/forgot-password/reset", validate(resetPasswordWithOtpSchema), resetPasswordWithOtp);

export default router;
