import { Router } from "express";
import {
  addCouncilMembers,
  createCouncil,
  exportCouncilReport,
  finalizeCouncil,
  getCouncilById,
  importCouncilStudents,
  listCouncilStudents,
  listCouncils,
  removeCouncilMember,
  searchEligibleMembers,
  updateCouncil,
  updateCouncilStudent,
} from "../controllers/council.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/eligible-members", requireRoles("ADMIN"), searchEligibleMembers);
router.get("/", requireRoles("ADMIN", "GIANGVIEN"), listCouncils);
router.post("/", requireRoles("ADMIN"), createCouncil);
router.get("/:id", requireRoles("ADMIN", "GIANGVIEN"), getCouncilById);
router.put("/:id", requireRoles("ADMIN"), updateCouncil);
router.post("/:id/members", requireRoles("ADMIN"), addCouncilMembers);
router.delete("/:id/members/:memberId", requireRoles("ADMIN"), removeCouncilMember);
router.post("/:id/students/import", requireRoles("ADMIN"), importCouncilStudents);
router.get("/:id/students", requireRoles("ADMIN", "GIANGVIEN"), listCouncilStudents);
router.patch("/:id/students/:evaluationId", requireRoles("ADMIN", "GIANGVIEN"), updateCouncilStudent);
router.post("/:id/finalize", requireRoles("ADMIN"), finalizeCouncil);
router.get("/:id/export", requireRoles("ADMIN"), exportCouncilReport);

export default router;