import { Router } from "express";
import { getMyFaceProfile, upsertMyFaceProfile } from "../controllers/face-profile.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
/**
 * @route GET /api/face-profile/me
 * @desc Lấy thông tin hồ sơ khuôn mặt của tôi
 * @access Authenticated
 */
router.get("/me", getMyFaceProfile);

/**
 * @route PUT /api/face-profile/me
 * @desc Cập nhật hồ sơ khuôn mặt của tôi
 * @access Authenticated
 */
router.put("/me", upsertMyFaceProfile);

export default router;
