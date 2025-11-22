import { Router } from "express";
import {
  listFeedbacks,
  getFeedbackDetail,
  decideFeedbackStatus
} from "../controllers/feedback.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route GET /api/feedback
 * @desc Lấy danh sách phản hồi
 * @access Admin, GiangVien
 */
router.get("/", requireAuth, requireRoles("ADMIN", "GIANGVIEN"), listFeedbacks);

/**
 * @route GET /api/feedback/:id
 * @desc Lấy chi tiết phản hồi
 * @access Admin, GiangVien
 */
router.get("/:id", requireAuth, requireRoles("ADMIN", "GIANGVIEN"), getFeedbackDetail);

/**
 * @route POST /api/feedback/decision
 * @desc Duyệt hoặc từ chối phản hồi
 * @access Admin, GiangVien
 */
router.post("/decision", requireAuth, requireRoles("ADMIN", "GIANGVIEN"), decideFeedbackStatus);

export default router;