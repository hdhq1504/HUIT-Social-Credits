import { Router } from "express";
import { createBackup, restoreBackup } from "../controllers/system.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route GET /api/system/backup
 * @desc Tạo bản sao lưu hệ thống
 * @access Authenticated
 */
router.get("/backup", requireAuth, createBackup);

/**
 * @route POST /api/system/restore
 * @desc Khôi phục hệ thống từ bản sao lưu
 * @access Authenticated
 */
router.post("/restore", requireAuth, restoreBackup);

export default router;
