import { Router } from "express";
import { getMyFaceProfile, upsertMyFaceProfile } from "../controllers/face-profile.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/me", getMyFaceProfile);
router.put("/me", upsertMyFaceProfile);

export default router;
