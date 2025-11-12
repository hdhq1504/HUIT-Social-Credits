import { supabase } from '../config/supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const normalizeBucketName = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed;
};

const BUCKETS = {
  feedback: normalizeBucketName(import.meta.env.VITE_SUPABASE_FEEDBACK_BUCKET, 'feedback-proofs'),
  attendance: normalizeBucketName(import.meta.env.VITE_SUPABASE_ATTENDANCE_BUCKET, 'attendance-photos'),
};

const ensureFileSize = (file) => {
  if (!file) {
    throw new Error('Không có tệp để tải lên');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File quá lớn. Kích thước tối đa 5MB');
  }
};

const sanitizeSegment = (value, fallback) => {
  if (!value) return fallback;
  const trimmed = String(value).trim();
  if (!trimmed) return fallback;
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || fallback;
};

const randomId = () =>
  (typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));

const buildFeedbackPath = (userId, activityId, file) => {
  const ext = file.name?.split('.').pop()?.toLowerCase() || 'dat';
  const owner = sanitizeSegment(userId, 'user');
  const activity = sanitizeSegment(activityId, 'general');
  return `feedback/${activity}/${owner}-${Date.now()}-${randomId()}.${ext}`;
};

const buildAttendancePath = ({ userId, activityId, phase, file }) => {
  const ext = file.name?.split('.').pop()?.toLowerCase() || 'dat';
  const owner = sanitizeSegment(userId, 'user');
  const activity = sanitizeSegment(activityId, 'general');
  const step = sanitizeSegment(phase, 'checkin');
  return `attendance/${activity}/${owner}/${Date.now()}-${step}-${randomId()}.${ext}`;
};

const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
};

export const uploadFeedbackEvidence = async (file, { userId, activityId }) => {
  ensureFileSize(file);
  const bucket = BUCKETS.feedback;
  const path = buildFeedbackPath(userId, activityId, file);

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || 'Không thể upload minh chứng');
  }

  const storagePath = data?.path || path;
  return {
    bucket,
    path: storagePath,
    url: getPublicUrl(bucket, storagePath),
    fileName: file.name,
    mimeType: file.type || null,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
};

export const uploadAttendanceEvidence = async (file, { userId, activityId, phase }) => {
  ensureFileSize(file);
  const bucket = BUCKETS.attendance;
  const path = buildAttendancePath({ userId, activityId, phase, file });

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });

  if (error) {
    const uploadError = new Error(error.message || 'Không thể upload ảnh điểm danh');
    if (error.statusCode || error.status) {
      uploadError.status = error.statusCode || error.status;
    }
    if (error.error) {
      uploadError.code = error.error;
    }
    if (error.error_description || error.msg) {
      uploadError.details = error.error_description || error.msg;
    }
    throw uploadError;
  }

  const storagePath = data?.path || path;
  return {
    bucket,
    path: storagePath,
    url: getPublicUrl(bucket, storagePath),
    fileName: file.name,
    mimeType: file.type || null,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    phase: phase || null,
  };
};

export const uploadMultipleFeedbackEvidence = async (files, options) => {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }
  const uploads = files.map((file) => uploadFeedbackEvidence(file, options));
  return Promise.all(uploads);
};

const uploadService = {
  uploadFeedbackEvidence,
  uploadMultipleFeedbackEvidence,
  uploadAttendanceEvidence,
};

export default uploadService;
