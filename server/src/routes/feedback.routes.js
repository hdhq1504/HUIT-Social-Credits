import { Router } from "express";
import {
  listFeedbacks,
  getFeedbackDetail,
  decideFeedbackStatus
} from "../controllers/feedback.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, requireRoles("ADMIN", "GIANGVIEN"), listFeedbacks);
router.get("/:id", requireAuth, requireRoles("ADMIN", "GIANGVIEN"), getFeedbackDetail);
router.post("/decision", requireAuth, requireRoles("ADMIN", "GIANGVIEN"), decideFeedbackStatus);

export default router;