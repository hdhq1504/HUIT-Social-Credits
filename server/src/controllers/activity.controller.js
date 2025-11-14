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
import {
  evaluateFaceMatch,
  FACE_MATCH_CONSTANTS,
  normalizeDescriptor,
  normalizeDescriptorCollection,
  summarizeFaceProfile
} from "../utils/face.js";
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

const ACTIVE_REG_STATUSES = ["DANG_KY", "DA_THAM_GIA", "CHO_DUYET"];
const REGISTRATION_STATUSES = ["DANG_KY", "DA_HUY", "DA_THAM_GIA", "VANG_MAT", "CHO_DUYET"];
const FEEDBACK_STATUSES = ["CHO_DUYET", "DA_DUYET", "BI_TU_CHOI"];
const FEEDBACK_STATUS_LABELS = {
  CHO_DUYET: "Chờ duyệt",
  DA_DUYET: "Đã duyệt",
  BI_TU_CHOI: "Bị từ chối"
};
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

const sanitizeAttendanceEvidenceMetadata = (value) =>
  sanitizeStorageMetadata(value, {
    allowedBuckets: ATTENDANCE_BUCKET_SET,
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
  avatarUrl: true,
  maSV: true,
  maLop: true,
  maKhoa: true
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
  phanHoi: {
    include: {
      nguoiDung: {
        select: {
          id: true,
          hoTen: true,
          email: true,
          avatarUrl: true,
          maSV: true,
          maKhoa: true,
          maLop: true
        }
      }
    },
    orderBy: { taoLuc: "desc" }
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
    orderBy: { taoLuc: "asc" }
  }
};

const ADMIN_STUDENT_FIELDS = {
  id: true,
  hoTen: true,
  email: true,
  avatarUrl: true,
  maSV: true,
  maKhoa: true,
  maLop: true,
  soDT: true
};

const ADMIN_REGISTRATION_INCLUDE = {
  ...REGISTRATION_INCLUDE,
  nguoiDung: {
    select: ADMIN_STUDENT_FIELDS
  },
  hoatDong: {
    select: {
      id: true,
      tieuDe: true,
      diemCong: true,
      nhomDiem: true,
      batDauLuc: true,
      ketThucLuc: true,
      diaDiem: true,
      phuongThucDiemDanh: true
    }
  }
};

const REGISTRATION_STATUS_LABELS = {
  DANG_KY: "Chờ duyệt",
  DA_THAM_GIA: "Đã duyệt",
  VANG_MAT: "Vắng mặt",
  DA_HUY: "Đã hủy",
  CHO_DUYET: "Chờ duyệt điểm danh"
};

const ATTENDANCE_STATUS_LABELS = {
  DANG_KY: "Đang xử lý",
  DA_THAM_GIA: "Hoàn thành",
  VANG_MAT: "Vắng mặt",
  DA_HUY: "Đã hủy",
  CHO_DUYET: "Chờ duyệt"
};

const FACE_MATCH_LABELS = {
  APPROVED: "Khớp khuôn mặt",
  REVIEW: "Cần kiểm tra",
  REJECTED: "Không khớp",
};

const summarizeFaceHistoryRaw = (entries = []) => {
  const relevant = entries.filter(
    (entry) => entry && (entry.loai === "CHECKIN" || entry.loai === "CHECKOUT")
  );
  const statuses = relevant.map((entry) => entry.faceMatch ?? null);
  const approvedCount = statuses.filter((status) => status === "APPROVED").length;
  const reviewCount = statuses.filter((status) => status === "REVIEW").length;
  const rejectedCount = statuses.filter((status) => status === "REJECTED").length;
  const missingCount = statuses.filter((status) => status === null).length;
  const hasCheckin = relevant.some((entry) => entry.loai === "CHECKIN");
  const hasCheckout = relevant.some((entry) => entry.loai === "CHECKOUT");
  const requiresReview =
    reviewCount > 0 ||
    missingCount > 0 ||
    (hasCheckout && approvedCount === 1 && rejectedCount === 0);

  return {
    approvedCount,
    reviewCount,
    rejectedCount,
    missingCount,
    hasCheckin,
    hasCheckout,
    requiresReview,
  };
};

const summarizeFaceHistoryMapped = (entries = []) => {
  const relevant = entries.filter(
    (entry) => entry && (entry.phase === "checkin" || entry.phase === "checkout")
  );
  const statuses = relevant.map((entry) => entry.faceMatch ?? null);
  const approvedCount = statuses.filter((status) => status === "APPROVED").length;
  const reviewCount = statuses.filter((status) => status === "REVIEW").length;
  const rejectedCount = statuses.filter((status) => status === "REJECTED").length;
  const missingCount = statuses.filter((status) => status === null).length;
  const hasCheckin = relevant.some((entry) => entry.phase === "checkin");
  const hasCheckout = relevant.some((entry) => entry.phase === "checkout");
  const requiresReview =
    reviewCount > 0 ||
    missingCount > 0 ||
    (hasCheckout && approvedCount === 1 && rejectedCount === 0);

  return {
    approvedCount,
    reviewCount,
    rejectedCount,
    missingCount,
    hasCheckin,
    hasCheckout,
    requiresReview,
  };
};

const DEFAULT_REGISTRATION_PAGE_SIZE = 10;
const MAX_REGISTRATION_PAGE_SIZE = 50;

const ADMIN_STATUS_MAP = {
  pending: "DANG_KY",
  approved: "DA_THAM_GIA",
  rejected: "VANG_MAT",
  canceled: "DA_HUY"
};

const normalizePageNumber = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const normalizePageSize = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_REGISTRATION_PAGE_SIZE;
  return Math.min(parsed, MAX_REGISTRATION_PAGE_SIZE);
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

const mapStudentProfile = (user, { includeContact = false } = {}) => {
  if (!user) return null;
  const base = {
    id: user.id,
    name: sanitizeOptionalText(user.hoTen) || sanitizeOptionalText(user.email) || "Người dùng",
    email: user.email ?? null,
    avatarUrl: user.avatarUrl ?? null,
    studentCode: user.maSV ?? null,
    faculty: user.maKhoa ?? null,
    className: user.maLop ?? null
  };

  if (includeContact) {
    base.phone = user.soDT ?? null;
  }

  return base;
};

const mapParticipants = (registrations = []) =>
  registrations
    .filter((reg) => reg.nguoiDung)
    .map((reg) => {
      const student = mapStudentProfile(reg.nguoiDung);
      if (student?.avatarUrl) {
        return { id: student.id, name: student.name, src: student.avatarUrl };
      }
      return { id: student?.id, name: student?.name ?? "Người dùng" };
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

const assertAdmin = (req) => {
  if (req.user?.role !== "ADMIN") {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }
};

const buildRegistrationSearchCondition = (searchTerm) => {
  if (!searchTerm) return undefined;
  return {
    OR: [
      { nguoiDung: { hoTen: { contains: searchTerm, mode: "insensitive" } } },
      { nguoiDung: { email: { contains: searchTerm, mode: "insensitive" } } },
      { nguoiDung: { maSV: { contains: searchTerm, mode: "insensitive" } } },
      { hoatDong: { tieuDe: { contains: searchTerm, mode: "insensitive" } } }
    ]
  };
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
    return { data: null, mimeType: null, fileName: null, metadata: null };
  }

  const metadata = sanitizeAttendanceEvidenceMetadata(value);
  if (metadata) {
    return {
      data: null,
      mimeType: metadata.mimeType ?? null,
      filename: metadata.fileName ?? null,
      metadata,
    };
  }

  const rawData =
    typeof value.data === "string"
      ? value.data
      : typeof value.dataUrl === "string"
        ? value.dataUrl
        : null;
  const data = rawData?.trim();

  if (!data || data.length > MAX_ATTENDANCE_EVIDENCE_SIZE || !data.startsWith("data:")) {
    return { data: null, mimeType: null, fileName: null, metadata: null };
  }

  const mimeType = typeof value.mimeType === "string" ? value.mimeType.slice(0, 100) : null;
  const fileName = typeof value.fileName === "string" ? value.fileName.slice(0, 255) : null;

  return { data, mimeType, fileName, metadata: null };
};

const mapAttendanceEntry = (entry) => {
  if (!entry) return null;
  const attachmentMeta = mapAttendanceEvidence(entry.anhDinhKem);
  return {
    id: entry.id,
    status: entry.trangThai,
    statusLabel: ATTENDANCE_STATUS_LABELS[entry.trangThai] || entry.trangThai,
    phase: entry.loai === "CHECKOUT" ? "checkout" : "checkin",
    note: entry.ghiChu ?? null,
    capturedAt: entry.taoLuc?.toISOString() ?? null,
    attachment: attachmentMeta,
    attachmentUrl: attachmentMeta?.url ?? null,
    attachmentMimeType: attachmentMeta?.mimeType ?? null,
    attachmentFileName: attachmentMeta?.fileName ?? null,
    faceMatch: entry.faceMatch ?? null,
    faceMatchLabel: entry.faceMatch ? FACE_MATCH_LABELS[entry.faceMatch] || entry.faceMatch : null,
    faceScore: entry.faceScore ?? null,
    faceMeta: entry.faceMeta ?? null
  };
};

const mapFeedback = (feedback) => {
  if (!feedback) return null;
  return {
    id: feedback.id,
    status: feedback.trangThai,
    statusLabel: FEEDBACK_STATUS_LABELS[feedback.trangThai] || feedback.trangThai,
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
  const baseTime = registration?.duyetLuc
    ? new Date(registration.duyetLuc)
    : registration?.diemDanhLuc
      ? new Date(registration.diemDanhLuc)
      : toDate(activity?.ketThucLuc) || toDate(activity?.batDauLuc) || new Date();

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const available = new Date(baseTime.getTime() + ONE_DAY_MS);
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
  const faceSummary = summarizeFaceHistoryMapped(attendanceHistory);
  return {
    id: registration.id,
    activityId: registration.hoatDongId,
    userId: registration.nguoiDungId,
    status: registration.trangThai,
    statusLabel: REGISTRATION_STATUS_LABELS[registration.trangThai] || registration.trangThai,
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
      feedbackAvailableAt,
      face: faceSummary
    },
    feedback: mapFeedback(registration.phanHoi),
    student: mapStudentProfile(registration.nguoiDung, { includeContact: true })
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
    case "CHO_DUYET":
      return "attendance_review";
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

const mapActivity = (activity, registration, options = {}) => {
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
  const faceEnrollment =
    options.faceEnrollment ?? summarizeFaceProfile(options.faceProfile ?? null);
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

  const participantRegistrations = activeRegistrations.map((item) => ({
    id: item.id,
    status: item.trangThai,
    statusLabel: REGISTRATION_STATUS_LABELS[item.trangThai] || item.trangThai,
    registeredAt: item.dangKyLuc?.toISOString() ?? null,
    updatedAt: item.updatedAt?.toISOString() ?? null,
    checkInAt: item.diemDanhLuc?.toISOString() ?? null,
    student: mapStudentProfile(item.nguoiDung, { includeContact: true })
  }));

  const feedbackLogs = Array.isArray(activity.phanHoi)
    ? activity.phanHoi.map((feedbackItem) => ({
      ...mapFeedback(feedbackItem),
      student: mapStudentProfile(feedbackItem.nguoiDung)
    }))
    : [];

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
    participantRegistrations,
    feedbackLogs,
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
    requiresFaceEnrollment: attendanceMethod === "photo",
    faceEnrollment,
    state: determineState(activity, registration),
    registration: mapRegistration(registration, activity)
  };
};

const buildActivityResponse = async (activityId, userId) => {
  const [activity, registration, faceProfile] = await Promise.all([
    prisma.hoatDong.findUnique({
      where: { id: activityId },
      include: ACTIVITY_INCLUDE
    }),
    userId
      ? prisma.dangKyHoatDong.findUnique({
        where: { nguoiDungId_hoatDongId: { nguoiDungId: userId, hoatDongId: activityId } },
        include: REGISTRATION_INCLUDE
      })
      : null,
    userId ? prisma.faceProfile.findUnique({ where: { nguoiDungId: userId } }) : null
  ]);

  if (!activity) return null;
  const faceEnrollment = summarizeFaceProfile(faceProfile);
  return mapActivity(activity, registration, { faceEnrollment });
};

const mapActivitySummaryForRegistration = (activity) => {
  if (!activity) return null;
  const defaultAttendanceMethod = getDefaultAttendanceMethod();
  const attendanceSource = activity.phuongThucDiemDanh || defaultAttendanceMethod;
  const attendanceMethod =
    mapAttendanceMethodToApi(attendanceSource) || mapAttendanceMethodToApi(defaultAttendanceMethod);
  const attendanceMethodLabel =
    getAttendanceMethodLabel(attendanceMethod) ||
    getAttendanceMethodLabel(mapAttendanceMethodToApi(defaultAttendanceMethod));

  return {
    id: activity.id,
    title: activity.tieuDe,
    points: activity.diemCong ?? 0,
    pointGroup: normalizePointGroup(activity.nhomDiem),
    startTime: activity.batDauLuc?.toISOString() ?? null,
    endTime: activity.ketThucLuc?.toISOString() ?? null,
    location: activity.diaDiem ?? null,
    attendanceMethod,
    attendanceMethodLabel
  };
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
  let faceProfileSummary = null;
  if (currentUserId && activities.length) {
    const registrations = await prisma.dangKyHoatDong.findMany({
      where: {
        nguoiDungId: currentUserId,
        hoatDongId: { in: activities.map((activity) => activity.id) },
      },
      include: REGISTRATION_INCLUDE,
    });
    registrationMap = new Map(registrations.map((registration) => [registration.hoatDongId, registration]));
    const faceProfile = await prisma.faceProfile.findUnique({ where: { nguoiDungId: currentUserId } });
    faceProfileSummary = summarizeFaceProfile(faceProfile);
  }

  res.json({
    activities: activities.map((activity) =>
      mapActivity(activity, registrationMap.get(activity.id), { faceEnrollment: faceProfileSummary })
    ),
  });
};

export const getActivity = async (req, res) => {
  const currentUserId = req.user?.sub;
  const activity = await buildActivityResponse(req.params.id, currentUserId);
  if (!activity) return res.status(404).json({ error: "Hoạt động không tồn tại" });
  res.json({ activity });
};

export const listActivityRegistrationsAdmin = async (req, res) => {
  try {
    assertAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id: activityId } = req.params;

  const activity = await prisma.hoatDong.findUnique({
    where: { id: activityId },
    select: {
      id: true,
      tieuDe: true,
      diemCong: true,
      nhomDiem: true,
      batDauLuc: true,
      ketThucLuc: true,
      diaDiem: true,
      phuongThucDiemDanh: true
    }
  });

  if (!activity) {
    return res.status(404).json({ error: "Hoạt động không tồn tại" });
  }

  const registrations = await prisma.dangKyHoatDong.findMany({
    where: { hoatDongId: activityId },
    include: ADMIN_REGISTRATION_INCLUDE,
    orderBy: [{ dangKyLuc: "asc" }]
  });

  const activitySummary = mapActivitySummaryForRegistration(activity);

  res.json({
    activity: activitySummary,
    registrations: registrations.map((registration) => ({
      ...mapRegistration(registration, activity),
      activity: activitySummary
    }))
  });
};

export const listRegistrationsAdmin = async (req, res) => {
  try {
    assertAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { status, faculty, className, activityId, search, page, pageSize } = req.query || {};

  const normalizedStatusKey = typeof status === "string" && status !== "all" ? status.toLowerCase() : undefined;
  const normalizedStatus = normalizedStatusKey ? ADMIN_STATUS_MAP[normalizedStatusKey] : undefined;
  const normalizedFaculty = sanitizeOptionalText(faculty, 100);
  const normalizedClassName = sanitizeOptionalText(className, 100);
  const normalizedActivityId = typeof activityId === "string" && activityId.trim() ? activityId.trim() : undefined;
  const searchTerm = sanitizeOptionalText(search, 100);

  const currentPage = normalizePageNumber(page);
  const take = normalizePageSize(pageSize);
  const skip = (currentPage - 1) * take;

  const conditions = [];

  if (normalizedStatus) {
    conditions.push({ trangThai: normalizedStatus });
  }

  if (normalizedActivityId) {
    conditions.push({ hoatDongId: normalizedActivityId });
  }

  if (normalizedFaculty) {
    conditions.push({ nguoiDung: { maKhoa: normalizedFaculty } });
  }

  if (normalizedClassName) {
    conditions.push({ nguoiDung: { maLop: normalizedClassName } });
  }

  const searchCondition = buildRegistrationSearchCondition(searchTerm);
  if (searchCondition) {
    conditions.push(searchCondition);
  }

  const where = conditions.length ? { AND: conditions } : {};

  const [registrations, total] = await Promise.all([
    prisma.dangKyHoatDong.findMany({
      where,
      include: {
        ...ADMIN_REGISTRATION_INCLUDE,
        hoatDong: ADMIN_REGISTRATION_INCLUDE.hoatDong,
        nguoiDung: ADMIN_REGISTRATION_INCLUDE.nguoiDung
      },
      orderBy: [{ dangKyLuc: "desc" }],
      skip,
      take
    }),
    prisma.dangKyHoatDong.count({ where })
  ]);

  const [totalAll, pendingCount, approvedCount, rejectedCount, facultiesRaw, classesRaw, activitiesRaw] =
    await Promise.all([
      prisma.dangKyHoatDong.count(),
      prisma.dangKyHoatDong.count({ where: { trangThai: "DANG_KY" } }),
      prisma.dangKyHoatDong.count({ where: { trangThai: "DA_THAM_GIA" } }),
      prisma.dangKyHoatDong.count({ where: { trangThai: "VANG_MAT" } }),
      prisma.nguoiDung.findMany({
        where: { dangKy: { some: {} }, maKhoa: { not: null } },
        select: { maKhoa: true },
        distinct: ["maKhoa"]
      }),
      prisma.nguoiDung.findMany({
        where: { dangKy: { some: {} }, maLop: { not: null } },
        select: { maLop: true },
        distinct: ["maLop"]
      }),
      prisma.hoatDong.findMany({
        where: { dangKy: { some: {} } },
        select: { id: true, tieuDe: true }
      })
    ]);

  const sortAlpha = (a, b) => a.localeCompare(b, "vi", { sensitivity: "base" });

  const faculties = facultiesRaw
    .map((item) => sanitizeOptionalText(item.maKhoa, 100))
    .filter(Boolean)
    .sort(sortAlpha);

  const classes = classesRaw
    .map((item) => sanitizeOptionalText(item.maLop, 100))
    .filter(Boolean)
    .sort(sortAlpha);

  const activities = activitiesRaw
    .map((item) => ({ id: item.id, title: sanitizeOptionalText(item.tieuDe, 255) || "Hoạt động" }))
    .sort((a, b) => sortAlpha(a.title, b.title));

  res.json({
    registrations: registrations.map((registration) => ({
      ...mapRegistration(registration, registration.hoatDong),
      activity: mapActivitySummaryForRegistration(registration.hoatDong)
    })),
    pagination: {
      page: currentPage,
      pageSize: take,
      total,
      pageCount: Math.ceil(total / take) || 0
    },
    stats: {
      total: totalAll,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount
    },
    filterOptions: {
      faculties,
      classes,
      activities
    }
  });
};

export const getRegistrationDetailAdmin = async (req, res) => {
  try {
    assertAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;

  const registration = await prisma.dangKyHoatDong.findUnique({
    where: { id },
    include: {
      ...ADMIN_REGISTRATION_INCLUDE,
      hoatDong: ADMIN_REGISTRATION_INCLUDE.hoatDong,
      nguoiDung: ADMIN_REGISTRATION_INCLUDE.nguoiDung
    }
  });

  if (!registration) {
    return res.status(404).json({ error: "Đăng ký không tồn tại" });
  }

  res.json({
    registration: {
      ...mapRegistration(registration, registration.hoatDong),
      activity: mapActivitySummaryForRegistration(registration.hoatDong)
    }
  });
};

export const decideRegistrationAttendance = async (req, res) => {
  try {
    assertAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;
  const { decision, note } = req.body || {};

  const normalizedDecision = typeof decision === "string" ? decision.trim().toUpperCase() : "";
  if (!["APPROVE", "REJECT"].includes(normalizedDecision)) {
    return res.status(400).json({ error: "Quyết định không hợp lệ" });
  }

  const reason = sanitizeOptionalText(note, 500);

  const registration = await prisma.dangKyHoatDong.findUnique({
    where: { id },
    include: {
      ...ADMIN_REGISTRATION_INCLUDE,
      hoatDong: ADMIN_REGISTRATION_INCLUDE.hoatDong,
      nguoiDung: ADMIN_REGISTRATION_INCLUDE.nguoiDung
    }
  });

  if (!registration) {
    return res.status(404).json({ error: "Đăng ký không tồn tại" });
  }

  const isApproval = normalizedDecision === "APPROVE";
  const targetStatus = isApproval ? "DA_THAM_GIA" : "VANG_MAT";
  const now = new Date();

  const updateData = {
    trangThai: targetStatus,
    diemDanhBoiId: req.user?.sub || registration.diemDanhBoiId || null
  };

  if (isApproval) {
    updateData.duyetLuc = registration.duyetLuc ?? now;
    if (!registration.diemDanhLuc) {
      updateData.diemDanhLuc = now;
    }
  } else {
    updateData.duyetLuc = null;
  }

  if (reason !== null) {
    updateData.diemDanhGhiChu = reason;
  }

  const attendanceUpdateData = {
    trangThai: targetStatus
  };

  if (reason && !isApproval) {
    attendanceUpdateData.ghiChu = reason;
  }

  await prisma.$transaction([
    prisma.dangKyHoatDong.update({
      where: { id: registration.id },
      data: updateData
    }),
    prisma.diemDanhNguoiDung.updateMany({
      where: { dangKyId: registration.id },
      data: attendanceUpdateData
    })
  ]);

  const updated = await prisma.dangKyHoatDong.findUnique({
    where: { id },
    include: {
      ...ADMIN_REGISTRATION_INCLUDE,
      hoatDong: ADMIN_REGISTRATION_INCLUDE.hoatDong,
      nguoiDung: ADMIN_REGISTRATION_INCLUDE.nguoiDung
    }
  });

  const activity = updated?.hoatDong;
  const user = updated?.nguoiDung;

  if (activity && user) {
    const baseTitle = activity.tieuDe || "hoạt động";
    const notificationMessage = isApproval
      ? `Minh chứng điểm danh cho hoạt động "${baseTitle}" đã được duyệt.`
      : `Minh chứng điểm danh cho hoạt động "${baseTitle}" đã bị từ chối.`;
    const notificationTitle = isApproval
      ? "Minh chứng điểm danh được duyệt"
      : "Minh chứng điểm danh bị từ chối";
    const notificationType = isApproval ? "success" : "danger";
    const notificationAction = isApproval ? "ATTENDANCE_APPROVED" : "ATTENDANCE_REJECTED";
    const emailSubject = isApproval
      ? `[HUIT Social Credits] Minh chứng được duyệt - "${baseTitle}"`
      : `[HUIT Social Credits] Minh chứng bị từ chối - "${baseTitle}"`;

    const emailMessageLines = [
      notificationMessage,
      `Điểm cộng: ${activity.diemCong ?? 0}`,
      reason ? `Ghi chú từ quản trị viên: ${reason}` : null
    ].filter(Boolean);

    await notifyUser({
      userId: updated.nguoiDungId,
      user: {
        id: user.id,
        email: user.email,
        hoTen: user.hoTen
      },
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      data: { activityId: activity.id, registrationId: updated.id, action: notificationAction },
      emailSubject,
      emailMessageLines
    });
  }

  res.json({
    message: isApproval ? "Đã duyệt minh chứng điểm danh" : "Đã từ chối minh chứng điểm danh",
    registration: {
      ...mapRegistration(updated, updated?.hoatDong),
      activity: mapActivitySummaryForRegistration(updated?.hoatDong)
    }
  });
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
  const {
    note,
    status,
    evidence,
    phase,
    faceDescriptor,
    faceDescriptors,
    faceError,
  } = req.body || {};

  const user = await prisma.nguoiDung.findUnique({
    where: { id: userId },
    select: { id: true, email: true, hoTen: true }
  });
  if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

  const registration = await prisma.dangKyHoatDong.findUnique({
    where: { nguoiDungId_hoatDongId: { nguoiDungId: userId, hoatDongId: activityId } },
    include: {
      hoatDong: true,
      lichSuDiemDanh: { orderBy: { taoLuc: "asc" } }
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
  const checkinEntries = history.filter((entry) => entry.loai === "CHECKIN");
  const hasCheckin = checkinEntries.length > 0;
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

  let faceProfile = null;
  if (attendanceMethod === "photo") {
    faceProfile = await prisma.faceProfile.findUnique({ where: { nguoiDungId: userId } });
    if (!faceProfile) {
      return res.status(409).json({
        error:
          "Bạn chưa đăng ký khuôn mặt. Vui lòng đăng ký trong trang Thông tin sinh viên trước khi điểm danh.",
      });
    }
  }

  const normalizedNote = sanitizeOptionalText(note);
  const sanitizedEvidence = sanitizeAttendanceEvidence(evidence);
  let storedEvidence = null;
  if (sanitizedEvidence.metadata) {
    storedEvidence = sanitizedEvidence.metadata;
  } else if (sanitizedEvidence.data) {
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
  if (attendanceMethod === "photo" && !storedEvidence) {
    return res.status(400).json({ error: "Vui lòng chụp hoặc tải lên ảnh điểm danh." });
  }

  let descriptorSource = null;
  let normalizedDescriptor = null;
  if (attendanceMethod === "photo") {
    const directDescriptor = normalizeDescriptor(faceDescriptor);
    if (directDescriptor) {
      normalizedDescriptor = directDescriptor;
      descriptorSource = "faceDescriptor";
    } else {
      const descriptorCollection = normalizeDescriptorCollection(faceDescriptors);
      if (descriptorCollection.length) {
        normalizedDescriptor = descriptorCollection[0];
        descriptorSource = "faceDescriptors";
      }
    }
  }

  let faceMatchResult = null;
  let referenceDescriptors = [];
  if (attendanceMethod === "photo") {
    referenceDescriptors = normalizeDescriptorCollection(faceProfile?.descriptors || []);
    console.debug("[attendance] Nhận dữ liệu khuôn mặt từ client", {
      descriptorSource,
      descriptorLength: normalizedDescriptor?.length ?? null,
      referenceCount: referenceDescriptors.length,
      faceError: faceError ?? null,
    });
    if (faceError) {
      faceMatchResult = { status: "REVIEW", score: null, reason: "client_error" };
    } else if (!referenceDescriptors.length) {
      faceMatchResult = { status: "REVIEW", score: null, reason: "empty_profile" };
    } else if (!normalizedDescriptor) {
      faceMatchResult = { status: "REVIEW", score: null, reason: "missing_descriptor" };
    } else {
      faceMatchResult = evaluateFaceMatch({
        descriptor: normalizedDescriptor,
        profileDescriptors: referenceDescriptors,
      });
    }
    console.debug("[attendance] Kết quả so khớp khuôn mặt", {
      status: faceMatchResult?.status ?? null,
      score: faceMatchResult?.score ?? null,
      reason: faceMatchResult?.reason ?? null,
    });
  }

  const attendanceTime = new Date();

  const nextHistory = [
    ...history,
    { loai: isCheckout ? "CHECKOUT" : "CHECKIN", faceMatch: faceMatchResult?.status ?? null },
  ];

  const faceSummary = attendanceMethod === "photo" ? summarizeFaceHistoryRaw(nextHistory) : null;

  let finalStatus = registration.trangThai;
  let entryStatus = "DANG_KY";
  if (attendanceMethod === "photo") {
    if (!isCheckout) {
      if (faceMatchResult?.status === "REVIEW" || faceMatchResult?.status === "REJECTED") {
        entryStatus = "CHO_DUYET";
      }
    } else if (faceSummary?.approvedCount >= 2) {
      finalStatus = "DA_THAM_GIA";
      entryStatus = "DA_THAM_GIA";
    } else if (faceSummary?.requiresReview || (faceSummary?.approvedCount || 0) > 0) {
      finalStatus = "CHO_DUYET";
      entryStatus = "CHO_DUYET";
    } else {
      finalStatus = "VANG_MAT";
      entryStatus = "VANG_MAT";
    }
  } else if (isCheckout) {
    finalStatus = status === "absent" ? "VANG_MAT" : "DA_THAM_GIA";
    entryStatus = finalStatus;
  }

  const registrationUpdate = {
    diemDanhLuc: attendanceTime,
    diemDanhGhiChu: normalizedNote,
    diemDanhBoiId: userId,
  };
  if (isCheckout) {
    registrationUpdate.trangThai = finalStatus;
    if (finalStatus === "DA_THAM_GIA") {
      registrationUpdate.duyetLuc = attendanceTime;
    }
  }

  const faceMeta =
    attendanceMethod === "photo"
      ? {
          descriptorSource,
          descriptorLength: normalizedDescriptor?.length ?? null,
          referenceCount: referenceDescriptors.length,
          reason: faceMatchResult?.reason ?? null,
          faceError: faceError ? String(faceError).slice(0, 100) : null,
          matchThreshold: FACE_MATCH_CONSTANTS.MATCH_THRESHOLD,
          reviewThreshold: FACE_MATCH_CONSTANTS.REVIEW_THRESHOLD,
        }
      : null;

  await prisma.$transaction([
    prisma.dangKyHoatDong.update({
      where: { id: registration.id },
      data: registrationUpdate,
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
        faceMatch: faceMatchResult?.status ?? null,
        faceScore: faceMatchResult?.score ?? null,
        faceMeta,
      },
    }),
  ]);

  const updated = await buildActivityResponse(activityId, userId);
  const success = isCheckout ? finalStatus === "DA_THAM_GIA" : true;

  let notificationTitle;
  let notificationMessage;
  let notificationType;
  let notificationAction;
  let emailSubject;
  const emailMessageLines = [];
  let responseMessage;

  if (isCheckout) {
    if (finalStatus === "DA_THAM_GIA") {
      responseMessage = "Điểm danh cuối giờ thành công, hệ thống đã cộng điểm";
      notificationTitle = "Điểm danh thành công";
      notificationMessage = `Điểm danh cho hoạt động "${activity.tieuDe}" đã được ghi nhận và cộng điểm.`;
      notificationType = "success";
      notificationAction = "ATTENDED";
      emailSubject = `[HUIT Social Credits] Điểm danh thành công - "${activity.tieuDe}"`;
      emailMessageLines.push(
        `Điểm danh cho hoạt động "${activity.tieuDe}" đã được ghi nhận thành công và cộng điểm.`
      );
    } else if (finalStatus === "CHO_DUYET") {
      responseMessage = "Ảnh điểm danh cần xác minh. Vui lòng chờ ban quản trị duyệt.";
      notificationTitle = "Điểm danh đang chờ duyệt";
      notificationMessage = `Hệ thống cần xác minh ảnh điểm danh của bạn cho hoạt động "${activity.tieuDe}".`;
      notificationType = "warning";
      notificationAction = "ATTENDANCE_REVIEW";
      emailSubject = `[HUIT Social Credits] Điểm danh chờ duyệt - "${activity.tieuDe}"`;
      if (faceSummary?.approvedCount === 1 && (faceSummary?.rejectedCount ?? 0) === 0) {
        emailMessageLines.push(
          "Hệ thống chỉ nhận diện trùng khớp một trong hai ảnh điểm danh. Ban quản trị sẽ kiểm tra thủ công."
        );
      } else {
        emailMessageLines.push(
          "Hệ thống chưa thể xác minh tự động ảnh điểm danh. Ban quản trị sẽ kiểm tra thủ công trong thời gian sớm nhất."
        );
      }
    } else {
      responseMessage = "Đã ghi nhận vắng mặt";
      notificationTitle = "Đã ghi nhận vắng mặt";
      notificationMessage = `Bạn được ghi nhận vắng mặt tại hoạt động "${activity.tieuDe}".`;
      notificationType = "danger";
      notificationAction = "ABSENT";
      emailSubject = `[HUIT Social Credits] Ghi nhận vắng mặt - "${activity.tieuDe}"`;
      emailMessageLines.push(
        `Điểm danh cho hoạt động "${activity.tieuDe}" ghi nhận bạn vắng mặt.`
      );
    }
  } else {
    if (attendanceMethod === "photo" && (faceMatchResult?.status === "REVIEW" || faceMatchResult?.status === "REJECTED")) {
      responseMessage = "Đã ghi nhận điểm danh đầu giờ, hệ thống đang chờ xác minh khuôn mặt.";
      notificationTitle = "Điểm danh đầu giờ chờ xác minh";
      notificationMessage = `Ảnh điểm danh đầu giờ của bạn cho hoạt động "${activity.tieuDe}" cần được kiểm tra thêm.`;
      notificationType = "warning";
      notificationAction = "CHECKIN_REVIEW";
      emailSubject = `[HUIT Social Credits] Điểm danh đầu giờ chờ xác minh - "${activity.tieuDe}"`;
      emailMessageLines.push(
        `Hệ thống chưa thể xác nhận tự động ảnh điểm danh đầu giờ cho hoạt động "${activity.tieuDe}". Ban quản trị sẽ xem xét.`
      );
    } else {
      responseMessage = "Điểm danh đầu giờ thành công";
      notificationTitle = "Đã ghi nhận điểm danh đầu giờ";
      notificationMessage = `Điểm danh đầu giờ cho hoạt động "${activity.tieuDe}" đã được ghi nhận.`;
      notificationType = "info";
      notificationAction = "CHECKIN";
      emailSubject = `[HUIT Social Credits] Điểm danh đầu giờ - "${activity.tieuDe}"`;
      emailMessageLines.push(
        `Điểm danh đầu giờ cho hoạt động "${activity.tieuDe}" đã được ghi nhận thành công.`
      );
    }
  }

  if (normalizedNote) {
    emailMessageLines.push(`Ghi chú: ${normalizedNote}`);
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

  const faceProfile = await prisma.faceProfile.findUnique({ where: { nguoiDungId: userId } });
  const faceEnrollmentSummary = summarizeFaceProfile(faceProfile);

  res.json({
    registrations: filtered.map((registration) => ({
      ...mapRegistration(registration, registration.hoatDong),
      activity: mapActivity(registration.hoatDong, registration, { faceEnrollment: faceEnrollmentSummary })
    }))
  });
};
