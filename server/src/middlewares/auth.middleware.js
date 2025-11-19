import { verifyAccessToken } from "../utils/jwt.js";

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

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const allowedRoles = roles.flat().filter(Boolean);
  if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
  }

  next();
};
