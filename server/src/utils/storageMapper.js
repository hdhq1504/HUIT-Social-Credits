import { env } from "../env.js";
import { buildPublicUrl, isSupabaseConfigured } from "./supabaseStorage.js";

const sanitizeString = (value, maxLength = 255) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!Number.isFinite(maxLength) || maxLength <= 0) return trimmed;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

const toNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const defaultBuckets = [
  env.SUPABASE_ACTIVITY_BUCKET,
  env.SUPABASE_ATTENDANCE_BUCKET,
  env.SUPABASE_FEEDBACK_BUCKET,
  env.SUPABASE_FACE_BUCKET,
]
  .map((bucket) => sanitizeString(bucket, 120))
  .filter(Boolean);

const defaultBucketSet = new Set(defaultBuckets);

const resolvePublicUrl = (bucket, path, fallbackUrl = null) => {
  if (fallbackUrl && typeof fallbackUrl === "string") {
    return fallbackUrl;
  }
  if (!bucket || !path) return null;
  try {
    if (!isSupabaseConfigured()) {
      return fallbackUrl;
    }
    return buildPublicUrl(bucket, path);
  } catch (error) {
    return fallbackUrl;
  }
};

/**
 * Chuẩn hóa metadata của file lưu trữ.
 * @param {Object|string} value - Metadata hoặc đường dẫn file.
 * @param {Object} options - Tùy chọn (allowedBuckets, fallbackBucket).
 * @returns {Object|null} Metadata đã chuẩn hóa.
 */
export const sanitizeStorageMetadata = (
  value,
  { allowedBuckets = defaultBucketSet, fallbackBucket = null } = {},
) => {
  if (!value) return null;

  const bucketSet =
    allowedBuckets instanceof Set
      ? allowedBuckets
      : new Set(
        Array.isArray(allowedBuckets)
          ? allowedBuckets.map((item) => sanitizeString(item, 120)).filter(Boolean)
          : [],
      );

  if (typeof value === "string") {
    const path = sanitizeString(value, 1024);
    if (!path) return null;
    const bucket = sanitizeString(fallbackBucket, 120);
    if (!bucket || (bucketSet.size && !bucketSet.has(bucket))) {
      return null;
    }
    return {
      bucket,
      path,
      fileName: path.split("/").pop() ?? null,
      mimeType: null,
      size: null,
      url: resolvePublicUrl(bucket, path),
      uploadedAt: null,
    };
  }

  if (typeof value !== "object") return null;

  const bucket = sanitizeString(value.bucket, 120) || sanitizeString(fallbackBucket, 120);
  if (!bucket || (bucketSet.size && !bucketSet.has(bucket))) {
    return null;
  }

  const path =
    sanitizeString(value.path, 1024) ||
    sanitizeString(value.filePath, 1024) ||
    sanitizeString(value.location, 1024);

  if (!path) return null;

  const mimeType = sanitizeString(value.mimeType, 100);
  const size = toNumber(value.size);
  const uploadedAt = value.uploadedAt
    ? new Date(value.uploadedAt).toISOString()
    : null;
  const url = sanitizeString(value.url, 2048) || resolvePublicUrl(bucket, path);
  const fileName =
    sanitizeString(value.fileName, 255) ||
    sanitizeString(value.name, 255) ||
    path.split("/").pop() ||
    null;

  const metadata = {
    bucket,
    path,
    fileName,
    mimeType,
    size,
    url,
    uploadedAt,
  };

  return metadata;
};

/**
 * Chuẩn hóa danh sách file lưu trữ.
 * @param {Array} list - Danh sách file.
 * @param {Object} options - Tùy chọn.
 * @returns {Array<Object>} Danh sách metadata đã chuẩn hóa.
 */
export const sanitizeStorageList = (
  list,
  { allowedBuckets = defaultBucketSet, fallbackBucket = null, limit = 10 } = {},
) => {
  if (!Array.isArray(list)) return [];
  const bucketSet =
    allowedBuckets instanceof Set
      ? allowedBuckets
      : new Set(
        Array.isArray(allowedBuckets)
          ? allowedBuckets.map((item) => sanitizeString(item, 120)).filter(Boolean)
          : [],
      );
  const sanitized = list
    .map((item) => sanitizeStorageMetadata(item, { allowedBuckets: bucketSet, fallbackBucket }))
    .filter(Boolean);
  if (!limit || !Number.isFinite(limit) || limit <= 0) {
    return sanitized;
  }
  return sanitized.slice(0, limit);
};

/**
 * Map metadata file sang format response API.
 * @param {Object|string} value - Metadata hoặc đường dẫn.
 * @param {Object} options - Tùy chọn.
 * @returns {Object|null} Object response.
 */
export const mapStorageForResponse = (value, { fallbackBucket = null } = {}) => {
  if (!value) return null;
  if (typeof value === "string") {
    const sanitized = sanitizeStorageMetadata(value, { fallbackBucket });
    return sanitized;
  }
  if (typeof value !== "object") return null;
  const bucket = sanitizeString(value.bucket, 120) || sanitizeString(fallbackBucket, 120);
  const path =
    sanitizeString(value.path, 1024) ||
    sanitizeString(value.filePath, 1024) ||
    sanitizeString(value.location, 1024);
  if (!bucket || !path) return null;

  const mimeType = sanitizeString(value.mimeType, 100);
  const fileName =
    sanitizeString(value.fileName, 255) ||
    sanitizeString(value.name, 255) ||
    path.split("/").pop() ||
    null;
  const size = toNumber(value.size);
  const uploadedAt = value.uploadedAt
    ? new Date(value.uploadedAt).toISOString()
    : null;
  const url = sanitizeString(value.url, 2048) || resolvePublicUrl(bucket, path);

  return {
    bucket,
    path,
    fileName,
    mimeType,
    size,
    url,
    uploadedAt,
  };
};

/**
 * Map danh sách file sang format response API.
 * @param {Array} list - Danh sách file.
 * @param {Object} options - Tùy chọn.
 * @returns {Array<Object>} Danh sách response.
 */
export const mapStorageListForResponse = (list, { fallbackBucket = null } = {}) => {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => mapStorageForResponse(item, { fallbackBucket }))
    .filter(Boolean);
};

/**
 * Trích xuất danh sách đường dẫn file từ danh sách metadata.
 * @param {Array} list - Danh sách metadata.
 * @returns {Array<string>} Danh sách đường dẫn.
 */
export const extractStoragePaths = (list) => {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => (typeof item === "object" ? item.path : item))
    .map((path) => (typeof path === "string" ? path.trim() : ""))
    .filter(Boolean);
};

export default {
  sanitizeStorageMetadata,
  sanitizeStorageList,
  mapStorageForResponse,
  mapStorageListForResponse,
  extractStoragePaths,
};
