import prisma from "../prisma.js";
import { env } from "../env.js";
import { isEmailEnabled, sendMail } from "./mailer.js";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const wrapParagraph = (content) =>
  `<p style="margin: 0 0 12px; font-family: Arial, sans-serif; line-height: 1.5;">${content}</p>`;

const buildEmailHtml = ({ greetingName, messageLines, footerLines }) => {
  const safeLines = (lines = []) =>
    lines
      .filter(Boolean)
      .map((line) => {
        if (typeof line === "object" && line !== null && typeof line.html === "string") {
          return wrapParagraph(line.html);
        }
        return wrapParagraph(escapeHtml(line));
      })
      .join("");

  return `
    <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Thông báo từ HUIT Social Credits</title>
        </head>
        <body style="margin:0;padding:24px;background-color:#f5f5f5;font-family:Arial,sans-serif;color:#1f2933;">
          <div style="max-width:520px;margin:0 auto;background-color:#ffffff;border-radius:12px;padding:24px;box-shadow:0 4px 12px rgba(15, 23, 42, 0.08);">
            <h2 style="margin-top:0;margin-bottom:16px;font-size:20px;color:#0f172a;">Xin chào ${escapeHtml(greetingName || "bạn")},</h2>
            ${safeLines(messageLines)}
            <hr style="margin:24px 0;border:0;border-top:1px solid #e2e8f0;" />
            ${safeLines(footerLines)}
            <p style="margin:0;color:#64748b;font-size:12px;">Bạn nhận được email này vì đã bật thông báo cho tài khoản HUIT Social Credits.</p>
          </div>
        </body>
      </html>
  `;
};

export const notifyUser = async ({
  userId,
  user,
  title,
  message,
  type = "info",
  data = null,
  emailSubject,
  emailText,
  emailHtml,
  emailMessageLines
}) => {
  if (!userId) return null;

  const notification = await prisma.thongBao.create({
    data: {
      nguoiDungId: userId,
      tieuDe: title,
      noiDung: message,
      loai: type,
      duLieu: data,
    },
  });

  let targetUser = user;
  if (!targetUser) {
    targetUser = await prisma.nguoiDung.findUnique({
      where: { id: userId },
      select: { email: true, hoTen: true }
    });
  }

  if (isEmailEnabled && targetUser?.email) {
    const subject = emailSubject || title || "Thông báo mới";
    const baseLines =
      Array.isArray(emailMessageLines) && emailMessageLines.length
        ? emailMessageLines.filter(Boolean)
        : [message].filter(Boolean);
    const text =
      emailText ||
      [...baseLines, env.APP_URL ? `Truy cập: ${env.APP_URL}` : null].filter(Boolean).join("\n");
    const appUrlLine =
      env.APP_URL
        ? {
          html: `Bạn có thể đăng nhập để xem chi tiết tại <a href="${escapeHtml(env.APP_URL)}" target="_blank" rel="noopener noreferrer">${escapeHtml(env.APP_URL)}</a>.`
        }
        : null;
    const html =
      emailHtml ||
      buildEmailHtml({
        greetingName: targetUser?.hoTen || targetUser?.email,
        messageLines: [...baseLines, appUrlLine],
        footerLines: ["Trân trọng,<br/>Ban quản trị HUIT Social Credits"]
      });

    try {
      await sendMail({ to: targetUser.email, subject, text, html });
    } catch (error) {
      if (env.NODE_ENV !== "production") {
        console.error("Không thể gửi email thông báo:", error);
      }
    }
  }

  return notification;
};

export default notifyUser;