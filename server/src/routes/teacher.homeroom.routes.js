import { Router } from "express";
import {
  getMyClasses,
  getClassStudents,
  getStudentScores,
  exportClassScores
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
 * @desc Lấy điểm của sinh viên
 * @access GiangVien
 */
router.get("/students/:studentId/scores", getStudentScores);

/**
 * @route GET /api/teacher/homeroom/classes/:classId/export-scores
 * @desc Xuất danh sách điểm của lớp
 * @access GiangVien
 */
router.get("/classes/:classId/export-scores", exportClassScores);

export default router;
