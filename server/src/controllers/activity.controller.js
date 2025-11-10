import sanitizeHtml from "sanitize-html";
import prisma from "../prisma.js";
import { env } from "../env.js";
import { notifyUser } from "../utils/notification.service.js";
import { getPointGroupLabel, normalizePointGroup, isValidPointGroup } from "../utils/points.js";
import { deriveSemesterInfo, resolveAcademicPeriodForDate } from "../utils/academic.js";
import {
  getAttendanceMethodLabel,
  getDefaultAttendanceMethod,
  mapAttendanceMethodToApi,
  normalizeAttendanceMethod
} from "../utils/attendance.js";
import { sanitizeDescriptor, computeMatchConfidence, deriveMatchStatus } from "../utils/face.js";
import {
  uploadBase64Image,
  buildAttendancePath,
  isSupabaseConfigured,
  removeFiles,
} from "../utils/supabaseStorage.js";
import {
  sanitizeStorageMetadata,
  sanitizeStorageList,
  mapStorageForResponse,
  mapStorageListForResponse,
  extractStoragePaths,
} from "../utils/storageMapper.js";

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
const FACE_ATTENDANCE_METHOD = "face";

const buildBucketSet = (...values) =>
  new Set(
    values
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean),
  );

const ACTIVITY_BUCKET_SET = buildBucketSet(env.SUPABASE_ACTIVITY_BUCKET);
const ATTENDANCE_BUCKET_SET = buildBucketSet(env.SUPABASE_ATTENDANCE_BUCKET);
const FEEDBACK_BUCKET_SET = buildBucketSet(env.SUPABASE_FEEDBACK_BUCKET);

const sanitizeActivityCoverMetadata = (value) =>
  sanitizeStorageMetadata(value, {
    allowedBuckets: ACTIVITY_BUCKET_SET,
    fallbackBucket: env.SUPABASE_ACTIVITY_BUCKET,
  });

const mapActivityCover = (value) =>
  mapStorageForResponse(value, {
    fallbackBucket: env.SUPABASE_ACTIVITY_BUCKET,
  });

const mapAttendanceEvidence = (value) =>
  mapStorageForResponse(value, {
    fallbackBucket: env.SUPABASE_ATTENDANCE_BUCKET,
  });

const mapFeedbackAttachments = (value) =>
  mapStorageListForResponse(value, {
    fallbackBucket: env.SUPABASE_FEEDBACK_BUCKET,
  });

const sanitizeFeedbackAttachmentList = (value) =>
  sanitizeStorageList(value, {
    allowedBuckets: FEEDBACK_BUCKET_SET,
    fallbackBucket: env.SUPABASE_FEEDBACK_BUCKET,
    limit: 10,
  });

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
  const attachments = mapFeedbackAttachments(value);
  return attachments.map((item, index) => ({
    id: item.path ? `${index}-${item.path}` : String(index),
    name: item.fileName || `Minh chứng ${index + 1}`,
    url: item.url,
    size: item.size,
    mimeType: item.mimeType,
    uploadedAt: item.uploadedAt,
    bucket: item.bucket,
    path: item.path,
    storage: item,
  }));
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

const extractFaceDescriptorPayload = (value) => {
  if (!value || typeof value !== "object") return null;
  const source = Array.isArray(value.descriptor)
    ? value.descriptor
    : Array.isArray(value.vector)
      ? value.vector
      : Array.isArray(value.data)
        ? value.data
        : null;
  const descriptor = sanitizeDescriptor(source);
  if (!descriptor) return null;
  return { descriptor };
};

const mapAttendanceEntry = (entry) => {
  if (!entry) return null;
  const attachmentMeta = mapAttendanceEntry(entry.anhDinhKem);
  return {
    id: entry.id,
    status: entry.trangThai,
    phase: entry.loai === "CHECKOUT" ? "checkout" : "checkin",
    note: entry.ghiChu ?? null,
    capturedAt: entry.taoLuc?.toISOString() ?? null,
    attachment: attachmentMeta,
    attachmentUrl: attachmentMeta?.url ?? null,
    attachmentMimeType: attachmentMeta?.mimeType ?? null,
    attachmentFileName: attachmentMeta?.fileName ?? null,
    faceMatchStatus: entry.faceMatch ?? null,
    faceMatchScore:
      typeof entry.faceScore === "number" && Number.isFinite(entry.faceScore) ? entry.faceScore : null,
    faceNeedsReview: entry.faceMatch === "REVIEW"
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

const processActivityCover = async ({ activityId, payload, existing }) => {
  if (payload === undefined) {
    return { metadata: existing ?? null, removed: [] };
  }

  const sanitizedExisting = existing
    ? sanitizeActivityCoverMetadata(existing)
    : null;
  const removalCandidates =
    sanitizedExisting && sanitizedExisting.path
      ? [
        {
          bucket: sanitizedExisting.bucket || env.SUPABASE_ACTIVITY_BUCKET,
          path: sanitizedExisting.path,
        },
      ]
      : [];

  if (payload === null) {
    return {
      metadata: null,
      removed: removalCandidates,
    };
  }

  if (payload && typeof payload === "object" && typeof payload.dataUrl === "string") {
    if (!isSupabaseConfigured()) {
      const error = new Error("Dịch vụ lưu trữ chưa được cấu hình");
      error.code = "SUPABASE_NOT_CONFIGURED";
      throw error;
    }
    const uploadResult = await uploadBase64Image({
      dataUrl: payload.dataUrl,
      bucket: env.SUPABASE_ACTIVITY_BUCKET,
      pathPrefix: `activities/${activityId}`,
      fileName: payload.fileName,
    });
    return {
      metadata: {
        ...uploadResult,
        mimeType: payload.mimeType ?? uploadResult.mimeType,
        fileName: payload.fileName ?? uploadResult.fileName,
      },
      removed: removalCandidates,
    };
  }

  const sanitized = sanitizeActivityCoverMetadata(payload);
  if (!sanitized) {
    return {
      metadata: null,
      removed: removalCandidates,
    };
  }

  if (
    sanitizedExisting &&
    sanitizedExisting.bucket === sanitized.bucket &&
    sanitizedExisting.path === sanitized.path
  ) {
    return {
      metadata: { ...sanitizedExisting, ...sanitized },
      removed: [],
    };
  }

  return {
    metadata: sanitized,
    removed: removalCandidates,
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
  const semesterDisplay =
    semesterLabel && academicYearLabel
      ? `${semesterLabel} - ${academicYearLabel}`
      : semesterLabel || academicYearLabel || null;
  const capacityLabel =
    typeof activity.sucChuaToiDa === "number" && activity.sucChuaToiDa > 0
      ? `${Math.min(registeredCount, activity.sucChuaToiDa)}/${activity.sucChuaToiDa}`
      : `${registeredCount}`;
  const coverMeta = mapActivityCover(activity.hinhAnh);

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
    coverImage:
      coverMeta?.url ?? (typeof activity.hinhAnh === "string" ? activity.hinhAnh : null),
    coverImageMeta: coverMeta,
    pointGroup,
    pointGroupLabel,
    isFeatured: activity.isFeatured,
    isPublished: activity.isPublished,
    semester: semesterLabel,
    academicYear: academicYearLabel,
    semesterDisplay,
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

  const defaultAttendanceMethod = getDefaultAttendanceMethod();
  const attendanceSource = activity.phuongThucDiemDanh || defaultAttendanceMethod;
  const attendanceMethod =
    mapAttendanceMethodToApi(attendanceSource) || mapAttendanceMethodToApi(defaultAttendanceMethod);
  const isFaceAttendance = attendanceMethod === FACE_ATTENDANCE_METHOD;

  const normalizedNote = sanitizeOptionalText(note);
  let storedEvidence = null;
  if (sanitizedEvidence.data) {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({ error: "Dịch vụ lưu trữ chưa được cấu hình" });
    }
    try {
      const uploadResult = await uploadBase64Image({
        dataUrl: sanitizedEvidence.data,
        bucket: env.SUPABASE_ATTENDANCE_BUCKET,
        pathPrefix: buildAttendancePath({ userId, activityId }),
        fileName: sanitizedEvidence.fileName,
      });
      storedEvidence = {
        ...uploadResult,
        mimeType: sanitizedEvidence.mimeType ?? uploadResult.mimeType,
        fileName: sanitizedEvidence.fileName ?? uploadResult.fileName,
      };
    } catch (error) {
      console.error("Không thể lưu ảnh điểm danh lên Supabase:", error);
      return res.status(500).json({ error: "Không thể lưu ảnh điểm danh. Vui lòng thử lại." });
    }
  }
  const attendanceTime = new Date();

  const baseNextStatus = status === "absent" && isCheckout ? "VANG_MAT" : "DA_THAM_GIA";
  let finalStatus = baseNextStatus;
  let entryStatus = isCheckout ? baseNextStatus : "DANG_KY";
  let faceResult = null;

  if (isFaceAttendance) {
    const facePayload = extractFaceDescriptorPayload(req.body?.face ?? req.body?.faceData ?? req.body?.faceVector ?? req.body);
    if (!facePayload?.descriptor) {
      return res.status(400).json({ error: "Không tìm thấy dữ liệu khuôn mặt hợp lệ" });
    }

    const faceProfile = await prisma.faceProfile.findUnique({ where: { nguoiDungId: userId } });
    const storedDescriptors = Array.isArray(faceProfile?.descriptors) ? faceProfile.descriptors : [];
    if (!storedDescriptors.length) {
      return res
        .status(400)
        .json({ error: "Bạn chưa đăng ký khuôn mặt. Vui lòng đăng ký trước khi điểm danh." });
    }

    const { confidence } = computeMatchConfidence(storedDescriptors, facePayload.descriptor);
    const score = Math.round(confidence * 10_000) / 100; // percent with 2 decimals
    const matchStatus = deriveMatchStatus(confidence);

    if (matchStatus === "REJECTED") {
      return res.status(403).json({
        error: "Không thể xác thực khuôn mặt. Vui lòng thử lại hoặc liên hệ quản trị viên.",
        face: { status: matchStatus, score }
      });
    }

    if (isCheckout) {
      if (matchStatus === "APPROVED") {
        finalStatus = "DA_THAM_GIA";
      } else if (matchStatus === "REVIEW") {
        finalStatus = "DANG_KY";
      }
      entryStatus = finalStatus;
    } else {
      entryStatus = "DANG_KY";
    }

    faceResult = {
      status: matchStatus,
      score,
      descriptor: facePayload.descriptor,
      profileId: faceProfile.id
    };
  }

  const registrationUpdate = {
    diemDanhLuc: attendanceTime,
    diemDanhGhiChu: normalizedNote,
    diemDanhBoiId: userId
  };
  if (isCheckout) {
    registrationUpdate.trangThai = finalStatus;
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
        trangThai: entryStatus,
        loai: isCheckout ? "CHECKOUT" : "CHECKIN",
        ghiChu: normalizedNote,
        anhDinhKem: storedEvidence,
        faceMatch: faceResult?.status ?? null,
        faceScore: faceResult?.score ?? null,
        faceMeta: faceResult
          ? { profileId: faceResult.profileId, descriptor: faceResult.descriptor }
          : null
      }
    })
  ]);

  const updated = await buildActivityResponse(activityId, userId);
  const faceReviewPending = faceResult?.status === "REVIEW";
  const success = isCheckout ? finalStatus === "DA_THAM_GIA" : true;

  let notificationTitle;
  let notificationMessage;
  let notificationType;
  let notificationAction;
  let emailSubject;
  let emailMessageLines;
  let responseMessage;

  if (isFaceAttendance) {
    const scoreLabel = faceResult ? ` (độ khớp ${faceResult.score.toFixed(2)}%)` : "";
    if (isCheckout) {
      if (faceReviewPending) {
        responseMessage = "Điểm danh cuối giờ đã ghi nhận và đang chờ xác minh";
        notificationTitle = "Điểm danh cuối giờ cần xác minh";
        notificationMessage = `Điểm danh cuối giờ cho hoạt động "${activity.tieuDe}" đang chờ quản trị viên xác minh${scoreLabel}.`;
        notificationType = "warning";
        notificationAction = "CHECKOUT_REVIEW";
        emailSubject = `[HUIT Social Credits] Điểm danh cần xác minh - "${activity.tieuDe}"`;
        emailMessageLines = [
          `Điểm danh cuối giờ cho hoạt động "${activity.tieuDe}" đang chờ quản trị viên xác minh thêm.${scoreLabel}`,
          normalizedNote ? `Ghi chú: ${normalizedNote}` : null
        ];
      } else {
        responseMessage = "Điểm danh cuối giờ thành công";
        notificationTitle = "Điểm danh thành công";
        notificationMessage = `Điểm danh cho hoạt động "${activity.tieuDe}" đã được ghi nhận${scoreLabel}.`;
        notificationType = "success";
        notificationAction = "ATTENDED";
        emailSubject = `[HUIT Social Credits] Xác nhận điểm danh hoạt động "${activity.tieuDe}"`;
        emailMessageLines = [
          `Điểm danh cho hoạt động "${activity.tieuDe}" đã được ghi nhận thành công.${scoreLabel}`,
          normalizedNote ? `Ghi chú: ${normalizedNote}` : null
        ];
      }
    } else {
      if (faceReviewPending) {
        responseMessage = "Điểm danh đầu giờ đã ghi nhận và đang chờ xác minh";
        notificationTitle = "Điểm danh đầu giờ cần xác minh";
        notificationMessage = `Điểm danh đầu giờ cho hoạt động "${activity.tieuDe}" đang chờ xác minh thêm${scoreLabel}.`;
        notificationType = "warning";
        notificationAction = "CHECKIN_REVIEW";
        emailSubject = `[HUIT Social Credits] Điểm danh cần xác minh - "${activity.tieuDe}"`;
        emailMessageLines = [
          `Điểm danh đầu giờ cho hoạt động "${activity.tieuDe}" đang chờ xác minh thêm.${scoreLabel}`,
          normalizedNote ? `Ghi chú: ${normalizedNote}` : null
        ];
      } else {
        responseMessage = "Điểm danh đầu giờ thành công";
        notificationTitle = "Đã ghi nhận điểm danh đầu giờ";
        notificationMessage = `Điểm danh đầu giờ cho hoạt động "${activity.tieuDe}" đã được ghi nhận${scoreLabel}.`;
        notificationType = "info";
        notificationAction = "CHECKIN";
        emailSubject = `[HUIT Social Credits] Xác nhận điểm danh đầu giờ hoạt động "${activity.tieuDe}"`;
        emailMessageLines = [
          `Điểm danh đầu giờ cho hoạt động "${activity.tieuDe}" đã được ghi nhận thành công.${scoreLabel}`,
          normalizedNote ? `Ghi chú: ${normalizedNote}` : null
        ];
      }
    }
  } else {
    notificationTitle = isCheckout
      ? success
        ? "Điểm danh thành công"
        : "Đã ghi nhận vắng mặt"
      : "Đã ghi nhận điểm danh đầu giờ";
    notificationMessage = isCheckout
      ? success
        ? `Điểm danh cho hoạt động "${activity.tieuDe}" đã được ghi nhận.`
        : `Bạn được ghi nhận vắng mặt cho hoạt động "${activity.tieuDe}".`
      : `Điểm danh đầu giờ cho hoạt động "${activity.tieuDe}" đã được ghi nhận.`;
    notificationType = isCheckout ? (success ? "success" : "danger") : "info";
    notificationAction = isCheckout ? (success ? "ATTENDED" : "ABSENT") : "CHECKIN";
    emailSubject = isCheckout
      ? success
        ? `[HUIT Social Credits] Xác nhận điểm danh hoạt động "${activity.tieuDe}"`
        : `[HUIT Social Credits] Thông báo vắng mặt hoạt động "${activity.tieuDe}"`
      : `[HUIT Social Credits] Xác nhận điểm danh đầu giờ hoạt động "${activity.tieuDe}"`;
    emailMessageLines = isCheckout
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
    responseMessage = isCheckout
      ? success
        ? "Điểm danh cuối giờ thành công"
        : "Đã ghi nhận vắng mặt"
      : "Điểm danh đầu giờ thành công";
  }

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
    message: responseMessage,
    activity: updated,
    face: faceResult
      ? {
        status: faceResult.status,
        score: faceResult.score
      }
      : null
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

  const existingFeedback = registration.phanHoi ?? null;
  const existingAttachments = existingFeedback
    ? sanitizeFeedbackAttachmentList(existingFeedback.minhChung)
    : [];

  const normalizedAttachments = sanitizeFeedbackAttachmentList(attachments);
  if (Array.isArray(attachments) && attachments.length && !normalizedAttachments.length) {
    return res.status(400).json({ error: "Danh sách minh chứng không hợp lệ" });
  }

  const incomingPathSet = new Set(extractStoragePaths(normalizedAttachments));
  const removalMap = new Map();
  existingAttachments.forEach((item) => {
    if (!item?.path) return;
    if (incomingPathSet.has(item.path)) return;
    const bucket = item.bucket || env.SUPABASE_FEEDBACK_BUCKET;
    if (!bucket) return;
    if (!removalMap.has(bucket)) {
      removalMap.set(bucket, []);
    }
    removalMap.get(bucket).push(item.path);
  });

  const normalizedRating = typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : null;
  const payload = {
    noiDung: String(content).trim(),
    danhGia: normalizedRating,
    minhChung: normalizedAttachments,
    trangThai: "CHO_DUYET",
    lydoTuChoi: null,
  };

  let feedback;
  if (existingFeedback) {
    feedback = await prisma.phanHoiHoatDong.update({
      where: { id: existingFeedback.id },
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

  removalMap.forEach((paths, bucket) => {
    if (paths?.length) {
      removeFiles(bucket, paths);
    }
  });

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
  const hasCoverImage = Object.prototype.hasOwnProperty.call(req.body ?? {}, "coverImage")
    || Object.prototype.hasOwnProperty.call(req.body ?? {}, "hinhAnh");
  const coverPayload = Object.prototype.hasOwnProperty.call(req.body ?? {}, "coverImage")
    ? req.body.coverImage
    : req.body?.hinhAnh;

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

    if (hasCoverImage) {
      try {
        const coverResult = await processActivityCover({
          activityId: newActivity.id,
          payload: coverPayload,
          existing: null,
        });
        await prisma.hoatDong.update({
          where: { id: newActivity.id },
          data: { hinhAnh: coverResult.metadata },
        });
        coverResult.removed.forEach((target) => {
          if (target?.bucket && target?.path) {
            removeFiles(target.bucket, [target.path]);
          }
        });
      } catch (error) {
        console.error("Không thể xử lý ảnh bìa hoạt động:", error);
        const message =
          error?.code === "SUPABASE_NOT_CONFIGURED"
            ? "Dịch vụ lưu trữ chưa được cấu hình"
            : error?.message || "Không thể xử lý ảnh bìa hoạt động";
        return res.status(500).json({ error: message });
      }
    }

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
  const hasCoverImage = Object.prototype.hasOwnProperty.call(req.body ?? {}, "coverImage")
    || Object.prototype.hasOwnProperty.call(req.body ?? {}, "hinhAnh");
  const coverPayload = Object.prototype.hasOwnProperty.call(req.body ?? {}, "coverImage")
    ? req.body.coverImage
    : req.body?.hinhAnh;

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
    const existingActivity = await prisma.hoatDong.findUnique({
      where: { id },
      select: { hinhAnh: true },
    });
    if (!existingActivity) {
      return res.status(404).json({ error: "Hoạt động không tồn tại" });
    }

    const startTime = batDauLuc ? toDate(batDauLuc) : null;
    const endTime = ketThucLuc ? toDate(ketThucLuc) : null;
    const academicPeriod = await resolveAcademicPeriodForDate(startTime ?? endTime ?? new Date());
    const normalizedAttendanceMethod =
      normalizeAttendanceMethod(attendanceMethod ?? req.body?.phuongThucDiemDanh) || getDefaultAttendanceMethod();
    const registrationDue = registrationDeadline ?? req.body?.hanDangKy;
    const cancellationDue = cancellationDeadline ?? req.body?.hanHuyDangKy;

    let coverResult = null;
    if (hasCoverImage) {
      try {
        coverResult = await processActivityCover({
          activityId: id,
          payload: coverPayload,
          existing: existingActivity.hinhAnh,
        });
      } catch (error) {
        console.error("Không thể xử lý ảnh bìa hoạt động:", error);
        const message =
          error?.code === "SUPABASE_NOT_CONFIGURED"
            ? "Dịch vụ lưu trữ chưa được cấu hình"
            : error?.message || "Không thể xử lý ảnh bìa hoạt động";
        return res.status(500).json({ error: message });
      }
    }

    const updateData = {
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
    };

    if (hasCoverImage) {
      updateData.hinhAnh = coverResult?.metadata ?? null;
    }

    const updated = await prisma.hoatDong.update({
      where: { id },
      data: updateData,
    });

    if (coverResult?.removed?.length) {
      const buckets = new Map();
      coverResult.removed.forEach((target) => {
        if (!target?.bucket || !target?.path) return;
        if (!buckets.has(target.bucket)) {
          buckets.set(target.bucket, []);
        }
        buckets.get(target.bucket).push(target.path);
      });
      buckets.forEach((paths, bucket) => {
        if (paths.length) {
          removeFiles(bucket, paths);
        }
      });
    }

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
