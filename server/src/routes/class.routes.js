import { Router } from "express";
import { listTeacherClasses, listClassFilters } from "../controllers/class.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/filters", listClassFilters);
router.get("/mine", listTeacherClasses);

export default router;
