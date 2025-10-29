import prisma from "../prisma.js";
import { notifyUser } from "../utils/notification.service.js";
import { getPointGroupLabel, normalizePointGroup } from "../utils/points.js";

const ACTIVE_REG_STATUSES = ["DANG_KY", "DA_THAM_GIA"];
const REGISTRATION_STATUSES = ["DANG_KY", "DA_HUY", "DA_THAM_GIA", "VANG_MAT"];
const FEEDBACK_STATUSES = ["CHO_DUYET", "DA_DUYET", "BI_TU_CHOI"];

const USER_PUBLIC_FIELDS = {
  id: true,
  hoTen: true,
  email: true,
  avatarUrl: true
};

const ACTIVITY_INCLUDE = {
  dangKy: {
    where: { trangThai: { in: ACTIVE_REG_STATUSES } },
    include: {
      nguoiDung: {
        select: USER_PUBLIC_FIELDS
      }
    },
    orderBy: { dangKyLuc: "asc" }
  },
  danhMucRef: true
};

const REGISTRATION_INCLUDE = {
  phanHoi: true,
  diemDanhBoi: {
    select: {
      id: true,
      hoTen: true,
      email: true
    }
  },
  lichSuDiemDanh: {
    orderBy: { taoLuc: "desc" }
  }
};

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

const mapParticipants = (registrations = []) =>
  registrations
    .filter((reg) => reg.nguoiDung)
    .map((reg) => {
      const user = reg.nguoiDung;
      if (user.avatarUrl) {
        return { id: user.id, name: user.hoTen ?? user.email, src: user.avatarUrl };
      }
      return { id: user.id, name: user.hoTen ?? user.email ?? "Người dùng" };
    });

const normalizeAttachments = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

const MAX_ATTENDANCE_EVIDENCE_SIZE = 5_000_000;

const sanitizeOptionalText = (value, maxLength = 500) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
};

const sanitizeAttendanceEvidence = (value) => {
  if (!value || typeof value !== "object") {
    return { data: null, mimeType: null, fileName: null };
  }

  const rawData =
    typeof value.data === "string"
      ? value.data
      : typeof value.dataUrl === "string"
        ? value.dataUrl
        : null;
  const data = rawData?.trim();

  if (!data || data.length > MAX_ATTENDANCE_EVIDENCE_SIZE || !data.startsWith("data:")) {
    return { data: null, mimeType: null, fileName: null };
  }

  const mimeType = typeof value.mimeType === "string" ? value.mimeType.slice(0, 100) : null;
  const fileName = typeof value.fileName === "string" ? value.fileName.slice(0, 255) : null;

  return { data, mimeType, fileName };
};

const mapAttendanceEntry = (entry) => {
  if (!entry) return null;
  return {
    id: entry.id,
    status: entry.trangThai,
    note: entry.ghiChu ?? null,
    capturedAt: entry.taoLuc?.toISOString() ?? null,
    attachment: entry.anhDinhKem ?? null,
    attachmentMimeType: entry.anhMimeType ?? null,
    attachmentFileName: entry.anhTen ?? null
  };
};

const mapFeedback = (feedback) => {
  if (!feedback) return null;
  return {
    id: feedback.id,
    status: feedback.trangThai,
    content: feedback.noiDung,
    rating: feedback.danhGia ?? null,
    attachments: normalizeAttachments(feedback.minhChung),
    submittedAt: feedback.taoLuc?.toISOString() ?? null,
    updatedAt: feedback.capNhatLuc?.toISOString() ?? null
  };
};

const mapRegistration = (registration) => {
  if (!registration) return null;
  return {
    id: registration.id,
    activityId: registration.hoatDongId,
    userId: registration.nguoiDungId,
    status: registration.trangThai,
    note: registration.ghiChu ?? null,
    cancelReason: registration.lyDoHuy ?? null,
    registeredAt: registration.dangKyLuc?.toISOString() ?? null,
    approvedAt: registration.duyetLuc?.toISOString() ?? null,
    updatedAt: registration.updatedAt?.toISOString() ?? null,
    checkInAt: registration.diemDanhLuc?.toISOString() ?? null,
    checkInNote: registration.diemDanhGhiChu ?? null,
    checkInBy: registration.diemDanhBoi
      ? {
        id: registration.diemDanhBoi.id,
        name: registration.diemDanhBoi.hoTen ?? registration.diemDanhBoi.email ?? "Người dùng"
      }
      : null,
    attendanceHistory: (registration.lichSuDiemDanh ?? [])
      .map((entry) => mapAttendanceEntry(entry))
      .filter(Boolean),
    feedback: mapFeedback(registration.phanHoi)
  };
};

const determineState = (activity, registration) => {
  const start = toDate(activity?.batDauLuc);
  const end = toDate(activity?.ketThucLuc);
  const now = new Date();

  if (!registration) {
    if (end && end < now) return "ended";
    return "guest";
  }

  switch (registration.trangThai) {
    case "DANG_KY": {
      if (end && end < now) return "ended";
      if (start && start <= now && (!end || end >= now)) return "attendance_open";
      if (start && start > now) return "attendance_closed";
      return "registered";
    }
    case "DA_HUY":
      return "canceled";
    case "VANG_MAT":
      return "ended";
    case "DA_THAM_GIA": {
      const feedback = registration.phanHoi;
      if (!feedback) return "feedback_pending";
      switch (feedback.trangThai) {
        case "DA_DUYET":
          return "feedback_accepted";
        case "BI_TU_CHOI":
          return "feedback_denied";
        default:
          return "feedback_reviewing";
      }
    }
    default:
      return "guest";
  }
};

const mapActivity = (activity, registration) => {
  if (!activity) return null;

  const start = toDate(activity.batDauLuc);
  const end = toDate(activity.ketThucLuc);
  const activeRegistrations = activity.dangKy ?? [];
  const participants = mapParticipants(activeRegistrations).slice(0, 5);
  const registeredCount = activeRegistrations.length;
  const pointGroup = normalizePointGroup(activity.nhomDiem);
  const pointGroupLabel = getPointGroupLabel(pointGroup);
  const category = activity.danhMucRef;
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
    category: category?.ten ?? null,
    categoryCode: category?.ma ?? null,
    categoryDescription: category?.moTa ?? null,
    pointGroup,
    pointGroupLabel,
    isFeatured: activity.isFeatured,
    isPublished: activity.isPublished,
    state: determineState(activity, registration),
    registration: mapRegistration(registration)
  };
};

const buildActivityResponse = async (activityId, userId) => {
  const [activity, registration] = await Promise.all([
    prisma.hoatDong.findUnique({
      where: { id: activityId },
      include: ACTIVITY_INCLUDE
    }),
    userId
      ? prisma.dangKyHoatDong.findUnique({
        where: { nguoiDungId_hoatDongId: { nguoiDungId: userId, hoatDongId: activityId } },
        include: REGISTRATION_INCLUDE
      })
      : null
  ]);

  if (!activity) return null;
  return mapActivity(activity, registration);
};

const sanitizeStatusFilter = (value, allowed) => (allowed.includes(value) ? value : undefined);

export const listActivities = async (req, res) => {
  const currentUserId = req.user?.sub;
  const activities = await prisma.hoatDong.findMany({
    where: { isPublished: true },
    orderBy: [
      { batDauLuc: "asc" },
      { tieuDe: "asc" }
    ],
    include: ACTIVITY_INCLUDE
  });

  let registrationMap = new Map();
  if (currentUserId && activities.length) {
    const registrations = await prisma.dangKyHoatDong.findMany({
      where: {
        nguoiDungId: currentUserId,
        hoatDongId: { in: activities.map((activity) => activity.id) }
      },
      include: REGISTRATION_INCLUDE
    });
    registrationMap = new Map(registrations.map((registration) => [registration.hoatDongId, registration]));
  }

  res.json({
    activities: activities.map((activity) => mapActivity(activity, registrationMap.get(activity.id)))
  });
};

export const getActivity = async (req, res) => {
  const currentUserId = req.user?.sub;
  const activity = await buildActivityResponse(req.params.id, currentUserId);
  if (!activity) return res.status(404).json({ error: "Hoạt động không tồn tại" });
  res.json({ activity });
};

export const registerForActivity = async (req, res) => {
  const userId = req.user?.sub;
  const { id: activityId } = req.params;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.nguoiDung.findUnique({
    where: { id: userId },
    select: { id: true, email: true, hoTen: true }
  });
  if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

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
        dangKyLuc: new Date(),
        diemDanhLuc: null,
        diemDanhBoiId: null,
        diemDanhGhiChu: null
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

  const updated = await buildActivityResponse(activityId, userId);

  const scheduleLabel = formatDateRange(activity.batDauLuc, activity.ketThucLuc);
  const detailLines = [
    scheduleLabel ? `Thời gian: ${scheduleLabel}` : null,
    activity.diaDiem ? `Địa điểm: ${activity.diaDiem}` : null
  ];

  await notifyUser({
    userId,
    user,
    title: "Đăng ký hoạt động thành công",
    message: `Bạn đã đăng ký hoạt động "${activity.tieuDe}" thành công.`,
    type: "success",
    data: { activityId, action: "REGISTERED" },
    emailSubject: `[HUIT Social Credits] Xác nhận đăng ký hoạt động "${activity.tieuDe}"`,
    emailMessageLines: [
      `Bạn đã đăng ký hoạt động "${activity.tieuDe}" thành công.`,
      ...detailLines
    ]
  });

  res.status(201).json({
    message: "Đăng ký hoạt động thành công",
    activity: updated
  });
};

export const cancelActivityRegistration = async (req, res) => {
  const userId = req.user?.sub;
  const { id: activityId } = req.params;
  const { reason, note } = req.body || {};

  const user = await prisma.nguoiDung.findUnique({
    where: { id: userId },
    select: { id: true, email: true, hoTen: true }
  });
  if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

  const existing = await prisma.dangKyHoatDong.findUnique({
    where: { nguoiDungId_hoatDongId: { nguoiDungId: userId, hoatDongId: activityId } },
    include: { hoatDong: true }
  });

  if (!existing || existing.trangThai === "DA_HUY") {
    return res.status(404).json({ error: "Bạn chưa đăng ký hoạt động này hoặc đã hủy trước đó" });
  }

  const activity = existing.hoatDong;

  await prisma.dangKyHoatDong.update({
    where: { id: existing.id },
    data: {
      trangThai: "DA_HUY",
      lyDoHuy: reason ?? null,
      ghiChu: note ?? existing.ghiChu
    }
  });

  const updated = await buildActivityResponse(activityId, userId);

  if (activity) {
    const scheduleLabel = formatDateRange(activity.batDauLuc, activity.ketThucLuc);
    const detailLines = [
      scheduleLabel ? `Thời gian: ${scheduleLabel}` : null,
      activity.diaDiem ? `Địa điểm: ${activity.diaDiem}` : null,
      reason ? `Lý do hủy: ${String(reason).trim()}` : null
    ];

    await notifyUser({
      userId,
      user,
      title: "Bạn đã hủy đăng ký hoạt động",
      message: `Bạn đã hủy đăng ký hoạt động "${activity.tieuDe}".`,
      type: "warning",
      data: { activityId, action: "CANCELED" },
      emailSubject: `[HUIT Social Credits] Xác nhận hủy đăng ký hoạt động "${activity.tieuDe}"`,
      emailMessageLines: [
        `Bạn đã hủy đăng ký hoạt động "${activity.tieuDe}".`,
        ...detailLines
      ]
    });
  }

  res.json({
    message: "Hủy đăng ký thành công",
    activity: updated
  });
};

export const markAttendance = async (req, res) => {
  const userId = req.user?.sub;
  const { id: activityId } = req.params;
  const { note, status, evidence } = req.body || {};

  const user = await prisma.nguoiDung.findUnique({
    where: { id: userId },
    select: { id: true, email: true, hoTen: true }
  });
  if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

  const registration = await prisma.dangKyHoatDong.findUnique({
    where: { nguoiDungId_hoatDongId: { nguoiDungId: userId, hoatDongId: activityId } },
    include: {
      hoatDong: true
    }
  });

  if (!registration || registration.trangThai === "DA_HUY") {
    return res.status(404).json({ error: "Bạn chưa đăng ký hoạt động này hoặc đã hủy trước đó" });
  }

  const activity = registration.hoatDong;
  if (!activity) {
    return res.status(404).json({ error: "Hoạt động không tồn tại" });
  }

  const startTime = activity.batDauLuc ? new Date(activity.batDauLuc) : null;
  const endTime = activity.ketThucLuc ? new Date(activity.ketThucLuc) : null;
  const now = new Date();

  if (!startTime) {
    return res.status(400).json({ error: "Hoạt động chưa có thời gian bắt đầu, không thể điểm danh" });
  }

  if (now < startTime) {
    return res.status(400).json({ error: "Hoạt động chưa diễn ra, bạn không thể điểm danh" });
  }

  if (endTime && now > endTime) {
    return res.status(400).json({ error: "Hoạt động đã kết thúc, bạn không thể điểm danh" });
  }

  const nextStatus = status === "absent" ? "VANG_MAT" : "DA_THAM_GIA";
  const normalizedNote = sanitizeOptionalText(note);
  const sanitizedEvidence = sanitizeAttendanceEvidence(evidence);
  const attendanceTime = new Date();

  await prisma.$transaction([
    prisma.dangKyHoatDong.update({
      where: { id: registration.id },
      data: {
        trangThai: nextStatus,
        diemDanhLuc: attendanceTime,
        diemDanhGhiChu: normalizedNote,
        diemDanhBoiId: userId
      }
    }),
    prisma.diemDanhNguoiDung.create({
      data: {
        dangKyId: registration.id,
        nguoiDungId: userId,
        hoatDongId: activityId,
        trangThai: nextStatus,
        ghiChu: normalizedNote,
        anhDinhKem: sanitizedEvidence.data,
        anhMimeType: sanitizedEvidence.mimeType,
        anhTen: sanitizedEvidence.fileName
      }
    })
  ]);

  const updated = await buildActivityResponse(activityId, userId);
  const success = nextStatus === "DA_THAM_GIA";

  await notifyUser({
    userId,
    user,
    title: success ? "Điểm danh thành công" : "Đã ghi nhận vắng mặt",
    message: success
      ? `Điểm danh cho hoạt động "${activity.tieuDe}" đã được ghi nhận.`
      : `Bạn được ghi nhận vắng mặt cho hoạt động "${activity.tieuDe}".`,
    type: success ? "success" : "danger",
    data: { activityId, action: success ? "ATTENDED" : "ABSENT" },
    emailSubject: success
      ? `[HUIT Social Credits] Xác nhận điểm danh hoạt động "${activity.tieuDe}"`
      : `[HUIT Social Credits] Thông báo vắng mặt hoạt động "${activity.tieuDe}"`,
    emailMessageLines: [
      success
        ? `Điểm danh cho hoạt động "${activity.tieuDe}" đã được ghi nhận thành công.`
        : `Bạn được ghi nhận vắng mặt cho hoạt động "${activity.tieuDe}".`,
      normalizedNote ? `Ghi chú: ${normalizedNote}` : null
    ]
  });

  res.json({
    message: success ? "Điểm danh thành công" : "Đã ghi nhận vắng mặt",
    activity: updated
  });
};

export const submitActivityFeedback = async (req, res) => {
  const userId = req.user?.sub;
  const { id: activityId } = req.params;
  const { content, rating, attachments } = req.body || {};

  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: "Nội dung phản hồi không được bỏ trống" });
  }

  const user = await prisma.nguoiDung.findUnique({
    where: { id: userId },
    select: { id: true, email: true, hoTen: true }
  });
  if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

  const registration = await prisma.dangKyHoatDong.findUnique({
    where: { nguoiDungId_hoatDongId: { nguoiDungId: userId, hoatDongId: activityId } },
    include: { ...REGISTRATION_INCLUDE, hoatDong: true }
  });

  if (!registration || registration.trangThai === "DA_HUY") {
    return res.status(404).json({ error: "Bạn chưa đăng ký hoạt động này hoặc đã hủy trước đó" });
  }

  if (registration.trangThai !== "DA_THAM_GIA") {
    return res.status(400).json({ error: "Bạn cần tham gia hoạt động trước khi gửi phản hồi" });
  }

  const normalizedAttachments = Array.isArray(attachments)
    ? attachments.filter((item) => typeof item === "string" && item.trim()).slice(0, 10)
    : [];

  const normalizedRating = typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : null;
  const payload = {
    noiDung: String(content).trim(),
    danhGia: normalizedRating,
    minhChung: normalizedAttachments,
    trangThai: "CHO_DUYET"
  };

  let feedback;
  if (registration.phanHoi) {
    feedback = await prisma.phanHoiHoatDong.update({
      where: { id: registration.phanHoi.id },
      data: payload
    });
  } else {
    feedback = await prisma.phanHoiHoatDong.create({
      data: {
        ...payload,
        dangKyId: registration.id,
        nguoiDungId: userId,
        hoatDongId: activityId
      }
    });
  }

  const activity = await buildActivityResponse(activityId, userId);
  const activityTitle = activity?.title ?? registration.hoatDong?.tieuDe ?? "hoạt động";

  await notifyUser({
    userId,
    user,
    title: "Đã gửi phản hồi hoạt động",
    message: `Phản hồi của bạn cho hoạt động "${activityTitle}" đã được gửi thành công.`,
    type: "info",
    data: { activityId, action: "FEEDBACK_SUBMITTED", feedbackId: feedback.id },
    emailSubject: `[HUIT Social Credits] Xác nhận gửi phản hồi hoạt động "${activityTitle}"`,
    emailMessageLines: [
      `Phản hồi của bạn cho hoạt động "${activityTitle}" đã được gửi thành công.`,
      normalizedRating ? `Đánh giá: ${normalizedRating}/5` : null,
      normalizedAttachments.length ? `Số lượng minh chứng: ${normalizedAttachments.length}` : null
    ]
  });

  res.status(201).json({
    message: "Đã gửi phản hồi",
    feedback: mapFeedback(feedback),
    activity
  });
};

export const listMyActivities = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { status, feedbackStatus } = req.query || {};
  const normalizedStatus = status ? sanitizeStatusFilter(status, REGISTRATION_STATUSES) : undefined;
  const normalizedFeedback =
    feedbackStatus && feedbackStatus !== "ALL"
      ? feedbackStatus === "NONE"
        ? "NONE"
        : sanitizeStatusFilter(feedbackStatus, FEEDBACK_STATUSES)
      : undefined;

  const registrations = await prisma.dangKyHoatDong.findMany({
    where: {
      nguoiDungId: userId,
      ...(normalizedStatus ? { trangThai: normalizedStatus } : {})
    },
    include: {
      ...REGISTRATION_INCLUDE,
      hoatDong: {
        include: ACTIVITY_INCLUDE
      }
    },
    orderBy: [{ dangKyLuc: "desc" }]
  });

  const filtered = normalizedFeedback
    ? registrations.filter((registration) => {
      if (normalizedFeedback === "NONE") return !registration.phanHoi;
      return registration.phanHoi?.trangThai === normalizedFeedback;
    })
    : registrations;

  res.json({
    registrations: filtered.map((registration) => ({
      ...mapRegistration(registration),
      activity: mapActivity(registration.hoatDong, registration)
    }))
  });
};
