import sanitizeHtml from "sanitize-html";
import prisma from "../../prisma.js";
import { env } from "../../env.js";
import { getPointGroupLabel, normalizePointGroup, isValidPointGroup } from "../../utils/points.js";
import { deriveSemesterInfo, resolveAcademicPeriodForDate } from "../../utils/academic.js";
import {
  getAttendanceMethodLabel,
  getDefaultAttendanceMethod,
  mapAttendanceMethodToApi,
  normalizeAttendanceMethod,
} from "../../utils/attendance.js";
import { summarizeFaceProfile } from "../../utils/face.js";
import {
  uploadBase64Image,
  buildAttendancePath,
  isSupabaseConfigured,
  removeFiles,
} from "../../utils/supabaseStorage.js";
import {
  sanitizeStorageMetadata,
  sanitizeStorageList,
  mapStorageForResponse,
  mapStorageListForResponse,
  extractStoragePaths,
} from "../../utils/storageMapper.js";

export const normalizeSemesterLabel = (value) => {
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

export const normalizeAcademicYearLabel = (value) => {
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

export const ACTIVE_REG_STATUSES = ["DANG_KY", "DA_THAM_GIA", "CHO_DUYET"];
export const REGISTRATION_STATUSES = ["DANG_KY", "DA_HUY", "DA_THAM_GIA", "VANG_MAT", "CHO_DUYET"];

export const REGISTRATION_STATUS_LABELS = {
  DANG_KY: "Đã đăng ký",
  DA_HUY: "Đã hủy",
  DA_THAM_GIA: "Đã tham gia",
  VANG_MAT: "Vắng mặt",
  CHO_DUYET: "Chờ duyệt",
};

export const ATTENDANCE_STATUS_LABELS = {
  DANG_KY: "Đã đăng ký",
  DA_THAM_GIA: "Đã tham gia",
  VANG_MAT: "Vắng mặt",
  CHO_DUYET: "Chờ duyệt",
};

export const FACE_MATCH_LABELS = {
  APPROVED: "Khớp với khuôn mặt đã đăng ký",
  REJECTED: "Không khớp với khuôn mặt đã đăng ký",
  REVIEW: "Cần duyệt thủ công",
};

export const FEEDBACK_STATUSES = ["CHO_DUYET", "DA_DUYET", "BI_TU_CHOI"];
export const FEEDBACK_STATUS_LABELS = {
  CHO_DUYET: "Chờ duyệt",
  DA_DUYET: "Đã duyệt",
  BI_TU_CHOI: "Bị từ chối",
};

export const ADMIN_STATUS_MAP = {
  pending: "DANG_KY",
  approved: "DA_THAM_GIA",
  rejected: "VANG_MAT",
  cancelled: "DA_HUY",
  reviewing: "CHO_DUYET",
};

export const toDate = (value) => (value ? new Date(value) : null);

export const formatDateRange = (start, end) => {
  if (!start && !end) return null;
  const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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

export const normalizePageNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
};

export const normalizePageSize = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100) return 20;
  return Math.floor(parsed);
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

export const sanitizeActivityCoverMetadata = (value) =>
  sanitizeStorageMetadata(value, {
    allowedBuckets: ACTIVITY_BUCKET_SET,
    fallbackBucket: env.SUPABASE_ACTIVITY_BUCKET,
  });

export const mapActivityCover = (value) =>
  mapStorageForResponse(value, {
    fallbackBucket: env.SUPABASE_ACTIVITY_BUCKET,
  });

export const mapAttendanceEvidence = (value) =>
  mapStorageForResponse(value, {
    fallbackBucket: env.SUPABASE_ATTENDANCE_BUCKET,
  });

export const sanitizeAttendanceEvidenceMetadata = (value) =>
  sanitizeStorageMetadata(value, {
    allowedBuckets: ATTENDANCE_BUCKET_SET,
    fallbackBucket: env.SUPABASE_ATTENDANCE_BUCKET,
  });

export const mapFeedbackAttachments = (value) =>
  mapStorageListForResponse(value, {
    fallbackBucket: env.SUPABASE_FEEDBACK_BUCKET,
  });

export const sanitizeFeedbackAttachmentList = (value) =>
  sanitizeStorageList(value, {
    allowedBuckets: FEEDBACK_BUCKET_SET,
    fallbackBucket: env.SUPABASE_FEEDBACK_BUCKET,
    limit: 10,
  });

export const USER_PUBLIC_FIELDS = {
  id: true,
  hoTen: true,
  email: true,
  avatarUrl: true,
  maSV: true,
  maLop: true,
  maKhoa: true,
};

export const ACTIVITY_INCLUDE = {
  dangKy: {
    where: { trangThai: { in: ACTIVE_REG_STATUSES } },
    include: {
      nguoiDung: {
        select: USER_PUBLIC_FIELDS,
      },
    },
    orderBy: { dangKyLuc: "asc" },
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
          maLop: true,
        },
      },
    },
    orderBy: { taoLuc: "desc" },
  },
  hocKyRef: {
    include: {
      namHoc: true,
    },
  },
  namHocRef: true,
};

export const REGISTRATION_INCLUDE = {
  phanHoi: true,
  diemDanhBoi: {
    select: {
      id: true,
      hoTen: true,
      email: true,
    },
  },
  lichSuDiemDanh: {
    orderBy: { taoLuc: "asc" },
  },
};

export const ADMIN_STUDENT_FIELDS = {
  id: true,
  hoTen: true,
  email: true,
  avatarUrl: true,
  maSV: true,
  maKhoa: true,
  maLop: true,
  soDT: true,
};

export const ADMIN_REGISTRATION_INCLUDE = {
  ...REGISTRATION_INCLUDE,
  nguoiDung: {
    select: ADMIN_STUDENT_FIELDS,
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
      phuongThucDiemDanh: true,
    },
  },
};

export const mapStudentProfile = (user, { includeContact = false } = {}) => {
  if (!user) return null;
  const profile = {
    id: user.id,
    name: user.hoTen || user.email || "Người dùng",
    email: user.email || null,
    studentCode: user.maSV || null,
    faculty: user.maKhoa || null,
    className: user.maLop || null,
    avatarUrl: user.avatarUrl || null,
  };
  if (includeContact) {
    profile.phoneNumber = user.soDT || null;
  }
  return profile;
};

export const summarizeFaceHistoryRaw = (entries = []) => {
  return entries.reduce(
    (
      acc,
      entry,
    ) => {
      if (!entry) return acc;
      if (entry.faceMatch === "APPROVED") {
        acc.approvedCount += 1;
      } else if (entry.faceMatch === "REJECTED") {
        acc.rejectedCount += 1;
      } else if (entry.faceMatch === "REVIEW") {
        acc.reviewCount += 1;
      }
      if (entry.faceMatch && entry.faceMatch !== "APPROVED") {
        acc.requiresReview = true;
      }
      return acc;
    },
    { approvedCount: 0, rejectedCount: 0, reviewCount: 0, requiresReview: false },
  );
};

export const summarizeFaceHistoryMapped = (entries = []) => {
  const raw = summarizeFaceHistoryRaw(entries);
  const total = entries.length;
  const approvedRatio = total > 0 ? raw.approvedCount / total : 0;
  return {
    ...raw,
    total,
    approvedRatio,
  };
};

export const mapAttendanceEntry = (entry) => {
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
    faceMeta: entry.faceMeta ?? null,
    descriptors: entry.descriptors ?? null,
  };
};

export const normalizeAttachments = (value) => {
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

export const mapFeedback = (feedback) => {
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
    updatedAt: feedback.capNhatLuc?.toISOString() ?? null,
  };
};

export const computeCheckoutAvailableAt = (activity) => {
  if (!activity) return null;
  const end = toDate(activity.ketThucLuc);
  if (!end) return null;
  const threshold = new Date(end.getTime() - 10 * 60 * 1000);
  return threshold.toISOString();
};

export const computeFeedbackAvailableAt = (activity, registration) => {
  const baseTime = registration?.duyetLuc
    ? new Date(registration.duyetLuc)
    : registration?.diemDanhLuc
      ? new Date(registration.diemDanhLuc)
      : toDate(activity?.ketThucLuc) || toDate(activity?.batDauLuc) || new Date();

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const available = new Date(baseTime.getTime() + ONE_DAY_MS);
  return available.toISOString();
};

export const mapRegistration = (registration, activity) => {
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
        name: registration.diemDanhBoi.hoTen ?? registration.diemDanhBoi.email ?? "Người dùng",
      }
      : null,
    attendanceHistory,
    attendanceSummary: {
      hasCheckin,
      hasCheckout,
      nextPhase: !hasCheckin ? "checkin" : !hasCheckout ? "checkout" : null,
      checkoutAvailableAt,
      feedbackAvailableAt,
      face: faceSummary,
    },
    feedback: mapFeedback(registration.phanHoi),
    student: mapStudentProfile(registration.nguoiDung, { includeContact: true }),
  };
};

export const determineState = (activity, registration) => {
  const start = toDate(activity?.batDauLuc);
  const end = toDate(activity?.ketThucLuc);
  const now = new Date();

  if (!registration) {
    if (end && end < now) return "ended";
    return "guest";
  }

  if (registration.trangThai === "DA_THAM_GIA") return "attendance_closed";
  if (registration.trangThai === "CHO_DUYET") return "attendance_review";
  if (registration.trangThai === "VANG_MAT") return "attendance_closed";
  if (registration.trangThai === "DA_HUY") return "cancelled";

  if (!start || !end) {
    return "attendance_open";
  }

  if (end < now) {
    return registration.trangThai === "DANG_KY" ? "attendance_review" : "attendance_closed";
  }

  if (start > now) {
    return "confirm_in";
  }

  if (registration.attendanceSummary?.nextPhase === "checkout") {
    return "confirm_out";
  }

  return "attendance_open";
};

export const mapActivity = (activity, registration, options = {}) => {
  if (!activity) return null;
  const coverMeta = mapActivityCover(activity.hinhAnh);
  const semesterInfo = deriveSemesterInfo(activity.hocKyRef, activity.namHocRef);
  const { semesterLabel, academicYearLabel, semesterRef, academicYearRef } = semesterInfo;
  const attendanceSource = activity.phuongThucDiemDanh || getDefaultAttendanceMethod();
  const attendanceMethod =
    mapAttendanceMethodToApi(attendanceSource) || mapAttendanceMethodToApi(getDefaultAttendanceMethod());
  const attendanceMethodLabel =
    getAttendanceMethodLabel(attendanceMethod) ||
    getAttendanceMethodLabel(mapAttendanceMethodToApi(getDefaultAttendanceMethod()));

  const registrationSummary = mapRegistration(registration, activity);
  const faceEnrollment = options.faceEnrollment ?? summarizeFaceProfile(options.faceProfile ?? null);

  const pointGroup = normalizePointGroup(activity.nhomDiem);
  const pointGroupLabel = pointGroup ? getPointGroupLabel(pointGroup) : null;
  const semesterDisplay = semesterLabel && academicYearLabel ? `${semesterLabel} • ${academicYearLabel}` : null;

  return {
    id: activity.id,
    title: activity.tieuDe,
    description: activity.moTa ? sanitizeRichText(activity.moTa) : null,
    requirements: sanitizeStringArray(activity.yeuCau),
    guidelines: sanitizeStringArray(activity.huongDan),
    points: activity.diemCong ?? 0,
    pointGroup,
    pointGroupLabel,
    startTime: activity.batDauLuc?.toISOString() ?? null,
    endTime: activity.ketThucLuc?.toISOString() ?? null,
    location: activity.diaDiem ?? null,
    capacity: activity.sucChuaToiDa ?? null,
    coverImageUrl:
      coverMeta?.url ?? (typeof activity.hinhAnh === "string" ? activity.hinhAnh : null),
    coverImageMeta: coverMeta,
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
    state: determineState(activity, registrationSummary),
    registration: registrationSummary,
  };
};

export const buildActivityResponse = async (activityId, userId) => {
  const [activity, registration, faceProfile] = await Promise.all([
    prisma.hoatDong.findUnique({
      where: { id: activityId },
      include: ACTIVITY_INCLUDE,
    }),
    userId
      ? prisma.dangKyHoatDong.findUnique({
          where: { nguoiDungId_hoatDongId: { nguoiDungId: userId, hoatDongId: activityId } },
          include: REGISTRATION_INCLUDE,
        })
      : null,
    userId ? prisma.faceProfile.findUnique({ where: { nguoiDungId: userId } }) : null,
  ]);

  if (!activity) return null;
  const faceEnrollment = summarizeFaceProfile(faceProfile);
  return mapActivity(activity, registration, { faceEnrollment, faceProfile });
};

export const mapActivitySummaryForRegistration = (activity) => {
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
    attendanceMethodLabel,
  };
};

export const sanitizeOptionalText = (value, maxLength = 500) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
};

export const sanitizeStringArray = (value, maxLength = 500) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => sanitizeOptionalText(item, maxLength))
    .filter((item) => typeof item === "string" && item.length > 0);
};

export const assertAdmin = (req) => {
  if (req.user?.role !== "ADMIN") {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }
};

export const buildRegistrationSearchCondition = (searchTerm) => {
  if (!searchTerm) return undefined;
  return {
    OR: [
      { nguoiDung: { hoTen: { contains: searchTerm, mode: "insensitive" } } },
      { nguoiDung: { email: { contains: searchTerm, mode: "insensitive" } } },
      { nguoiDung: { maSV: { contains: searchTerm, mode: "insensitive" } } },
      { hoatDong: { tieuDe: { contains: searchTerm, mode: "insensitive" } } },
    ],
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
    "p",
  ]),
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
  h6: ["class"],
};

export const sanitizeRichText = (value, maxLength = 20_000) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const limited = trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
  return sanitizeHtml(limited, {
    allowedTags: RICH_TEXT_ALLOWED_TAGS,
    allowedAttributes: RICH_TEXT_ALLOWED_ATTRIBUTES,
    allowedSchemesByTag: {
      img: ["data", "http", "https"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
};

export const sanitizePoints = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
};

export const sanitizeCapacity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
};

const MAX_ATTENDANCE_EVIDENCE_SIZE = 5_000_000;

export const sanitizeAttendanceEvidence = (value) => {
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

export const processActivityCover = async ({ activityId, payload, existing }) => {
  if (payload === undefined) {
    return { metadata: existing ?? null, removed: [] };
  }

  const sanitizedExisting = existing ? sanitizeActivityCoverMetadata(existing) : null;
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

export const sanitizeStatusFilter = (value, allowed) => (allowed.includes(value) ? value : undefined);

export const removeSupabaseFiles = async (entries = []) => {
  const grouped = entries.reduce((acc, item) => {
    if (!item?.bucket || !item?.path) return acc;
    if (!acc.has(item.bucket)) {
      acc.set(item.bucket, []);
    }
    acc.get(item.bucket).push(item.path);
    return acc;
  }, new Map());

  for (const [bucket, paths] of grouped.entries()) {
    await removeFiles(bucket, paths);
  }
};

export {
  prisma,
  env,
  getAttendanceMethodLabel,
  getDefaultAttendanceMethod,
  mapAttendanceMethodToApi,
  normalizeAttendanceMethod,
  summarizeFaceProfile,
  uploadBase64Image,
  buildAttendancePath,
  isSupabaseConfigured,
  removeFiles,
  extractStoragePaths,
  resolveAcademicPeriodForDate,
  isValidPointGroup,
  normalizePointGroup,
  getPointGroupLabel,
  formatDateRange,
};
