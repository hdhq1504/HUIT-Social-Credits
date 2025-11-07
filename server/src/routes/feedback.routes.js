import { Router } from "express";
import {
  decideFeedbackStatus,
  getFeedbackDetail,
  listFeedbacks
} from "../controllers/feedback.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listFeedbacks);
router.get("/:id", requireAuth, getFeedbackDetail);
router.post("/decision", requireAuth, decideFeedbackStatus);

export default router;