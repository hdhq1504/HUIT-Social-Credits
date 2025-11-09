import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { env } from "../env.js";

const supabaseClient = env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
  : null;

export const isSupabaseConfigured = () => Boolean(supabaseClient);

const ensureClient = () => {
  if (!supabaseClient) {
    const error = new Error("SUPABASE_NOT_CONFIGURED");
    error.code = "SUPABASE_NOT_CONFIGURED";
    throw error;
  }
  return supabaseClient;
};

const parseDataUrl = (dataUrl) => {
  if (typeof dataUrl !== "string") {
    throw new Error("INVALID_DATA_URL");
  }
  const trimmed = dataUrl.trim();
  const matches = /^data:(?<mime>[^;]+);base64,(?<data>[A-Za-z0-9+/=]+)$/.exec(trimmed);
  if (!matches?.groups?.mime || !matches?.groups?.data) {
    throw new Error("INVALID_DATA_URL");
  }
  const { mime, data } = matches.groups;
  const buffer = Buffer.from(data, "base64");
  if (!buffer.length) {
    throw new Error("EMPTY_DATA_PAYLOAD");
  }
  return { mimeType: mime, buffer };
};

const inferExtension = (mimeType) => {
  if (!mimeType) return "bin";
  const [, subtype] = mimeType.split("/");
  if (!subtype) return "bin";
  if (subtype.includes("+")) {
    return subtype.split("+")[0];
  }
  return subtype;
};

const buildFilePath = (pathPrefix, extension, explicitName) => {
  const safePrefix = pathPrefix ? pathPrefix.replace(/^[\/]+|[\/]+$/g, "") : "";
  const fileName = explicitName
    ? explicitName.replace(/[^a-zA-Z0-9._-]/g, "_")
    : `${Date.now()}-${crypto.randomUUID()}`;
  const normalized = extension ? `${fileName}.${extension}` : fileName;
  return safePrefix ? `${safePrefix}/${normalized}` : normalized;
};

const buildPublicUrl = (bucket, path) => {
  if (!path) return null;
  const client = ensureClient();
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  if (data?.publicUrl) {
    return data.publicUrl;
  }
  if (env.SUPABASE_PUBLIC_URL) {
    const base = env.SUPABASE_PUBLIC_URL.replace(/\/+$/, "");
    const normalizedPath = path.replace(/^[\/]+/, "");
    return `${base}/${bucket}/${normalizedPath}`;
  }
  return null;
};

export const uploadBase64Image = async ({
  dataUrl,
  bucket,
  pathPrefix,
  fileName,
}) => {
  const client = ensureClient();
  if (!bucket) {
    throw new Error("SUPABASE_BUCKET_REQUIRED");
  }
  const { mimeType, buffer } = parseDataUrl(dataUrl);
  const extension = inferExtension(mimeType);
  const path = buildFilePath(pathPrefix, extension, fileName);
  const { error } = await client.storage.from(bucket).upload(path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) {
    throw new Error(error.message || "SUPABASE_UPLOAD_FAILED");
  }
  const publicUrl = buildPublicUrl(bucket, path);
  return {
    path,
    url: publicUrl,
    mimeType,
    size: buffer.length,
    fileName: path.split("/").pop(),
  };
};

export const removeFiles = async (bucket, paths = []) => {
  if (!isSupabaseConfigured()) return;
  if (!bucket || !Array.isArray(paths) || !paths.length) return;
  const normalized = paths.map((p) => p.replace(/^[\/]+/, "")).filter(Boolean);
  if (!normalized.length) return;
  try {
    await ensureClient().storage.from(bucket).remove(normalized);
  } catch (error) {
    console.warn("Không thể xóa file Supabase:", error?.message || error);
  }
};

export const buildFaceSamplePath = (userId) => {
  const safeUser = userId?.replace(/[^a-zA-Z0-9_-]/g, "");
  return safeUser ? `face/${safeUser}` : "face";
};

export const buildAttendancePath = ({ userId, activityId }) => {
  const safeUser = userId?.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeActivity = activityId?.replace(/[^a-zA-Z0-9_-]/g, "");
  const segments = ["attendance"];
  if (safeActivity) segments.push(safeActivity);
  if (safeUser) segments.push(safeUser);
  return segments.join("/");
};

export default {
  isSupabaseConfigured,
  uploadBase64Image,
  removeFiles,
  buildFaceSamplePath,
  buildAttendancePath,
};
