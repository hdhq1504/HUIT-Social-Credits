import prisma from "../prisma.js";

const ACTIVE_REG_STATUSES = ["DANG_KY", "DA_THAM_GIA"];

const toDate = (value) => (value ? new Date(value) : null);

const formatDateRange = (start, end) => {
  if (!start && !end) return null;
  const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  if (!start) {
    const endDate = toDate(end);
    return `${timeFormatter.format(endDate)}, ${dateFormatter.format(endDate)}`;
  }

  const startDate = toDate(start);
  if (!end) {
    return `${timeFormatter.format(startDate)}, ${dateFormatter.format(startDate)}`;
  }

  const endDate = toDate(end);
  const sameDay = startDate.toDateString() === endDate.toDateString();
  const datePart = dateFormatter.format(startDate);
  const startTime = timeFormatter.format(startDate);
  const endTime = timeFormatter.format(endDate);
  return sameDay
    ? `${startTime} - ${endTime}, ${datePart}`
    : `${startTime}, ${datePart} - ${endTime}, ${dateFormatter.format(endDate)}`;
};

const mapParticipants = (registrations) =>
  registrations
    .filter((reg) => reg.nguoiDung)
    .map((reg) => {
      const user = reg.nguoiDung;
      if (user.avatarUrl) {
        return { id: user.id, name: user.hoTen ?? user.email, src: user.avatarUrl };
      }
      return { id: user.id, name: user.hoTen ?? user.email ?? "Người dùng" };
    });

const mapActivity = (activity, currentUserId) => {
  if (!activity) return null;

  const start = toDate(activity.batDauLuc);
  const end = toDate(activity.ketThucLuc);
  const activeRegistrations = activity.dangKy ?? [];
  const participants = mapParticipants(activeRegistrations).slice(0, 5);
  const registeredCount = activeRegistrations.length;
  const state = activeRegistrations.some((reg) => reg.nguoiDungId === currentUserId) ? "registered" : "guest";
  const capacityLabel =
    typeof activity.sucChuaToiDa === "number" && activity.sucChuaToiDa > 0
      ? `${Math.min(registeredCount, activity.sucChuaToiDa)}/${activity.sucChuaToiDa}`
      : `${registeredCount}`;

  return {
    id: activity.id,
    code: activity.maHoatDong,
    title: activity.tieuDe,
    description: activity.moTa,
    points: activity.diemCong,
    startTime: start?.toISOString() ?? null,
    endTime: end?.toISOString() ?? null,
    dateTime: formatDateRange(start, end),
    location: activity.diaDiem,
    participants,
    participantsCount: registeredCount,
    capacity: capacityLabel,
    maxCapacity: activity.sucChuaToiDa,
    coverImage: activity.hinhAnh,
    category: activity.danhMuc,
    isFeatured: activity.isFeatured,
    isPublished: activity.isPublished,
    state
  };
};

const activityWithRegistrations = (activityId, currentUserId) =>
  prisma.hoatDong.findUnique({
    where: { id: activityId },
    include: {
      dangKy: {
        where: { trangThai: { in: ACTIVE_REG_STATUSES } },
        include: {
          nguoiDung: {
            select: {
              id: true,
              hoTen: true,
              email: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { dangKyLuc: "asc" }
      }
    }
  }).then((activity) => mapActivity(activity, currentUserId));

export const listActivities = async (req, res) => {
  const currentUserId = req.user?.sub;
  const activities = await prisma.hoatDong.findMany({
    where: { isPublished: true },
    orderBy: [
      { batDauLuc: "asc" },
      { tieuDe: "asc" }
    ],
    include: {
      dangKy: {
        where: { trangThai: { in: ACTIVE_REG_STATUSES } },
        include: {
          nguoiDung: {
            select: {
              id: true,
              hoTen: true,
              email: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { dangKyLuc: "asc" }
      }
    }
  });

  res.json({
    activities: activities.map((activity) => mapActivity(activity, currentUserId))
  });
};

export const getActivity = async (req, res) => {
  const currentUserId = req.user?.sub;
  const activity = await activityWithRegistrations(req.params.id, currentUserId);
  if (!activity) return res.status(404).json({ error: "Hoạt động không tồn tại" });
  res.json({ activity });
};

export const registerForActivity = async (req, res) => {
  const userId = req.user?.sub;
  const { id: activityId } = req.params;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const activity = await prisma.hoatDong.findUnique({ where: { id: activityId, isPublished: true } });
  if (!activity) return res.status(404).json({ error: "Hoạt động không tồn tại" });

  const activeCount = await prisma.dangKyHoatDong.count({
    where: {
      hoatDongId: activityId,
      trangThai: { in: ACTIVE_REG_STATUSES }
    }
  });

  if (typeof activity.sucChuaToiDa === "number" && activity.sucChuaToiDa > 0 && activeCount >= activity.sucChuaToiDa) {
    return res.status(409).json({ error: "Hoạt động đã đủ số lượng" });
  }

  const existing = await prisma.dangKyHoatDong.findUnique({
    where: { nguoiDungId_hoatDongId: { nguoiDungId: userId, hoatDongId: activityId } }
  });

  if (existing && existing.trangThai !== "DA_HUY") {
    return res.status(409).json({ error: "Bạn đã đăng ký hoạt động này" });
  }

  if (existing) {
    await prisma.dangKyHoatDong.update({
      where: { id: existing.id },
      data: {
        trangThai: "DANG_KY",
        ghiChu: req.body?.note ?? existing.ghiChu,
        lyDoHuy: null,
        dangKyLuc: new Date()
      }
    });
  } else {
    await prisma.dangKyHoatDong.create({
      data: {
        nguoiDungId: userId,
        hoatDongId: activityId,
        ghiChu: req.body?.note ?? null
      }
    });
  }

  const updated = await activityWithRegistrations(activityId, userId);
  res.status(201).json({
    message: "Đăng ký hoạt động thành công",
    activity: updated
  });
};

export const cancelActivityRegistration = async (req, res) => {
  const userId = req.user?.sub;
  const { id: activityId } = req.params;
  const { reason, note } = req.body || {};

  const existing = await prisma.dangKyHoatDong.findUnique({
    where: { nguoiDungId_hoatDongId: { nguoiDungId: userId, hoatDongId: activityId } }
  });

  if (!existing || existing.trangThai === "DA_HUY") {
    return res.status(404).json({ error: "Bạn chưa đăng ký hoạt động này hoặc đã hủy trước đó" });
  }

  await prisma.dangKyHoatDong.update({
    where: { id: existing.id },
    data: {
      trangThai: "DA_HUY",
      lyDoHuy: reason ?? null,
      ghiChu: note ?? existing.ghiChu
    }
  });

  const updated = await activityWithRegistrations(activityId, userId);
  res.json({
    message: "Hủy đăng ký thành công",
    activity: updated
  });
};
