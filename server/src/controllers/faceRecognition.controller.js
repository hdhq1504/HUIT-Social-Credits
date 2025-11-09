import prisma from "../prisma.js";
import { env } from "../env.js";
import { sanitizeDescriptorCollection, sanitizeSamples } from "../utils/face.js";
import {
  uploadBase64Image,
  removeFiles,
  buildFaceSamplePath,
  isSupabaseConfigured,
} from "../utils/supabaseStorage.js";

const MIN_SAMPLE_COUNT = 5;

export const getFaceProfileStatus = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const profile = await prisma.faceProfile.findUnique({ where: { nguoiDungId: userId } });
  if (!profile) {
    return res.json({ registered: false });
  }

  const descriptors = Array.isArray(profile.descriptors) ? profile.descriptors : [];
  const samples = Array.isArray(profile.samples) ? profile.samples : [];

  res.json({
    registered: true,
    descriptorsCount: descriptors.length,
    samplesCount: samples.length,
    updatedAt: profile.updatedAt?.toISOString?.() ?? null,
    createdAt: profile.createdAt?.toISOString?.() ?? null
  });
};

export const registerFaceProfile = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { descriptors, samples } = req.body || {};
  const sanitizedDescriptors = sanitizeDescriptorCollection(descriptors, MIN_SAMPLE_COUNT);
  if (sanitizedDescriptors.length < MIN_SAMPLE_COUNT) {
    return res.status(400).json({ error: `Cần cung cấp tối thiểu ${MIN_SAMPLE_COUNT} ảnh khuôn mặt hợp lệ` });
  }

  if (!isSupabaseConfigured()) {
    return res.status(500).json({ error: "Dịch vụ lưu trữ chưa được cấu hình" });
  }

  const user = await prisma.nguoiDung.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    return res.status(404).json({ error: "Người dùng không tồn tại" });
  }

  const existingProfile = await prisma.faceProfile.findUnique({ where: { nguoiDungId: userId } });
  const sanitizedSamples = sanitizeSamples(samples, MIN_SAMPLE_COUNT);

  if (sanitizedSamples.length < MIN_SAMPLE_COUNT) {
    return res.status(400).json({ error: `Cần tối thiểu ${MIN_SAMPLE_COUNT} ảnh khuôn mặt để đăng ký` });
  }

  let uploadedSamples;
  try {
    uploadedSamples = await Promise.all(
      sanitizedSamples.map((sample, index) =>
        uploadBase64Image({
          dataUrl: sample.dataUrl,
          bucket: env.SUPABASE_FACE_BUCKET,
          pathPrefix: buildFaceSamplePath(userId),
          fileName: sample.capturedAt
            ? `sample-${index + 1}-${new Date(sample.capturedAt).getTime() || Date.now()}`
            : undefined,
        }).then((result) => ({
          path: result.path,
          url: result.url,
          mimeType: result.mimeType,
          fileName: result.fileName,
          capturedAt: sample.capturedAt ?? null,
        })),
      ),
    );
  } catch (error) {
    console.error("Không thể tải ảnh khuôn mặt lên Supabase:", error);
    return res.status(500).json({ error: "Không thể lưu ảnh khuôn mặt. Vui lòng thử lại." });
  }

  const payload = {
    nguoiDungId: userId,
    descriptors: sanitizedDescriptors,
    samples: uploadedSamples,
  };

  const profile = await prisma.faceProfile.upsert({
    where: { nguoiDungId: userId },
    update: payload,
    create: payload,
  });

  const oldSamplePaths = Array.isArray(existingProfile?.samples)
    ? existingProfile.samples.map((item) => item?.path).filter(Boolean)
    : [];
  if (oldSamplePaths.length) {
    removeFiles(env.SUPABASE_FACE_BUCKET, oldSamplePaths);
  }

  res.json({
    message: "Đăng ký khuôn mặt thành công",
    profile: {
      registered: true,
      descriptorsCount: sanitizedDescriptors.length,
      samplesCount: sanitizedSamples.length,
      updatedAt: profile.updatedAt?.toISOString?.() ?? null
    }
  });
};

export default {
  getFaceProfileStatus,
  registerFaceProfile
};
