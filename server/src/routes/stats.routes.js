import { Router } from "express";
import {
  getProgressSummary,
  getAdminDashboardOverview,
  getAdminReportsSummary
} from "../controllers/stats.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route GET /api/stats/progress
 * @desc Lấy tóm tắt tiến độ tích lũy điểm của sinh viên
 * @access SinhVien
 */
router.get("/progress", requireRoles("SINHVIEN"), getProgressSummary);

/**
 * @route GET /api/stats/admin/dashboard
 * @desc Lấy dữ liệu tổng quan cho Dashboard Admin
 * @access Admin
 */
router.get("/admin/dashboard", requireRoles("ADMIN"), getAdminDashboardOverview);

/**
 * @route GET /api/stats/admin/reports
 * @desc Lấy báo cáo thống kê chi tiết cho Admin
 * @access Admin
 */
router.get("/admin/reports", requireRoles("ADMIN"), getAdminReportsSummary);

export default router;
