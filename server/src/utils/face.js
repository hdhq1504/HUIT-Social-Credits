export const DESCRIPTOR_LENGTH = 128;

export const MATCH_APPROVED_THRESHOLD = 0.4;
export const MATCH_REVIEW_THRESHOLD = 0.6;

const clamp = (value, min, max) => {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export const euclideanDistance = (a, b) => {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) * (a[i] - b[i]);
  }
  return Math.sqrt(sum);
};

export const sanitizeDescriptor = (value) => {
  if (!Array.isArray(value) || value.length !== DESCRIPTOR_LENGTH) {
    return null;
  }
  const sanitized = [];
  for (let i = 0; i < DESCRIPTOR_LENGTH; i += 1) {
    const raw = Number(value[i]);
    if (!Number.isFinite(raw)) {
      return null;
    }
    sanitized.push(raw);
  }
  return sanitized;
};

export const sanitizeDescriptorCollection = (value, minLength = 1) => {
  if (!Array.isArray(value)) return [];
  const sanitized = value
    .map((item) => sanitizeDescriptor(item))
    .filter((item) => Array.isArray(item) && item.length === DESCRIPTOR_LENGTH);
  if (sanitized.length < minLength) return [];
  return sanitized.slice(0, Math.max(minLength, sanitized.length));
};

export const sanitizeSamples = (value, maxItems = 5) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (!trimmed || trimmed.length > 2_000_000) return null;
        if (!trimmed.startsWith("data:")) return null;
        return { dataUrl: trimmed };
      }
      if (typeof item === "object") {
        const raw = typeof item.data === "string" ? item.data : typeof item.dataUrl === "string" ? item.dataUrl : null;
        const dataUrl = raw?.trim();
        if (!dataUrl || !dataUrl.startsWith("data:")) return null;
        if (dataUrl.length > 2_000_000) return null;
        const capturedAt = typeof item.capturedAt === "string" ? item.capturedAt : null;
        return { dataUrl, capturedAt };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, maxItems);
};

export const deriveMatchStatus = (distance) => {
  if (!Number.isFinite(distance)) return "REJECTED";
  if (distance <= MATCH_APPROVED_THRESHOLD) return "APPROVED";
  if (distance <= MATCH_REVIEW_THRESHOLD) return "REVIEW";
  return "REJECTED";
};

export const computeMatchConfidence = (storedDescriptors, targetDescriptor) => {
  const descriptors = sanitizeDescriptorCollection(storedDescriptors);
  const target = sanitizeDescriptor(targetDescriptor);
  if (!descriptors.length || !target) {
    return { confidence: 0, bestDescriptor: null, distance: Infinity, status: "REJECTED" };
  }

  let minDistance = Infinity;
  let bestDescriptor = null;

  for (const descriptor of descriptors) {
    const distance = euclideanDistance(descriptor, target);
    if (distance < minDistance) {
      minDistance = distance;
      bestDescriptor = descriptor;
    }
  }

  const confidence = clamp(1 - minDistance / 1.2, 0, 1);
  const status = deriveMatchStatus(minDistance);
  return { confidence, bestDescriptor, distance: minDistance, status };
};

export const compareDescriptors = (a, b) => {
  const left = sanitizeDescriptor(a);
  const right = sanitizeDescriptor(b);
  if (!left || !right) {
    return { confidence: 0, distance: Infinity, status: "REJECTED" };
  }
  const distance = euclideanDistance(left, right);
  const confidence = clamp(1 - distance / 1.2, 0, 1);
  const status = deriveMatchStatus(distance);
  return { confidence, distance, status };
};

export default {
  sanitizeDescriptor,
  sanitizeDescriptorCollection,
  sanitizeSamples,
  computeMatchConfidence,
  deriveMatchStatus,
  compareDescriptors,
  euclideanDistance,
};
