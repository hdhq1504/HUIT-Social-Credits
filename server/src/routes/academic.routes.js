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
router.get("/semesters", listSemesters);
router.get("/years", listAcademicYears);
router.get("/resolve", resolveAcademicPeriod);

// Admin routes
router.use(requireAuth);
router.use(requireRoles("ADMIN"));

router.get("/admin/namhoc", getNamHocs);
router.post("/admin/namhoc", createNamHoc);
router.put("/admin/namhoc/:id", updateNamHoc);
router.delete("/admin/namhoc/:id", deleteNamHoc);
router.put("/admin/namhoc/:id/activate", activateNamHoc);

router.get("/admin/namhoc/:namHocId/hocky", getHocKys);
router.post("/admin/namhoc/:namHocId/hocky", createHocKy);
router.put("/admin/hocky/:id", updateHocKy);
router.delete("/admin/hocky/:id", deleteHocKy);

export default router;