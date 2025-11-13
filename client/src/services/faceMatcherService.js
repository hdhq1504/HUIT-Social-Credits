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
  if (typeof value === 'object') {
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

export const normalizeDescriptor = (descriptor) => {
  const arrayLike = coerceArrayLike(descriptor);
  if (!arrayLike) return null;
  const values = arrayLike
    .map((item) => toNumber(item))
    .filter((item) => item !== null);
  if (!values.length) return null;
  return values;
};

export const normalizeDescriptorCollection = (collection) => {
  const arrayLike = coerceArrayLike(collection);
  if (!arrayLike) return [];
  return arrayLike
    .map((descriptor) => normalizeDescriptor(descriptor))
    .filter((descriptor) => Array.isArray(descriptor) && descriptor.length);
};

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

export const evaluateFaceMatch = ({
  descriptor,
  profileDescriptors,
  thresholds = {},
}) => {
  const matchThreshold = typeof thresholds.matchThreshold === 'number' ? thresholds.matchThreshold : MATCH_THRESHOLD;
  const reviewThreshold = typeof thresholds.reviewThreshold === 'number' ? thresholds.reviewThreshold : REVIEW_THRESHOLD;
  const normalizedDescriptor = normalizeDescriptor(descriptor);
  if (!normalizedDescriptor) {
    return { status: 'REVIEW', score: null, reason: 'invalid_descriptor' };
  }
  const candidates = normalizeDescriptorCollection(profileDescriptors).filter(
    (item) => Array.isArray(item) && item.length === normalizedDescriptor.length,
  );
  if (!candidates.length) {
    return { status: 'REVIEW', score: null, reason: 'empty_profile' };
  }
  let bestScore = Infinity;
  candidates.forEach((candidate) => {
    const distance = computeDistance(candidate, normalizedDescriptor);
    if (typeof distance === 'number' && Number.isFinite(distance) && distance < bestScore) {
      bestScore = distance;
    }
  });
  if (!Number.isFinite(bestScore)) {
    return { status: 'REVIEW', score: null, reason: 'distance_failed' };
  }
  if (bestScore <= matchThreshold) {
    return { status: 'APPROVED', score: bestScore };
  }
  if (bestScore <= reviewThreshold) {
    return { status: 'REVIEW', score: bestScore };
  }
  return { status: 'REJECTED', score: bestScore };
};

export default {
  normalizeDescriptor,
  normalizeDescriptorCollection,
  computeDistance,
  evaluateFaceMatch,
};
