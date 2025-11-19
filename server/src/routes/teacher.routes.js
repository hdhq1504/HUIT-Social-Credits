import { Router } from "express";
import { getMyClasses, getClassDetail, getClassStudents, getStudentPoints, exportClassReport } from "../controllser/teacher.controller.js";

const router = Router();
router.get("/classes", getMyClasses);
router.get("/classes/:classId", getClassDetail);
router.get("/classes/:classId/students", getClassStudents);
router.get("/classes/:classId/students/:studentId", getStudentPoints);
router.get("/classes/:classId/export", exportClassReport);

export default router;