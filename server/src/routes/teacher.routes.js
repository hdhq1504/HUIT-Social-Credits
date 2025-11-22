import { Router } from "express";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("GIANGVIEN"));

// Placeholder for teacher specific routes
// /**
//  * @route GET /api/teacher/classes
//  * @desc Lấy danh sách lớp học của giảng viên
//  * @access GiangVien
//  */
// router.get("/classes", getTeacherClasses);

export default router;