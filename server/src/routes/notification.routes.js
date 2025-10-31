import { Router } from "express";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listNotifications);
router.get("/unread-count", requireAuth, getUnreadNotificationCount);
router.post("/mark-all-read", requireAuth, markAllNotificationsRead);

export default router;