import { Router } from "express";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("GIANGVIEN"));

// Placeholder for teacher specific routes
// router.get("/classes", getTeacherClasses);

export default router;