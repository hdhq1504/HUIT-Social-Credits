import { Router } from "express";
import { createBackup, restoreBackup } from "../controllers/system.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/backup", requireAuth, createBackup);
router.post("/restore", requireAuth, restoreBackup);

export default router;
