import express from "express";
import {
  listStudentsCertifications,
  exportCertificationPdf,
  exportCertificationExcel,
} from "../controllers/council.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get list of students with certification eligibility
/**
 * @route GET /api/council/students
 * @desc Lấy danh sách sinh viên đủ điều kiện cấp chứng nhận
 * @access Manager (Admin, GiangVien)
 */
router.get("/students", listStudentsCertifications);

// Export as PDF
/**
 * @route GET /api/council/export/pdf
 * @desc Xuất danh sách chứng nhận ra file PDF
 * @access Manager (Admin, GiangVien)
 */
router.get("/export/pdf", exportCertificationPdf);

// Export as Excel
/**
 * @route GET /api/council/export/excel
 * @desc Xuất danh sách chứng nhận ra file Excel
 * @access Manager (Admin, GiangVien)
 */
router.get("/export/excel", exportCertificationExcel);

export default router;
