import { Router } from "express";
import { listUsers } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, listUsers);

export default router;
