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

router.get("/", getStudents);
router.post("/", createStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);
router.get("/faculties", getFaculties);
router.get("/classes/:khoaId", getClassesByFaculty);

export default router;
