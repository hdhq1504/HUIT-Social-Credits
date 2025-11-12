import { Router } from "express";
import {
  getProgressSummary,
  getAdminDashboardOverview,
  getAdminReportsSummary
} from "../controllers/stats.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/progress", requireAuth, getProgressSummary);
router.get("/admin/dashboard", requireAuth, getAdminDashboardOverview);
router.get("/admin/reports", requireAuth, getAdminReportsSummary);

export default router;
