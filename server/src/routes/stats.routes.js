import { Router } from "express";
import {
  getProgressSummary,
  getAdminDashboardOverview,
  getAdminReportsSummary
} from "../controllers/stats.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/progress", requireRoles("SINHVIEN"), getProgressSummary);
router.get("/admin/dashboard", requireRoles("ADMIN"), getAdminDashboardOverview);
router.get("/admin/reports", requireRoles("ADMIN"), getAdminReportsSummary);

export default router;
