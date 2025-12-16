import prisma from "../prisma.js";

// Chuyển đổi thông báo sang định dạng API
const mapNotification = (notification) => ({
  id: notification.id,
  title: notification.tieuDe,
  description: notification.noiDung,
  type: notification.loai || "info",
  isUnread: !notification.daDoc,
  createdAt: notification.createdAt?.toISOString() ?? null,
  readAt: notification.daDocLuc?.toISOString() ?? null,
  data: notification.duLieu ?? null
});

/**
 * Lấy danh sách thông báo của người dùng.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const listNotifications = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const rawLimit = Number(req.query?.limit);
  const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 20));

  const notifications = await prisma.thongBao.findMany({
    where: { nguoiDungId: userId },
    orderBy: { createdAt: "desc" },
    take: limit
  });

  res.json({ notifications: notifications.map(mapNotification) });
};

/**
 * Lấy số lượng thông báo chưa đọc.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getUnreadNotificationCount = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const count = await prisma.thongBao.count({
    where: { nguoiDungId: userId, daDoc: false }
  });

  res.json({ count });
};

/**
 * Đánh dấu tất cả thông báo là đã đọc.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const markAllNotificationsRead = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const now = new Date();
  const result = await prisma.thongBao.updateMany({
    where: { nguoiDungId: userId, daDoc: false },
    data: { daDoc: true, daDocLuc: now }
  });

  res.json({ updated: result.count });
};

export default {
  listNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead
};