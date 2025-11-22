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

/**
 * @route GET /api/admin/teachers
 * @desc Lấy danh sách giảng viên
 * @access Admin
 */
router.get("/", getTeachers);

/**
 * @route POST /api/admin/teachers/assign-homeroom
 * @desc Phân công chủ nhiệm
 * @access Admin
 */
router.post("/assign-homeroom", assignHomeroom);

/**
 * @route GET /api/admin/teachers/classes/available
 * @desc Lấy danh sách lớp học khả dụng cho phân công
 * @access Admin
 */
router.get("/classes/available", getAvailableClasses);

export default router;
