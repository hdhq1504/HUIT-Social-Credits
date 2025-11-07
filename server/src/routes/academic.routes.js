import { Router } from "express";
import { listAcademicYears, listSemesters, resolveAcademicPeriod } from "../controllers/academic.controller.js";

const router = Router();

router.get("/semesters", listSemesters);
router.get("/years", listAcademicYears);
router.get("/resolve", resolveAcademicPeriod);

export default router;