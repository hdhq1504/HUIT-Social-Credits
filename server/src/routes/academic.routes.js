import { Router } from "express";
import {
  listAcademicYears,
  listSemesters,
  resolveAcademicPeriod,
  getNamHocs,
  createNamHoc,
  updateNamHoc,
  deleteNamHoc,
  activateNamHoc,
  getHocKys,
  createHocKy,
  updateHocKy,
  deleteHocKy
} from "../controllers/academic.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
/**
 * @route GET /api/academic/semesters
 * @desc Lấy danh sách năm học và học kỳ
 * @access Public
 */
router.get("/semesters", listSemesters);

/**
 * @route GET /api/academic/years
 * @desc Lấy danh sách năm học
 * @access Public
 */
router.get("/years", listAcademicYears);

/**
 * @route GET /api/academic/resolve
 * @desc Xác định học kỳ hiện tại dựa trên ngày
 * @access Public
 */
router.get("/resolve", resolveAcademicPeriod);

// Admin routes
router.use(requireAuth);
router.use(requireRoles("ADMIN"));

/**
 * @route GET /api/academic/admin/namhoc
 * @desc Lấy danh sách năm học (Admin CRUD)
 * @access Admin
 */
router.get("/admin/namhoc", getNamHocs);

/**
 * @route POST /api/academic/admin/namhoc
 * @desc Tạo năm học mới
 * @access Admin
 */
router.post("/admin/namhoc", createNamHoc);

/**
 * @route PUT /api/academic/admin/namhoc/:id
 * @desc Cập nhật năm học
 * @access Admin
 */
router.put("/admin/namhoc/:id", updateNamHoc);

/**
 * @route DELETE /api/academic/admin/namhoc/:id
 * @desc Xóa năm học
 * @access Admin
 */
router.delete("/admin/namhoc/:id", deleteNamHoc);

/**
 * @route PUT /api/academic/admin/namhoc/:id/activate
 * @desc Kích hoạt năm học
 * @access Admin
 */
router.put("/admin/namhoc/:id/activate", activateNamHoc);

/**
 * @route GET /api/academic/admin/namhoc/:namHocId/hocky
 * @desc Lấy danh sách học kỳ của năm học
 * @access Admin
 */
router.get("/admin/namhoc/:namHocId/hocky", getHocKys);

/**
 * @route POST /api/academic/admin/namhoc/:namHocId/hocky
 * @desc Tạo học kỳ mới
 * @access Admin
 */
router.post("/admin/namhoc/:namHocId/hocky", createHocKy);

/**
 * @route PUT /api/academic/admin/hocky/:id
 * @desc Cập nhật học kỳ
 * @access Admin
 */
router.put("/admin/hocky/:id", updateHocKy);

/**
 * @route DELETE /api/academic/admin/hocky/:id
 * @desc Xóa học kỳ
 * @access Admin
 */
router.delete("/admin/hocky/:id", deleteHocKy);

export default router;