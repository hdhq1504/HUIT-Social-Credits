import { Router } from "express";
import {
  listAcademicYears,
  listSemesters,
  resolveAcademicPeriod,
  updateAcademicYear,
  updateSemester,
} from "../controllers/academic.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/semesters", listSemesters);
router.get("/years", listAcademicYears);
router.get("/resolve", resolveAcademicPeriod);
router.patch("/years/:id", requireAuth, updateAcademicYear);
router.patch("/semesters/:id", requireAuth, updateSemester);

export default router;