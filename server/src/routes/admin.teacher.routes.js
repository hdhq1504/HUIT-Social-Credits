import { Router } from "express";
import {
  getTeachers,
  assignHomeroom,
  getAvailableClasses
} from "../controllers/teacher.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("ADMIN"));

router.get("/", getTeachers);
router.post("/assign-homeroom", assignHomeroom);
router.get("/classes/available", getAvailableClasses);

export default router;
