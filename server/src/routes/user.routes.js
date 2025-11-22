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

/**
 * @route GET /api/users
 * @desc Lấy danh sách người dùng
 * @access Admin
 */
router.get("/", requireRoles("ADMIN"), listUsers);

/**
 * @route POST /api/users
 * @desc Tạo người dùng mới
 * @access Admin
 */
router.post("/", requireRoles("ADMIN"), createUser);

/**
 * @route GET /api/users/:id
 * @desc Lấy thông tin chi tiết người dùng
 * @access Admin
 */
router.get("/:id", requireRoles("ADMIN"), getUserById);

/**
 * @route PUT /api/users/:id
 * @desc Cập nhật thông tin người dùng
 * @access Admin
 */
router.put("/:id", requireRoles("ADMIN"), updateUser);

/**
 * @route DELETE /api/users/:id
 * @desc Xóa người dùng
 * @access Admin
 */
router.delete("/:id", requireRoles("ADMIN"), deleteUser);

export default router;
