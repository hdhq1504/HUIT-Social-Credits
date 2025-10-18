import { Router } from "express";
import {
  cancelActivityRegistration,
  getActivity,
  listActivities,
  registerForActivity
} from "../controllers/activity.controller.js";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", optionalAuth, listActivities);
router.get("/:id", optionalAuth, getActivity);
router.post("/:id/registrations", requireAuth, registerForActivity);
router.post("/:id/registrations/cancel", requireAuth, cancelActivityRegistration);

export default router;
