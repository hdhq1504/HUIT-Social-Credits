import {
  prisma,
  env,
  REGISTRATION_INCLUDE,
  sanitizeFeedbackAttachmentList,
  extractStoragePaths,
  removeFiles,
  mapFeedback,
  buildActivityResponse,
} from "./shared.js";
import { notifyUser } from "../../utils/notification.service.js";

export const submitActivityFeedback = async (req, res) => {
  const userId = req.user?.sub;
  const { id: activityId } = req.params;
  const { content, rating, attachments } = req.body || {};

  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: "Nội dung phản hồi không được bỏ trống" });
  }

  const user = await prisma.nguoiDung.findUnique({
    where: { id: userId },
    select: { id: true, email: true, hoTen: true },
  });
  if (!user) return res.status(404).json({ error: "Người dùng không tồn tại" });

  const registration = await prisma.dangKyHoatDong.findUnique({
    where: { nguoiDungId_hoatDongId: { nguoiDungId: userId, hoatDongId: activityId } },
    include: { ...REGISTRATION_INCLUDE, hoatDong: true },
  });

  if (!registration || registration.trangThai === "DA_HUY") {
    return res.status(404).json({ error: "Bạn chưa đăng ký hoạt động này hoặc đã hủy trước đó" });
  }

  if (registration.trangThai !== "DA_THAM_GIA") {
    return res.status(400).json({ error: "Bạn cần tham gia hoạt động trước khi gửi phản hồi" });
  }

  const existingFeedback = registration.phanHoi ?? null;
  const existingAttachments = existingFeedback
    ? sanitizeFeedbackAttachmentList(existingFeedback.minhChung)
    : [];

  const normalizedAttachments = sanitizeFeedbackAttachmentList(attachments);
  if (Array.isArray(attachments) && attachments.length && !normalizedAttachments.length) {
    return res.status(400).json({ error: "Danh sách minh chứng không hợp lệ" });
  }

  const incomingPathSet = new Set(extractStoragePaths(normalizedAttachments));
  const removalMap = new Map();
  existingAttachments.forEach((item) => {
    if (!item?.path) return;
    if (incomingPathSet.has(item.path)) return;
    const bucket = item.bucket || env.SUPABASE_FEEDBACK_BUCKET;
    if (!bucket) return;
    if (!removalMap.has(bucket)) {
      removalMap.set(bucket, []);
    }
    removalMap.get(bucket).push(item.path);
  });

  const normalizedRating = typeof rating === "number" ? Math.max(1, Math.min(5, rating)) : null;
  const payload = {
    noiDung: String(content).trim(),
    danhGia: normalizedRating,
    minhChung: normalizedAttachments,
    trangThai: "CHO_DUYET",
    lydoTuChoi: null,
  };

  let feedback;
  if (existingFeedback) {
    feedback = await prisma.phanHoiHoatDong.update({
      where: { id: existingFeedback.id },
      data: payload,
    });
  } else {
    feedback = await prisma.phanHoiHoatDong.create({
      data: {
        ...payload,
        dangKyId: registration.id,
        nguoiDungId: userId,
        hoatDongId: activityId,
      },
    });
  }

  removalMap.forEach((paths, bucket) => {
    if (paths?.length) {
      removeFiles(bucket, paths);
    }
  });

  const activity = await buildActivityResponse(activityId, userId);
  const activityTitle = activity?.title ?? registration.hoatDong?.tieuDe ?? "hoạt động";

  await notifyUser({
    userId,
    user,
    title: "Đã gửi phản hồi hoạt động",
    message: `Phản hồi của bạn cho hoạt động "${activityTitle}" đã được gửi thành công.`,
    type: "info",
    data: { activityId, action: "FEEDBACK_SUBMITTED", feedbackId: feedback.id },
    emailSubject: `[HUIT Social Credits] Xác nhận gửi phản hồi hoạt động "${activityTitle}"`,
    emailMessageLines: [
      `Phản hồi của bạn cho hoạt động "${activityTitle}" đã được gửi thành công.`,
      normalizedRating ? `Đánh giá: ${normalizedRating}/5` : null,
      normalizedAttachments.length ? `Số lượng minh chứng: ${normalizedAttachments.length}` : null,
    ],
  });

  res.status(201).json({
    message: "Đã gửi phản hồi",
    feedback: mapFeedback(feedback),
    activity,
  });
};
