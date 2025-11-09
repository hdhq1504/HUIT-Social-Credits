import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getFaceProfileStatus,
  registerFaceProfile
} from "../controllers/faceRecognition.controller.js";

const router = Router();

router.get("/profile", requireAuth, getFaceProfileStatus);
router.post("/register", requireAuth, registerFaceProfile);

export default router;
