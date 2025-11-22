import prisma from "../prisma.js";
import { env } from "../env.js";
import { mapStorageListForResponse } from "../utils/storageMapper.js";

const STATUS_LABELS = {
  CHO_DUYET: "Chờ duyệt",
  DA_DUYET: "Đã duyệt",
  BI_TU_CHOI: "Từ chối"
};

const ALLOWED_STATUSES = new Set(Object.keys(STATUS_LABELS));
const MAX_REASON_LENGTH = 500;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

const FEEDBACK_LIST_INCLUDE = {
  nguoiDung: {
    select: {
      id: true,
      hoTen: true,
      email: true,
      maSV: true,
      maKhoa: true,
      maLop: true,
      avatarUrl: true
    }
  },
  hoatDong: {
    select: {
      id: true,
      tieuDe: true,
      batDauLuc: true
    }
  }
};

const FEEDBACK_DETAIL_INCLUDE = {
  nguoiDung: {
    select: {
      id: true,
      hoTen: true,
      email: true,
      maSV: true,
      maKhoa: true,
      maLop: true,
      avatarUrl: true,
      soDT: true
    }
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
      sucChuaToiDa: true,
      dangKy: {
        select: {
          id: true
        }
      }
    }
  },
  dangKy: {
    select: {
      id: true,
      trangThai: true,
      diemDanhLuc: true
    }
  }
};

const toIsoString = (value) => (value instanceof Date ? value.toISOString() : value?.toISOString?.() ?? null);

const normalizeString = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const sanitizeReason = (value) => {
  const text = normalizeString(value);
  if (!text) return null;
  return text.slice(0, MAX_REASON_LENGTH);
};

const mapAttachments = (attachments) =>
  mapStorageListForResponse(attachments, {
    fallbackBucket: env.SUPABASE_FEEDBACK_BUCKET,
  }).map((item, index) => ({
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

const mapStudentSummary = (student) => {
  if (!student) return null;
  return {
    id: student.id,
    name: normalizeString(student.hoTen) || normalizeString(student.email) || "Người dùng",
    email: student.email ?? null,
    studentCode: student.maSV ?? null,
    faculty: student.maKhoa ?? null,
    className: student.maLop ?? null,
    avatarUrl: student.avatarUrl ?? null,
    phone: student.soDT ?? null
  };
};

const mapActivitySummary = (activity) => {
  if (!activity) return null;
  return {
    id: activity.id,
    title: normalizeString(activity.tieuDe) || "Hoạt động",
    startTime: toIsoString(activity.batDauLuc),
    endTime: toIsoString(activity.ketThucLuc),
    points: activity.diemCong ?? 0,
    pointGroup: activity.nhomDiem ?? null,
    location: activity.diaDiem ?? null,
    maxParticipants: activity.sucChuaToiDa ?? null,
    participantCount: Array.isArray(activity.dangKy) ? activity.dangKy.length : 0
  };
};

const mapFeedbackListItem = (feedback) => ({
  id: feedback.id,
  status: feedback.trangThai,
  statusLabel: STATUS_LABELS[feedback.trangThai] || feedback.trangThai,
  reason: feedback.lyDoTuChoi ?? null,
  submittedAt: toIsoString(feedback.taoLuc),
  updatedAt: toIsoString(feedback.capNhatLuc),
  student: mapStudentSummary(feedback.nguoiDung),
  activity: mapActivitySummary(feedback.hoatDong)
});

const mapFeedbackDetail = (feedback) => ({
  id: feedback.id,
  status: feedback.trangThai,
  statusLabel: STATUS_LABELS[feedback.trangThai] || feedback.trangThai,
  content: feedback.noiDung,
  rating: feedback.danhGia ?? null,
  reason: feedback.lyDoTuChoi ?? null,
  submittedAt: toIsoString(feedback.taoLuc),
  updatedAt: toIsoString(feedback.capNhatLuc),
  attachments: mapAttachments(feedback.minhChung),
  student: mapStudentSummary(feedback.nguoiDung),
  activity: mapActivitySummary(feedback.hoatDong),
  registration: feedback.dangKy
    ? {
      id: feedback.dangKy.id,
      status: feedback.dangKy.trangThai,
      checkedInAt: toIsoString(feedback.dangKy.diemDanhLuc)
    }
    : null
});

const getFeedbackStats = async () => {
  const [total, pending, approved, rejected] = await Promise.all([
    prisma.phanHoiHoatDong.count(),
    prisma.phanHoiHoatDong.count({ where: { trangThai: "CHO_DUYET" } }),
    prisma.phanHoiHoatDong.count({ where: { trangThai: "DA_DUYET" } }),
    prisma.phanHoiHoatDong.count({ where: { trangThai: "BI_TU_CHOI" } })
  ]);

  return { total, pending, approved, rejected };
};

const buildFilterOptions = async () => {
  const [facultiesRaw, classesRaw, activitiesRaw] = await Promise.all([
    prisma.nguoiDung.findMany({
      where: { phanHoi: { some: {} }, maKhoa: { not: null } },
      select: { maKhoa: true },
      distinct: ["maKhoa"]
    }),
    prisma.nguoiDung.findMany({
      where: { phanHoi: { some: {} }, maLop: { not: null } },
      select: { maLop: true },
      distinct: ["maLop"]
    }),
    prisma.hoatDong.findMany({
      where: { phanHoi: { some: {} } },
      select: { id: true, tieuDe: true }
    })
  ]);

  const sortAlpha = (a, b) => a.localeCompare(b, "vi", { sensitivity: "base" });

  const faculties = facultiesRaw
    .map((item) => normalizeString(item.maKhoa))
    .filter(Boolean)
    .sort(sortAlpha)
    .map((value) => ({ value, label: value }));

  const classes = classesRaw
    .map((item) => normalizeString(item.maLop))
    .filter(Boolean)
    .sort(sortAlpha)
    .map((value) => ({ value, label: value }));

  const activities = activitiesRaw
    .map((item) => ({
      value: item.id,
      label: normalizeString(item.tieuDe) || "Hoạt động"
    }))
    .sort((a, b) => sortAlpha(a.label, b.label));

  const statuses = Array.from(ALLOWED_STATUSES).map((value) => ({
    value,
    label: STATUS_LABELS[value]
  }));

  return { faculties, classes, activities, statuses };
};

const buildListWhereClause = ({ search, faculty, className, activityId, status }) => {
  const filters = [];

  const normalizedStatus = normalizeString(status)?.toUpperCase();
  if (normalizedStatus && ALLOWED_STATUSES.has(normalizedStatus)) {
    filters.push({ trangThai: normalizedStatus });
  }

  const normalizedFaculty = normalizeString(faculty);
  if (normalizedFaculty) {
    filters.push({ nguoiDung: { maKhoa: normalizedFaculty } });
  }

  const normalizedClass = normalizeString(className);
  if (normalizedClass) {
    filters.push({ nguoiDung: { maLop: normalizedClass } });
  }

  const normalizedActivity = normalizeString(activityId);
  if (normalizedActivity) {
    filters.push({ hoatDongId: normalizedActivity });
  }

  const normalizedSearch = normalizeString(search);
  if (normalizedSearch) {
    filters.push({
      OR: [
        { noiDung: { contains: normalizedSearch, mode: "insensitive" } },
        { nguoiDung: { hoTen: { contains: normalizedSearch, mode: "insensitive" } } },
        { nguoiDung: { email: { contains: normalizedSearch, mode: "insensitive" } } },
        { nguoiDung: { maSV: { contains: normalizedSearch, mode: "insensitive" } } },
        { hoatDong: { tieuDe: { contains: normalizedSearch, mode: "insensitive" } } }
      ]
    });
  }

  if (!filters.length) return {};
  if (filters.length === 1) return filters[0];
  return { AND: filters };
};

/**
 * Lấy danh sách phản hồi (Admin).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const listFeedbacks = async (req, res) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const {
    page = "1",
    pageSize = String(DEFAULT_PAGE_SIZE),
    search,
    faculty,
    class: className,
    activityId,
    status
  } = req.query || {};

  const pageNumber = Number.parseInt(page, 10);
  const sizeNumber = Number.parseInt(pageSize, 10);
  const take = Number.isFinite(sizeNumber) ? Math.min(Math.max(sizeNumber, 1), MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const skip = (currentPage - 1) * take;

  const where = buildListWhereClause({ search, faculty, className, activityId, status });

  const [totalItems, items, stats, filters] = await Promise.all([
    prisma.phanHoiHoatDong.count({ where }),
    prisma.phanHoiHoatDong.findMany({
      where,
      include: FEEDBACK_LIST_INCLUDE,
      orderBy: { taoLuc: "desc" },
      skip,
      take
    }),
    getFeedbackStats(),
    buildFilterOptions()
  ]);

  const feedbacks = items.map((item) => mapFeedbackListItem(item));
  const pageCount = take ? Math.ceil(totalItems / take) : 0;

  res.json({
    feedbacks,
    pagination: {
      total: totalItems,
      page: currentPage,
      pageSize: take,
      pageCount
    },
    stats,
    filters
  });
};

/**
 * Lấy chi tiết phản hồi.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getFeedbackDetail = async (req, res) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { id } = req.params;
  const normalizedId = normalizeString(id);
  if (!normalizedId) {
    return res.status(400).json({ error: "Thiếu mã phản hồi" });
  }

  const feedback = await prisma.phanHoiHoatDong.findUnique({
    where: { id: normalizedId },
    include: FEEDBACK_DETAIL_INCLUDE
  });

  if (!feedback) {
    return res.status(404).json({ error: "Phản hồi không tồn tại" });
  }

  const stats = await getFeedbackStats();

  res.json({
    feedback: mapFeedbackDetail(feedback),
    stats
  });
};

/**
 * Duyệt hoặc từ chối phản hồi.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const decideFeedbackStatus = async (req, res) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { ids, status, reason } = req.body || {};
  const normalizedIds = Array.isArray(ids)
    ? ids.map((value) => normalizeString(value)).filter(Boolean)
    : [];

  if (!normalizedIds.length) {
    return res.status(400).json({ error: "Danh sách phản hồi không hợp lệ" });
  }

  const normalizedStatus = normalizeString(status)?.toUpperCase();
  if (!normalizedStatus || !ALLOWED_STATUSES.has(normalizedStatus)) {
    return res.status(400).json({ error: "Trạng thái cập nhật không hợp lệ" });
  }

  let normalizedReason = null;
  if (normalizedStatus === "BI_TU_CHOI") {
    normalizedReason = sanitizeReason(reason);
    if (!normalizedReason) {
      return res.status(400).json({ error: "Lý do từ chối là bắt buộc" });
    }
  }

  const updateResult = await prisma.phanHoiHoatDong.updateMany({
    where: { id: { in: normalizedIds } },
    data: {
      trangThai: normalizedStatus,
      lydoTuChoi: normalizedStatus === "BI_TU_CHOI" ? normalizedReason : null
    }
  });

  if (updateResult.count === 0) {
    return res.status(404).json({ error: "Không tìm thấy phản hồi phù hợp" });
  }

  const stats = await getFeedbackStats();
  const message =
    normalizedStatus === "DA_DUYET" ? "Đã duyệt phản hồi thành công" : "Đã từ chối phản hồi";

  res.json({ message, updated: updateResult.count, stats });
};

export default {
  listFeedbacks,
  getFeedbackDetail,
  decideFeedbackStatus
};
