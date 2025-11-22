const MATCH_THRESHOLD = 0.45;
const REVIEW_THRESHOLD = 0.6;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const coerceArrayLike = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (ArrayBuffer.isView(value)) return Array.from(value);
  if (typeof value === "object") {
    const length = Number.isInteger(value.length) && value.length >= 0 ? value.length : null;
    if (length && length <= 1024) {
      const result = [];
      for (let index = 0; index < length; index += 1) {
        if (Object.prototype.hasOwnProperty.call(value, index)) {
          result.push(value[index]);
        }
      }
      if (result.length) return result;
    }
    const numericKeys = Object.keys(value)
      .map((key) => Number(key))
      .filter((key) => Number.isInteger(key) && key >= 0)
      .sort((a, b) => a - b);
    if (numericKeys.length) {
      return numericKeys.map((key) => value[key]);
    }
  }
  return null;
};

/**
 * Chuẩn hóa descriptor khuôn mặt (mảng số).
 * @param {Array|Object} descriptor - Descriptor đầu vào.
 * @returns {Array<number>|null} Mảng descriptor đã chuẩn hóa hoặc null.
 */
export const normalizeDescriptor = (descriptor) => {
  const arrayLike = coerceArrayLike(descriptor);
  if (!arrayLike) return null;
  const values = arrayLike
    .map((item) => toNumber(item))
    .filter((item) => item !== null);
  if (!values.length) return null;
  return values;
};

/**
 * Chuẩn hóa danh sách descriptor khuôn mặt.
 * @param {Array} collection - Danh sách descriptor.
 * @returns {Array<Array<number>>} Danh sách descriptor đã chuẩn hóa.
 */
export const normalizeDescriptorCollection = (collection) => {
  const arrayLike = coerceArrayLike(collection);
  if (!arrayLike) return [];
  return arrayLike
    .map((descriptor) => normalizeDescriptor(descriptor))
    .filter((descriptor) => Array.isArray(descriptor) && descriptor.length);
};

/**
 * Tính khoảng cách Euclidean giữa 2 descriptor.
 * @param {Array<number>} a - Descriptor A.
 * @param {Array<number>} b - Descriptor B.
 * @returns {number|null} Khoảng cách hoặc null nếu lỗi.
 */
export const computeDistance = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return null;
  if (a.length !== b.length) return null;
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) {
    const diff = a[index] - b[index];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

/**
 * Đánh giá kết quả so khớp khuôn mặt.
 * @param {Object} params - Tham số đầu vào.
 * @param {Array} params.descriptor - Descriptor cần kiểm tra.
 * @param {Array} params.profileDescriptors - Danh sách descriptor mẫu.
 * @param {number} params.matchThreshold - Ngưỡng khớp (mặc định 0.45).
 * @param {number} params.reviewThreshold - Ngưỡng cần xem xét (mặc định 0.6).
 * @returns {Object} Kết quả đánh giá { status, score, reason }.
 */
export const evaluateFaceMatch = ({ descriptor, profileDescriptors, matchThreshold = MATCH_THRESHOLD, reviewThreshold = REVIEW_THRESHOLD }) => {
  const normalizedDescriptor = normalizeDescriptor(descriptor);
  if (!normalizedDescriptor) {
    return { status: "REVIEW", score: null, reason: "invalid_descriptor" };
  }
  const candidates = normalizeDescriptorCollection(profileDescriptors).filter(
    (item) => Array.isArray(item) && item.length === normalizedDescriptor.length
  );
  if (!candidates.length) {
    return { status: "REVIEW", score: null, reason: "empty_profile" };
  }
  let bestScore = Infinity;
  candidates.forEach((candidate) => {
    const distance = computeDistance(candidate, normalizedDescriptor);
    if (typeof distance === "number" && Number.isFinite(distance) && distance < bestScore) {
      bestScore = distance;
    }
  });
  if (!Number.isFinite(bestScore)) {
    return { status: "REVIEW", score: null, reason: "distance_failed" };
  }
  if (bestScore <= matchThreshold) {
    return { status: "APPROVED", score: bestScore };
  }
  if (bestScore <= reviewThreshold) {
    return { status: "REVIEW", score: bestScore };
  }
  return { status: "REJECTED", score: bestScore };
};

/**
 * Tóm tắt thông tin profile khuôn mặt.
 * @param {Object} profile - Profile khuôn mặt từ DB.
 * @returns {Object} Thông tin tóm tắt { enrolled, sampleCount, updatedAt }.
 */
export const summarizeFaceProfile = (profile) => {
  if (!profile) {
    return { enrolled: false, sampleCount: 0, updatedAt: null };
  }
  const descriptors = normalizeDescriptorCollection(profile.descriptors || []);
  const updatedAt = profile.updatedAt || profile.createdAt || null;
  return {
    enrolled: descriptors.length > 0,
    sampleCount: descriptors.length,
    updatedAt: updatedAt ? new Date(updatedAt).toISOString() : null,
  };
};

export const FACE_MATCH_CONSTANTS = {
  MATCH_THRESHOLD,
  REVIEW_THRESHOLD,
};

export default {
  normalizeDescriptor,
  normalizeDescriptorCollection,
  computeDistance,
  evaluateFaceMatch,
  summarizeFaceProfile,
  FACE_MATCH_CONSTANTS,
};
