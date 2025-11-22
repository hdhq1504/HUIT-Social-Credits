import nodemailer from "nodemailer";
import { env } from "../env.js";

let transporter = null;

const smtpPort = env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: smtpPort || 587,
    secure: typeof env.SMTP_SECURE === "boolean" ? env.SMTP_SECURE : (smtpPort === 465),
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
}

/**
 * Biến kiểm tra xem chức năng gửi email có được bật hay không.
 */
export const isEmailEnabled = Boolean(transporter);

/**
 * Gửi email.
 * @param {Object} params - Tham số gửi email.
 * @param {string|Array} params.to - Địa chỉ email người nhận.
 * @param {string} params.subject - Tiêu đề email.
 * @param {string} params.text - Nội dung email dạng text.
 * @param {string} params.html - Nội dung email dạng HTML.
 * @returns {Promise<Object>} Kết quả gửi email.
 */
export const sendMail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    return { accepted: [], rejected: [], pending: [], skipped: true };
  }

  const message = {
    from: env.SMTP_FROM || env.SMTP_USER,
    to,
    subject,
    text,
    html
  };

  return transporter.sendMail(message);
};

export default transporter;