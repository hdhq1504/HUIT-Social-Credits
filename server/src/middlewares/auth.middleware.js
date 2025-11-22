import { verifyAccessToken } from "../utils/jwt.js";

/**
 * Middleware yêu cầu xác thực (đăng nhập).
 * Kiểm tra token trong header Authorization.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = verifyAccessToken(token);
    req.user = { ...payload, id: payload.sub };
    next();
  } catch {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
}

/**
 * Middleware xác thực tùy chọn.
 * Nếu có token hợp lệ, gán thông tin user vào req.user.
 * Nếu không, req.user sẽ là undefined nhưng vẫn cho phép request đi tiếp.
 * @param {Object} req - Express request object.
 * @param {Object} _res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export function optionalAuth(req, _res, next) {
  req.user = undefined;
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.user = { ...payload, id: payload.sub };
  } catch {
    req.user = undefined;
  }
  next();
}

/**
 * Middleware yêu cầu quyền hạn (roles).
 * Kiểm tra xem user có một trong các role được phép hay không.
 * @param {...string} roles - Danh sách các role được phép.
 * @returns {Function} Express middleware function.
 */
export const requireRoles = (...roles) => (req, res, next) => {
  // First ensure user is authenticated
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = verifyAccessToken(token);
    req.user = { ...payload, id: payload.sub };
  } catch {
    return res.status(401).json({ error: "Token expired or invalid" });
  }

  // Then check role permissions
  if (!req.user || !req.user.role) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const allowedRoles = roles.flat().filter(Boolean);
  if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
  }

  next();
};
