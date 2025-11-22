import jwt from "jsonwebtoken";
import { env } from "../env.js";

/**
 * Tạo access token.
 * @param {Object} payload - Dữ liệu payload.
 * @returns {string} JWT access token.
 */
export const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRES });

/**
 * Tạo refresh token.
 * @param {Object} payload - Dữ liệu payload.
 * @returns {string} JWT refresh token.
 */
export const signRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES });

/**
 * Xác thực access token.
 * @param {string} token - JWT access token.
 * @returns {Object} Payload đã giải mã.
 * @throws {Error} Nếu token không hợp lệ hoặc hết hạn.
 */
export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET);

/**
 * Xác thực refresh token.
 * @param {string} token - JWT refresh token.
 * @returns {Object} Payload đã giải mã.
 * @throws {Error} Nếu token không hợp lệ hoặc hết hạn.
 */
export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET);
