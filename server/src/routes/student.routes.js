import { Router } from "express";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getMajorsByFaculty,
  getClassesByMajor,
  getFaculties
} from "../controllers/student.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRoles("ADMIN"));

/**
 * @route GET /api/students
 * @desc Lấy danh sách sinh viên
 * @access Admin
 */
router.get("/", getStudents);

/**
 * @route POST /api/students
 * @desc Tạo sinh viên mới
 * @access Admin
 */
router.post("/", createStudent);

/**
 * @route PUT /api/students/:id
 * @desc Cập nhật thông tin sinh viên
 * @access Admin
 */
router.put("/:id", updateStudent);

/**
 * @route DELETE /api/students/:id
 * @desc Xóa sinh viên
 * @access Admin
 */
router.delete("/:id", deleteStudent);

/**
 * @route GET /api/students/faculties
 * @desc Lấy danh sách khoa
 * @access Admin
 */
router.get("/faculties", getFaculties);

/**
 * @route GET /api/students/faculties/:khoaId/majors
 * @desc Lấy danh sách ngành theo khoa
 * @access Admin
 */
router.get("/faculties/:khoaId/majors", getMajorsByFaculty);

/**
 * @route GET /api/students/majors/:nganhHocId/classes
 * @desc Lấy danh sách lớp theo ngành
 * @access Admin
 */
router.get("/majors/:nganhHocId/classes", getClassesByMajor);

export default router;
