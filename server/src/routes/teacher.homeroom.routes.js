import { Router } from "express";
import {
  getMyClasses,
  getClassStudents,
  getStudentScores
} from "../controllers/teacher.homeroom.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("GIANGVIEN"));

// Teacher homeroom routes
router.get("/my-classes", getMyClasses);
router.get("/classes/:classId/students", getClassStudents);
router.get("/students/:studentId/scores", getStudentScores);

export default router;
