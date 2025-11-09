const DESCRIPTOR_LENGTH = 128;
const MAX_DESCRIPTOR_ABS_VALUE = 10;
const PRECISION = 1_000_000;

const clamp = (value, min, max) => {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
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
    const limited = clamp(raw, -MAX_DESCRIPTOR_ABS_VALUE, MAX_DESCRIPTOR_ABS_VALUE);
    const rounded = Math.round(limited * PRECISION) / PRECISION;
    sanitized.push(rounded);
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

const dotProduct = (a, b) => {
  let dot = 0;
  for (let i = 0; i < DESCRIPTOR_LENGTH; i += 1) {
    dot += a[i] * b[i];
  }
  return dot;
};

const magnitude = (arr) => Math.sqrt(arr.reduce((sum, value) => sum + value * value, 0));

export const computeCosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  if (a.length !== DESCRIPTOR_LENGTH || b.length !== DESCRIPTOR_LENGTH) return 0;
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return clamp(dotProduct(a, b) / (magA * magB), -1, 1);
};

export const computeMatchConfidence = (storedDescriptors, targetDescriptor) => {
  const descriptors = sanitizeDescriptorCollection(storedDescriptors);
  const target = sanitizeDescriptor(targetDescriptor);
  if (!descriptors.length || !target) return { confidence: 0, bestDescriptor: null };

  let best = -Infinity;
  let bestDescriptor = null;
  for (const descriptor of descriptors) {
    const similarity = computeCosineSimilarity(descriptor, target);
    if (similarity > best) {
      best = similarity;
      bestDescriptor = descriptor;
    }
  }

  const confidence = clamp((best + 1) / 2, 0, 1);
  return { confidence, bestDescriptor };
};

export const deriveMatchStatus = (confidence) => {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) {
    return "REJECTED";
  }
  if (confidence >= 0.7) return "APPROVED";
  if (confidence >= 0.5) return "REVIEW";
  return "REJECTED";
};

export default {
  sanitizeDescriptor,
  sanitizeDescriptorCollection,
  sanitizeSamples,
  computeCosineSimilarity,
  computeMatchConfidence,
  deriveMatchStatus
};
