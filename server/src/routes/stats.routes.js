import { Router } from "express";
import { getActivityCategories, getProgressSummary } from "../controllers/stats.controller.js";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/progress", requireAuth, getProgressSummary);
router.get("/categories", optionalAuth, getActivityCategories);

export default router;
