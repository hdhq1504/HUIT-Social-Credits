import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { env } from "../env.js";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const RESET_TOKEN_TTL_MINUTES = 15;

const buildForgotPasswordResponse = (message, otp) => {
  if (otp && env.NODE_ENV !== "production") {
    return { message, otp };
  }
  return { message };
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email và mật khẩu là bắt buộc" });

  const user = await prisma.nguoiDung.findUnique({ where: { email } });
  if (!user || !user.isActive) return res.status(401).json({ error: "Thông tin đăng nhập không hợp lệ" });

  const ok = await bcrypt.compare(password, user.matKhau);
  if (!ok) return res.status(401).json({ error: "Thông tin đăng nhập không hợp lệ" });

  const payload = { sub: user.id, email: user.email, role: user.vaiTro, name: user.hoTen };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user.id });

  res.cookie("refresh_token", refreshToken, cookieOpts);
  return res.json({
    accessToken,
    user: { id: user.id, email: user.email, fullName: user.hoTen, role: user.vaiTro, studentId: user.maSV, dateOfBirth: user.ngaySinh, phone: user.soDT }
  });
};

export const me = async (req, res) => {
  const user = await prisma.nguoiDung.findUnique({
    where: { id: req.user.sub },
    select: {
      id: true,
      email: true,
      hoTen: true,
      vaiTro: true,
      maSV: true,
      ngaySinh: true,
      soDT: true,
      gioiTinh: true,
      maLop: true,
      maKhoa: true,
      avatarUrl: true
    }
  });
  if (!user) return res.status(404).json({ error: "User không tồn tại" });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.hoTen,
      role: user.vaiTro,
      studentCode: user.maSV,
      dateOfBirth: user.ngaySinh,
      phoneNumber: user.soDT,
      gender: user.gioiTinh,
      classCode: user.maLop,
      departmentCode: user.maKhoa,
      avatarUrl: user.avatarUrl
    }
  });
};

export const refresh = async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: "Missing refresh token" });
  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.nguoiDung.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) return res.status(401).json({ error: "User không hợp lệ" });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.vaiTro,
      name: user.hoTen
    });
    res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: "Refresh token không hợp lệ" });
  }
};

export const logout = async (_req, res) => {
  res.clearCookie("refresh_token", { ...cookieOpts, maxAge: 0 });
  res.json({ message: "Đã đăng xuất" });
};

export const requestPasswordReset = async (req, res) => {
  const email = req.body?.email?.trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: "Vui lòng cung cấp email" });
  }

  const user = await prisma.nguoiDung.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(404).json({ error: "Không tìm thấy tài khoản với email này" });
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await prisma.nguoiDung.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedOtp,
      resetPasswordTokenExpiresAt: expiresAt,
    },
  });

  return res.json(
    buildForgotPasswordResponse(
      `Mã xác nhận đã được gửi tới ${email}. Mã có hiệu lực trong ${RESET_TOKEN_TTL_MINUTES} phút.`,
      otp
    )
  );
};

export const verifyPasswordResetOtp = async (req, res) => {
  const email = req.body?.email?.trim().toLowerCase();
  const otp = req.body?.otp?.trim();

  if (!email || !otp) {
    return res.status(400).json({ error: "Vui lòng cung cấp email và mã xác nhận" });
  }

  const user = await prisma.nguoiDung.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(404).json({ error: "Không tìm thấy tài khoản với email này" });
  }

  if (!user.resetPasswordToken || !user.resetPasswordTokenExpiresAt) {
    return res.status(400).json({ error: "Mã xác nhận không hợp lệ hoặc đã hết hạn" });
  }

  if (user.resetPasswordTokenExpiresAt < new Date()) {
    return res.status(400).json({ error: "Mã xác nhận đã hết hạn" });
  }

  const isValid = await bcrypt.compare(otp, user.resetPasswordToken);
  if (!isValid) {
    return res.status(400).json({ error: "Mã xác nhận không đúng" });
  }

  return res.json({ message: "Mã xác nhận hợp lệ" });
};

export const resetPasswordWithOtp = async (req, res) => {
  const email = req.body?.email?.trim().toLowerCase();
  const otp = req.body?.otp?.trim();
  const newPassword = req.body?.newPassword;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: "Vui lòng cung cấp email, mã xác nhận và mật khẩu mới" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 8 ký tự" });
  }

  const user = await prisma.nguoiDung.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(404).json({ error: "Không tìm thấy tài khoản với email này" });
  }

  if (!user.resetPasswordToken || !user.resetPasswordTokenExpiresAt) {
    return res.status(400).json({ error: "Mã xác nhận không hợp lệ hoặc đã hết hạn" });
  }

  if (user.resetPasswordTokenExpiresAt < new Date()) {
    return res.status(400).json({ error: "Mã xác nhận đã hết hạn" });
  }

  const isValid = await bcrypt.compare(otp, user.resetPasswordToken);
  if (!isValid) {
    return res.status(400).json({ error: "Mã xác nhận không đúng" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.nguoiDung.update({
    where: { id: user.id },
    data: {
      matKhau: hashedPassword,
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
    },
  });

  return res.json({ message: "Đặt lại mật khẩu thành công" });
};

export const changePassword = async (req, res) => {
  const userId = req.user?.sub;
  const { currentPassword, newPassword } = req.body || {};

  if (!userId) {
    return res.status(401).json({ error: "Không được phép" });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Mật khẩu mới phải có ít nhất 8 ký tự" });
  }

  const user = await prisma.nguoiDung.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ error: "Người dùng không tồn tại" });
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.matKhau);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({ error: "Mật khẩu hiện tại không đúng" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.nguoiDung.update({
    where: { id: userId },
    data: { matKhau: hashedPassword },
  });

  return res.json({ message: "Đổi mật khẩu thành công" });
};
