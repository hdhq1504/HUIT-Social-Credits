const MATCH_THRESHOLD = 0.45;
const REVIEW_THRESHOLD = 0.6;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeDescriptor = (descriptor) => {
  if (!Array.isArray(descriptor)) return null;
  const values = descriptor
    .map((item) => toNumber(item))
    .filter((item) => item !== null);
  if (!values.length) return null;
  return values;
};

export const normalizeDescriptorCollection = (collection) => {
  if (!Array.isArray(collection)) return [];
  return collection
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
