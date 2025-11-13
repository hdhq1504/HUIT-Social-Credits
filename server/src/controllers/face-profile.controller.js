import prisma from "../prisma.js";
import {
  FACE_MATCH_CONSTANTS,
  normalizeDescriptorCollection,
  summarizeFaceProfile,
} from "../utils/face.js";

const MIN_DESCRIPTOR_COUNT = 3;

const sanitizeSamples = (value) => {
  if (!Array.isArray(value)) return null;
  const normalized = value
    .slice(0, 5)
    .map((item) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (!trimmed.startsWith("data:image")) return null;
        return trimmed.length > 5000 ? `${trimmed.slice(0, 5000)}...` : trimmed;
      }
      if (item && typeof item === "object") {
        const dataUrl = typeof item.dataUrl === "string" ? item.dataUrl.trim() : null;
        if (!dataUrl || !dataUrl.startsWith("data:image")) return null;
        return dataUrl.length > 5000 ? `${dataUrl.slice(0, 5000)}...` : dataUrl;
      }
      return null;
    })
    .filter(Boolean);
  return normalized.length ? normalized : null;
};

export const getMyFaceProfile = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Không xác định được người dùng" });

  const profile = await prisma.faceProfile.findUnique({ where: { nguoiDungId: userId } });
  const summary = summarizeFaceProfile(profile);

  res.json({
    profile: {
      ...summary,
      thresholds: FACE_MATCH_CONSTANTS,
    },
  });
};

export const upsertMyFaceProfile = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Không xác định được người dùng" });

  const { descriptors, samples } = req.body || {};
  const normalizedDescriptors = normalizeDescriptorCollection(descriptors);

  if (!normalizedDescriptors.length) {
    return res.status(400).json({ error: "Vui lòng cung cấp ít nhất 1 mẫu khuôn mặt hợp lệ." });
  }

  if (normalizedDescriptors.length < MIN_DESCRIPTOR_COUNT) {
    return res.status(400).json({ error: `Vui lòng chụp tối thiểu ${MIN_DESCRIPTOR_COUNT} ảnh khuôn mặt rõ nét.` });
  }

  const payload = {
    descriptors: normalizedDescriptors,
    samples: sanitizeSamples(samples),
  };

  const existing = await prisma.faceProfile.findUnique({ where: { nguoiDungId: userId } });
  let profile;
  if (existing) {
    profile = await prisma.faceProfile.update({ where: { id: existing.id }, data: payload });
  } else {
    profile = await prisma.faceProfile.create({ data: { ...payload, nguoiDungId: userId } });
  }

  const summary = summarizeFaceProfile(profile);
  res.json({
    message: "Đã cập nhật hồ sơ khuôn mặt.",
    profile: {
      ...summary,
      thresholds: FACE_MATCH_CONSTANTS,
    },
  });
};
