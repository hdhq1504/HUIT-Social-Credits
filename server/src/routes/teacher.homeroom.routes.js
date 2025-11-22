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
/**
 * @route GET /api/teacher/homeroom/my-classes
 * @desc Lấy danh sách lớp chủ nhiệm của tôi
 * @access GiangVien
 */
router.get("/my-classes", getMyClasses);

/**
 * @route GET /api/teacher/homeroom/classes/:classId/students
 * @desc Lấy danh sách sinh viên trong lớp chủ nhiệm
 * @access GiangVien
 */
router.get("/classes/:classId/students", getClassStudents);

/**
 * @route GET /api/teacher/homeroom/students/:studentId/scores
 * @desc Lấy điểm rèn luyện của sinh viên
 * @access GiangVien
 */
router.get("/students/:studentId/scores", getStudentScores);

export default router;
