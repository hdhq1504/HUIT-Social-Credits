import { Router } from "express";
import {
  login,
  me,
  refresh,
  logout,
  changePassword,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPasswordWithOtp,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.post("/change-password", requireAuth, changePassword);
router.post("/forgot-password/request", requestPasswordReset);
router.post("/forgot-password/verify", verifyPasswordResetOtp);
router.post("/forgot-password/reset", resetPasswordWithOtp);

export default router;
