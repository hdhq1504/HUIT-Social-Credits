import { Router } from "express";
import {
  addCouncilMembers,
  createCouncil,
  exportCouncilDataset,
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
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/eligible-members", searchEligibleMembers);
router.get("/", listCouncils);
router.post("/", createCouncil);
router.get("/:id", getCouncilById);
router.put("/:id", updateCouncil);
router.post("/:id/members", addCouncilMembers);
router.delete("/:id/members/:memberId", removeCouncilMember);
router.post("/:id/students/import", importCouncilStudents);
router.get("/:id/students", listCouncilStudents);
router.patch("/:id/students/:evaluationId", updateCouncilStudent);
router.post("/:id/finalize", finalizeCouncil);
router.get("/:id/export", exportCouncilReport);
router.get("/:id/export-data", exportCouncilDataset);

export default router;