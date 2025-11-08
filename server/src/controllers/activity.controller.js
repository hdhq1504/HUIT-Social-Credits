import sanitizeHtml from "sanitize-html";
import prisma from "../prisma.js";
import { notifyUser } from "../utils/notification.service.js";
import { getPointGroupLabel, normalizePointGroup, isValidPointGroup } from "../utils/points.js";
import { deriveSemesterInfo, resolveAcademicPeriodForDate } from "../utils/academic.js";
import {
  getAttendanceMethodLabel,
  getDefaultAttendanceMethod,
  mapAttendanceMethodToApi,
  normalizeAttendanceMethod
} from "../utils/attendance.js";

const normalizeSemesterLabel = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  switch (trimmed.toUpperCase()) {
    case "HK1":
      return "Học kỳ 1";
    case "HK2":
      return "Học kỳ 2";
    case "HK3":
      return "Học kỳ 3";
    default:
      return trimmed;
  }
};

const normalizeAcademicYearLabel = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value?.ten === "string" && value.ten.trim()) {
    return value.ten.trim();
  }
  if (typeof value?.nienKhoa === "string" && value.nienKhoa.trim()) {
    return value.nienKhoa.trim();
  }
  if (typeof value?.ma === "string" && value.ma.trim()) {
    return value.ma.trim();
  }

  return null;
};

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
  hocKyRef: {
    include: {
      namHoc: true
    }
  },
  namHocRef: true
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

const sanitizeStringArray = (value, maxLength = 500) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => sanitizeOptionalText(item, maxLength))
    .filter((item) => typeof item === "string" && item.length > 0);
};

const RICH_TEXT_ALLOWED_TAGS = Array.from(
  new Set([
    ...sanitizeHtml.defaults.allowedTags,
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "img",
    "figure",
    "figcaption",
    "span",
    "p"
  ])
);

const RICH_TEXT_ALLOWED_ATTRIBUTES = {
  ...sanitizeHtml.defaults.allowedAttributes,
  a: ["href", "name", "target", "rel", "class"],
  img: ["src", "alt", "title", "width", "height", "style", "class"],
  span: ["style", "class"],
  p: ["style", "class"],
  div: ["style", "class"],
  ol: ["class"],
  ul: ["class"],
  li: ["class"],
  h1: ["class"],
  h2: ["class"],
  h3: ["class"],
  h4: ["class"],
  h5: ["class"],
  h6: ["class"]
};

const sanitizeRichText = (value, maxLength = 20_000) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const limited = trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
  return sanitizeHtml(limited, {
    allowedTags: RICH_TEXT_ALLOWED_TAGS,
    allowedAttributes: RICH_TEXT_ALLOWED_ATTRIBUTES,
    allowedSchemesByTag: {
      img: ["data", "http", "https"]
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" })
    }
  });
};

const sanitizePoints = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
};

const sanitizeCapacity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
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
    phase: entry.loai === "CHECKOUT" ? "checkout" : "checkin",
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
    rejectedReason: feedback.lyDoTuChoi ?? null,
    submittedAt: feedback.taoLuc?.toISOString() ?? null,
    updatedAt: feedback.capNhatLuc?.toISOString() ?? null
  };
};

const computeCheckoutAvailableAt = (activity) => {
  if (!activity) return null;
  const end = toDate(activity.ketThucLuc);
  if (!end) return null;
  const threshold = new Date(end.getTime() - 10 * 60 * 1000);
  return threshold.toISOString();
};

const computeFeedbackAvailableAt = (activity, registration) => {
  const end = toDate(activity?.ketThucLuc);
  const participationTime = registration?.diemDanhLuc
    ? new Date(registration.diemDanhLuc)
    : end || toDate(activity?.batDauLuc) || new Date();
  // const available = new Date(participationTime.getTime() + 48 * 60 * 60 * 1000);
  const available = participationTime;
  return available.toISOString();
};

const mapRegistration = (registration, activity) => {
  if (!registration) return null;
  const attendanceHistory = (registration.lichSuDiemDanh ?? [])
    .map((entry) => mapAttendanceEntry(entry))
    .filter(Boolean);
  const hasCheckin = attendanceHistory.some((entry) => entry.phase === "checkin");
  const hasCheckout = attendanceHistory.some((entry) => entry.phase === "checkout");
  const checkoutAvailableAt = computeCheckoutAvailableAt(activity);
  const feedbackAvailableAt = computeFeedbackAvailableAt(activity, registration);
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
    attendanceHistory,
    attendanceSummary: {
      hasCheckin,
      hasCheckout,
      nextPhase: !hasCheckin ? "checkin" : !hasCheckout ? "checkout" : null,
      checkoutAvailableAt,
      feedbackAvailableAt
    },
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
      const history = registration.lichSuDiemDanh ?? [];
      const hasCheckin = history.some((entry) => entry.loai === "CHECKIN");
      const hasCheckout = history.some((entry) => entry.loai === "CHECKOUT");
      if (end && end < now) return "ended";
      if (start && start <= now && (!end || end >= now)) {
        if (!hasCheckin) return "confirm_in";
        if (!hasCheckout) return "confirm_out";
        return "attendance_open";
      }
      if (start && start > now) return "attendance_closed";
      return "registered";
    }
    case "DA_HUY":
      return "canceled";
    case "VANG_MAT":
      return "absent";
    case "DA_THAM_GIA": {
      const feedback = registration.phanHoi;
      if (!feedback) {
        const feedbackAvailableAt = computeFeedbackAvailableAt(activity, registration);
        const availableAt = feedbackAvailableAt ? new Date(feedbackAvailableAt) : null;
        if (availableAt && now < availableAt) {
          return "feedback_waiting";
        }
        return "feedback_pending";
      }
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
  const semesterRef = activity.hocKyRef ?? null;
  const academicYearRef = semesterRef?.namHoc ?? activity.namHocRef ?? null;
  const defaultAttendanceMethod = getDefaultAttendanceMethod();
  const attendanceSource = activity.phuongThucDiemDanh || defaultAttendanceMethod;
  const attendanceMethod =
    mapAttendanceMethodToApi(attendanceSource) || mapAttendanceMethodToApi(defaultAttendanceMethod);
  const attendanceMethodLabel =
    getAttendanceMethodLabel(attendanceMethod) ||
    getAttendanceMethodLabel(mapAttendanceMethodToApi(defaultAttendanceMethod));
  const storedSemester = normalizeSemesterLabel(semesterRef?.ten);
  const storedAcademicYear = normalizeAcademicYearLabel(academicYearRef);
  const fallbackSemesterInfo = deriveSemesterInfo(activity.batDauLuc ?? activity.ketThucLuc);
  const semesterLabel = storedSemester ?? fallbackSemesterInfo.semester ?? null;
  const academicYearLabel = storedAcademicYear ?? fallbackSemesterInfo.academicYear ?? null;
  const capacityLabel =
    typeof activity.sucChuaToiDa === "number" && activity.sucChuaToiDa > 0
      ? `${Math.min(registeredCount, activity.sucChuaToiDa)}/${activity.sucChuaToiDa}`
      : `${registeredCount}`;

  return {
    id: activity.id,
    code: null,
    title: activity.tieuDe,
    description: activity.moTa,
    requirements: Array.isArray(activity.yeuCau) ? activity.yeuCau : [],
    guidelines: Array.isArray(activity.huongDan) ? activity.huongDan : [],
    points: activity.diemCong,
    startTime: start?.toISOString() ?? null,
    endTime: end?.toISOString() ?? null,
    dateTime: formatDateRange(start, end),
    createdAt: activity.createdAt?.toISOString() ?? null,
    location: activity.diaDiem,
    participants,
    participantsCount: registeredCount,
    capacity: capacityLabel,
    maxCapacity: activity.sucChuaToiDa,
    coverImage: activity.hinhAnh,
    pointGroup,
    pointGroupLabel,
    isFeatured: activity.isFeatured,
    isPublished: activity.isPublished,
    semester: semesterLabel,
    academicYear: academicYearLabel,
    semesterId: semesterRef?.id ?? null,
    academicYearId: academicYearRef?.id ?? null,
    semesterStartDate: semesterRef?.batDau?.toISOString() ?? null,
    semesterEndDate: semesterRef?.ketThuc?.toISOString() ?? null,
    academicYearStartDate: academicYearRef?.batDau?.toISOString() ?? null,
    academicYearEndDate: academicYearRef?.ketThuc?.toISOString() ?? null,
    attendanceMethod,
    attendanceMethodLabel,
    registrationDeadline: activity.hanDangKy?.toISOString() ?? null,
    cancellationDeadline: activity.hanHuyDangKy?.toISOString() ?? null,
    state: determineState(activity, registration),
    registration: mapRegistration(registration, activity)
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

  const { limit, sort, search, pointGroup } = req.query || {};
  const take = limit ? parseInt(limit, 10) : undefined;
  let orderBy = [{ batDauLuc: 'asc' }, { tieuDe: 'asc' }];

  if (sort === 'createdAt:desc') {
    orderBy = [{ createdAt: 'desc' }];
  }

  const searchTerm = sanitizeOptionalText(search, 100);
  const normalizedPointGroup = isValidPointGroup(pointGroup) ? pointGroup : undefined;

  const where = {
    isPublished: true,
    ...(normalizedPointGroup ? { nhomDiem: normalizedPointGroup } : {}),
    ...(searchTerm
      ? {
        OR: [
          { tieuDe: { contains: searchTerm, mode: 'insensitive' } },
          { diaDiem: { contains: searchTerm, mode: 'insensitive' } },
        ],
      }
      : {}),
  };

  const activities = await prisma.hoatDong.findMany({
    where,
    orderBy,
    take,
    include: ACTIVITY_INCLUDE,
  });

  let registrationMap = new Map();
  if (currentUserId && activities.length) {
    const registrations = await prisma.dangKyHoatDong.findMany({
      where: {
        nguoiDungId: currentUserId,
        hoatDongId: { in: activities.map((activity) => activity.id) },
      },
      include: REGISTRATION_INCLUDE,
    });
    registrationMap = new Map(registrations.map((registration) => [registration.hoatDongId, registration]));
  }

  res.json({
    activities: activities.map((activity) => mapActivity(activity, registrationMap.get(activity.id))),
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
  const { note, status, evidence, phase } = req.body || {};

  const user = await prisma.nguoiDung.findUnique({
    where: { id: userId },
    select: { id: true, email: true, hoTen: true }
  });
  if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

  const registration = await prisma.dangKyHoatDong.findUnique({
    where: { nguoiDungId_hoatDongId: { nguoiDungId: userId, hoatDongId: activityId } },
    include: {
      hoatDong: true,
      lichSuDiemDanh: true
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

  const normalizedPhase = typeof phase === "string" && phase.toLowerCase() === "checkout" ? "checkout" : "checkin";
  const isCheckout = normalizedPhase === "checkout";

  const history = registration.lichSuDiemDanh ?? [];
  const hasCheckin = history.some((entry) => entry.loai === "CHECKIN");
  const hasCheckout = history.some((entry) => entry.loai === "CHECKOUT");

  if (!isCheckout && hasCheckin) {
    return res.status(409).json({ error: "Bạn đã điểm danh đầu giờ cho hoạt động này" });
  }

  if (isCheckout && !hasCheckin) {
    return res.status(400).json({ error: "Bạn cần điểm danh đầu giờ trước khi điểm danh cuối giờ" });
  }

  if (isCheckout && hasCheckout) {
    return res.status(409).json({ error: "Bạn đã điểm danh cuối giờ cho hoạt động này" });
  }

  const nextStatus = status === "absent" && isCheckout ? "VANG_MAT" : "DA_THAM_GIA";
  const normalizedNote = sanitizeOptionalText(note);
  const sanitizedEvidence = sanitizeAttendanceEvidence(evidence);
  const attendanceTime = new Date();

  const registrationUpdate = {
    diemDanhLuc: attendanceTime,
    diemDanhGhiChu: normalizedNote,
    diemDanhBoiId: userId
  };
  if (isCheckout) {
    registrationUpdate.trangThai = nextStatus;
  }

  await prisma.$transaction([
    prisma.dangKyHoatDong.update({
      where: { id: registration.id },
      data: registrationUpdate
    }),
    prisma.diemDanhNguoiDung.create({
      data: {
        dangKyId: registration.id,
        nguoiDungId: userId,
        hoatDongId: activityId,
        trangThai: isCheckout ? nextStatus : "DANG_KY",
        loai: isCheckout ? "CHECKOUT" : "CHECKIN",
        ghiChu: normalizedNote,
        anhDinhKem: sanitizedEvidence.data,
        anhMimeType: sanitizedEvidence.mimeType,
        anhTen: sanitizedEvidence.fileName
      }
    })
  ]);

  const updated = await buildActivityResponse(activityId, userId);
  const success = isCheckout && nextStatus === "DA_THAM_GIA";

  const notificationTitle = isCheckout
    ? success
      ? "Điểm danh thành công"
      : "Đã ghi nhận vắng mặt"
    : "Đã ghi nhận điểm danh đầu giờ";
  const notificationMessage = isCheckout
    ? success
      ? `Điểm danh cho hoạt động "${activity.tieuDe}" đã được ghi nhận.`
      : `Bạn được ghi nhận vắng mặt cho hoạt động "${activity.tieuDe}".`
    : `Điểm danh đầu giờ cho hoạt động "${activity.tieuDe}" đã được ghi nhận.`;
  const notificationType = isCheckout ? (success ? "success" : "danger") : "info";
  const notificationAction = isCheckout ? (success ? "ATTENDED" : "ABSENT") : "CHECKIN";
  const emailSubject = isCheckout
    ? success
      ? `[HUIT Social Credits] Xác nhận điểm danh hoạt động "${activity.tieuDe}"`
      : `[HUIT Social Credits] Thông báo vắng mặt hoạt động "${activity.tieuDe}"`
    : `[HUIT Social Credits] Xác nhận điểm danh đầu giờ hoạt động "${activity.tieuDe}"`;
  const emailMessageLines = isCheckout
    ? [
      success
        ? `Điểm danh cho hoạt động "${activity.tieuDe}" đã được ghi nhận thành công.`
        : `Bạn được ghi nhận vắng mặt cho hoạt động "${activity.tieuDe}".`,
      normalizedNote ? `Ghi chú: ${normalizedNote}` : null
    ]
    : [
      `Điểm danh đầu giờ cho hoạt động "${activity.tieuDe}" đã được ghi nhận thành công.`,
      normalizedNote ? `Ghi chú: ${normalizedNote}` : null
    ];

  await notifyUser({
    userId,
    user,
    title: notificationTitle,
    message: notificationMessage,
    type: notificationType,
    data: { activityId, action: notificationAction },
    emailSubject,
    emailMessageLines
  });

  res.json({
    message: isCheckout
      ? success
        ? "Điểm danh cuối giờ thành công"
        : "Đã ghi nhận vắng mặt"
      : "Điểm danh đầu giờ thành công",
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
    trangThai: "CHO_DUYET",
    lydoTuChoi: null,
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

export const createActivity = async (req, res) => {
  const {
    tieuDe,
    nhomDiem,
    diemCong,
    diaDiem,
    sucChuaToiDa,
    moTa,
    yeuCau,
    huongDan,
    batDauLuc,
    ketThucLuc,
    attendanceMethod,
    registrationDeadline,
    cancellationDeadline,
  } = req.body;

  const normalizedTitle = sanitizeOptionalText(tieuDe, 255);
  if (!normalizedTitle) {
    return res.status(400).json({ error: "Trường 'tieuDe' (Tên hoạt động) là bắt buộc" });
  }
  if (!nhomDiem) {
    return res.status(400).json({ error: "Trường 'nhomDiem' (Nhóm hoạt động) là bắt buộc" });
  }
  if (!isValidPointGroup(nhomDiem)) {
    return res.status(400).json({ error: "Giá trị 'nhomDiem' không hợp lệ" });
  }

  try {
    const startTime = batDauLuc ? toDate(batDauLuc) : null;
    const endTime = ketThucLuc ? toDate(ketThucLuc) : null;
    const academicPeriod = await resolveAcademicPeriodForDate(startTime ?? endTime ?? new Date());
    const normalizedAttendanceMethod =
      normalizeAttendanceMethod(attendanceMethod ?? req.body?.phuongThucDiemDanh) || getDefaultAttendanceMethod();
    const registrationDue = registrationDeadline ?? req.body?.hanDangKy;
    const cancellationDue = cancellationDeadline ?? req.body?.hanHuyDangKy;

    const data = {
      tieuDe: normalizedTitle,
      nhomDiem: normalizePointGroup(nhomDiem),
      diemCong: sanitizePoints(diemCong),
      diaDiem: sanitizeOptionalText(diaDiem, 255),
      sucChuaToiDa: sanitizeCapacity(sucChuaToiDa),
      moTa: sanitizeOptionalText(moTa),
      yeuCau: sanitizeStringArray(yeuCau),
      huongDan: sanitizeStringArray(huongDan, 1000),
      batDauLuc: startTime,
      ketThucLuc: endTime,
      hanDangKy: registrationDue ? toDate(registrationDue) : null,
      hanHuyDangKy: cancellationDue ? toDate(cancellationDue) : null,
      phuongThucDiemDanh: normalizedAttendanceMethod,
      hocKyId: academicPeriod.hocKyId,
      namHocId: academicPeriod.namHocId
    };

    const newActivity = await prisma.hoatDong.create({
      data,
    });

    const activity = await buildActivityResponse(newActivity.id, req.user?.sub);

    res.status(201).json({ activity });
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({ error: error.message || 'Không thể tạo hoạt động' });
  }
};

export const updateActivity = async (req, res) => {
  const { id } = req.params;
  const {
    tieuDe,
    nhomDiem,
    diemCong,
    diaDiem,
    sucChuaToiDa,
    moTa,
    yeuCau,
    huongDan,
    batDauLuc,
    ketThucLuc,
    attendanceMethod,
    registrationDeadline,
    cancellationDeadline,
  } = req.body;

  const normalizedTitle = sanitizeOptionalText(tieuDe, 255);
  if (!normalizedTitle) {
    return res.status(400).json({ error: "Trường 'tieuDe' (Tên hoạt động) là bắt buộc" });
  }
  if (!nhomDiem) {
    return res.status(400).json({ error: "Trường 'nhomDiem' (Nhóm hoạt động) là bắt buộc" });
  }
  if (!isValidPointGroup(nhomDiem)) {
    return res.status(400).json({ error: "Giá trị 'nhomDiem' không hợp lệ" });
  }

  try {
    const startTime = batDauLuc ? toDate(batDauLuc) : null;
    const endTime = ketThucLuc ? toDate(ketThucLuc) : null;
    const academicPeriod = await resolveAcademicPeriodForDate(startTime ?? endTime ?? new Date());
    const normalizedAttendanceMethod =
      normalizeAttendanceMethod(attendanceMethod ?? req.body?.phuongThucDiemDanh) || getDefaultAttendanceMethod();
    const registrationDue = registrationDeadline ?? req.body?.hanDangKy;
    const cancellationDue = cancellationDeadline ?? req.body?.hanHuyDangKy;

    const updated = await prisma.hoatDong.update({
      where: { id },
      data: {
        tieuDe: normalizedTitle,
        nhomDiem: normalizePointGroup(nhomDiem),
        diemCong: sanitizePoints(diemCong),
        diaDiem: sanitizeOptionalText(diaDiem, 255),
        sucChuaToiDa: sanitizeCapacity(sucChuaToiDa),
        moTa: sanitizeOptionalText(moTa),
        yeuCau: sanitizeStringArray(yeuCau),
        huongDan: sanitizeStringArray(huongDan, 1000),
        batDauLuc: startTime,
        ketThucLuc: endTime,
        hanDangKy: registrationDue ? toDate(registrationDue) : null,
        hanHuyDangKy: cancellationDue ? toDate(cancellationDue) : null,
        phuongThucDiemDanh: normalizedAttendanceMethod,
        hocKyId: academicPeriod.hocKyId,
        namHocId: academicPeriod.namHocId,
      },
    });

    const activity = await buildActivityResponse(updated.id, req.user?.sub);
    res.json({ activity });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Hoạt động không tồn tại' });
    }
    console.error("Error updating activity:", error);
    res.status(500).json({ error: error.message || 'Không thể cập nhật hoạt động' });
  }
};

export const deleteActivity = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.hoatDong.delete({ where: { id } });
    res.json({ message: 'Đã xóa hoạt động' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Hoạt động không tồn tại' });
    }
    console.error("Error deleting activity:", error);
    res.status(500).json({ error: error.message || 'Không thể xóa hoạt động' });
  }
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

  const now = new Date();
  const absentRegistrationIds = registrations
    .filter((registration) => {
      if (registration.trangThai !== "DANG_KY") return false;
      const end = registration.hoatDong?.ketThucLuc ? new Date(registration.hoatDong.ketThucLuc) : null;
      if (!end || now <= end) return false;
      const history = registration.lichSuDiemDanh ?? [];
      const hasCheckin = history.some((entry) => entry.loai === "CHECKIN");
      const hasCheckout = history.some((entry) => entry.loai === "CHECKOUT");
      return !hasCheckin && !hasCheckout;
    })
    .map((registration) => registration.id);

  if (absentRegistrationIds.length) {
    await prisma.dangKyHoatDong.updateMany({
      where: { id: { in: absentRegistrationIds } },
      data: { trangThai: "VANG_MAT" }
    });
    const absentSet = new Set(absentRegistrationIds);
    registrations.forEach((registration) => {
      if (absentSet.has(registration.id)) {
        // eslint-disable-next-line no-param-reassign
        registration.trangThai = "VANG_MAT";
      }
    });
  }

  const filtered = normalizedFeedback
    ? registrations.filter((registration) => {
      if (normalizedFeedback === "NONE") return !registration.phanHoi;
      return registration.phanHoi?.trangThai === normalizedFeedback;
    })
    : registrations;

  res.json({
    registrations: filtered.map((registration) => ({
      ...mapRegistration(registration, registration.hoatDong),
      activity: mapActivity(registration.hoatDong, registration)
    }))
  });
};
