import bcrypt from "bcrypt";
import prisma from "../prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { env } from "../env.js";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/api/auth", // chỉ gửi cookie cho các route auth
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email và mật khẩu là bắt buộc" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return res.status(401).json({ error: "Thông tin đăng nhập không hợp lệ" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Thông tin đăng nhập không hợp lệ" });

  const payload = { sub: user.id, email: user.email, role: user.role, name: user.fullName };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user.id });

  res.cookie("refresh_token", refreshToken, cookieOpts);
  return res.json({ accessToken, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
};

export const me = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { id: true, email: true, fullName: true, role: true } });
  if (!user) return res.status(404).json({ error: "User không tồn tại" });
  res.json({ user });
};

export const refresh = async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: "Missing refresh token" });
  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) return res.status(401).json({ error: "User không hợp lệ" });

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role, name: user.fullName });
    res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: "Refresh token không hợp lệ" });
  }
};

export const logout = async (_req, res) => {
  res.clearCookie("refresh_token", { ...cookieOpts, maxAge: 0 });
  res.json({ message: "Đã đăng xuất" });
};
