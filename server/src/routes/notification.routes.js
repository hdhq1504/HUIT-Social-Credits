import { Router } from "express";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route GET /api/notifications
 * @desc Lấy danh sách thông báo
 * @access Authenticated
 */
router.get("/", requireAuth, listNotifications);

/**
 * @route GET /api/notifications/unread-count
 * @desc Lấy số lượng thông báo chưa đọc
 * @access Authenticated
 */
router.get("/unread-count", requireAuth, getUnreadNotificationCount);

/**
 * @route POST /api/notifications/mark-all-read
 * @desc Đánh dấu tất cả thông báo là đã đọc
 * @access Authenticated
 */
router.post("/mark-all-read", requireAuth, markAllNotificationsRead);

export default router;