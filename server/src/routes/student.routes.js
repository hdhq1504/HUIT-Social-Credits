import { Router } from "express";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getClassesByFaculty,
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
 * @route GET /api/students/classes/:khoaId
 * @desc Lấy danh sách lớp theo khoa
 * @access Admin
 */
router.get("/classes/:khoaId", getClassesByFaculty);

export default router;
