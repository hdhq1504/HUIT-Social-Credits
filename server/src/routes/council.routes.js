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
router.get("/students", listStudentsCertifications);

// Export as PDF
router.get("/export/pdf", exportCertificationPdf);

// Export as Excel
router.get("/export/excel", exportCertificationExcel);

export default router;
