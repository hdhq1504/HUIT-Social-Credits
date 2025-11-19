import { Router } from "express";
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from "../controllers/user.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", requireRoles("ADMIN"), listUsers);
router.post("/", requireRoles("ADMIN"), createUser);
router.get("/:id", requireRoles("ADMIN"), getUserById);
router.put("/:id", requireRoles("ADMIN"), updateUser);
router.delete("/:id", requireRoles("ADMIN"), deleteUser);

export default router;
