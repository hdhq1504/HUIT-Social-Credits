import {
  prisma,
  ACTIVITY_INCLUDE,
  REGISTRATION_INCLUDE,
  mapActivity,
  buildActivityResponse,
  mapRegistration,
  sanitizeOptionalText,
  sanitizeStringArray,
  sanitizePoints,
  sanitizeCapacity,
  sanitizeStatusFilter,
  REGISTRATION_STATUSES,
  FEEDBACK_STATUSES,
  summarizeFaceProfile,
  isValidPointGroup,
  normalizePointGroup,
  getDefaultAttendanceMethod,
  normalizeAttendanceMethod,
  resolveAcademicPeriodForDate,
  processActivityCover,
  removeFiles,
  toDate,
} from "./shared.js";

export const listActivities = async (req, res) => {
  const currentUserId = req.user?.sub;

  const { limit, sort, search, pointGroup } = req.query || {};
  const take = limit ? parseInt(limit, 10) : undefined;
  let orderBy = [{ batDauLuc: "asc" }, { tieuDe: "asc" }];

  if (sort === "createdAt:desc") {
    orderBy = [{ createdAt: "desc" }];
  }

  const searchTerm = sanitizeOptionalText(search, 100);
  const normalizedPointGroup = isValidPointGroup(pointGroup) ? pointGroup : undefined;

  const where = {
    isPublished: true,
    ...(normalizedPointGroup ? { nhomDiem: normalizedPointGroup } : {}),
    ...(searchTerm
      ? {
          OR: [
            { tieuDe: { contains: searchTerm, mode: "insensitive" } },
            { diaDiem: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const activities = await prisma.hoatDong.findMany({
    where,
    orderBy,
    take,
    include: ACTIVITY_INCLUDE,
  });

  let registrationMap = new Map();
  let faceProfileSummary = null;
  if (currentUserId && activities.length) {
    const registrations = await prisma.dangKyHoatDong.findMany({
      where: {
        nguoiDungId: currentUserId,
        hoatDongId: { in: activities.map((activity) => activity.id) },
      },
      include: REGISTRATION_INCLUDE,
    });
    registrationMap = new Map(registrations.map((registration) => [registration.hoatDongId, registration]));
    const faceProfile = await prisma.faceProfile.findUnique({ where: { nguoiDungId: currentUserId } });
    faceProfileSummary = summarizeFaceProfile(faceProfile);
  }

  res.json({
    activities: activities.map((activity) =>
      mapActivity(activity, registrationMap.get(activity.id), { faceEnrollment: faceProfileSummary })
    ),
  });
};

export const getActivity = async (req, res) => {
  const currentUserId = req.user?.sub;
  const activity = await buildActivityResponse(req.params.id, currentUserId);
  if (!activity) return res.status(404).json({ error: "Hoạt động không tồn tại" });
  res.json({ activity });
};

export const createActivity = async (req, res) => {
  const {
    tieuDe,
    nhomDiem,
    diemCong,
    diaDiem,
    sucChuaToiDa,
    moTa,
    yeuCau,
    huongDan,
    batDauLuc,
    ketThucLuc,
    attendanceMethod,
    registrationDeadline,
    cancellationDeadline,
  } = req.body;
  const hasCoverImage =
    Object.prototype.hasOwnProperty.call(req.body ?? {}, "coverImage") ||
    Object.prototype.hasOwnProperty.call(req.body ?? {}, "hinhAnh");
  const coverPayload = Object.prototype.hasOwnProperty.call(req.body ?? {}, "coverImage")
    ? req.body.coverImage
    : req.body?.hinhAnh;

  const normalizedTitle = sanitizeOptionalText(tieuDe, 255);
  if (!normalizedTitle) {
    return res.status(400).json({ error: "Trường 'tieuDe' (Tên hoạt động) là bắt buộc" });
  }
  if (!nhomDiem) {
    return res.status(400).json({ error: "Trường 'nhomDiem' (Nhóm hoạt động) là bắt buộc" });
  }
  if (!isValidPointGroup(nhomDiem)) {
    return res.status(400).json({ error: "Giá trị 'nhomDiem' không hợp lệ" });
  }

  try {
    const startTime = batDauLuc ? toDate(batDauLuc) : null;
    const endTime = ketThucLuc ? toDate(ketThucLuc) : null;
    const academicPeriod = await resolveAcademicPeriodForDate(startTime ?? endTime ?? new Date());
    const normalizedAttendanceMethod =
      normalizeAttendanceMethod(attendanceMethod ?? req.body?.phuongThucDiemDanh) ||
      getDefaultAttendanceMethod();
    const registrationDue = registrationDeadline ?? req.body?.hanDangKy;
    const cancellationDue = cancellationDeadline ?? req.body?.hanHuyDangKy;

    const data = {
      tieuDe: normalizedTitle,
      nhomDiem: normalizePointGroup(nhomDiem),
      diemCong: sanitizePoints(diemCong),
      diaDiem: sanitizeOptionalText(diaDiem, 255),
      sucChuaToiDa: sanitizeCapacity(sucChuaToiDa),
      moTa: sanitizeOptionalText(moTa),
      yeuCau: sanitizeStringArray(yeuCau),
      huongDan: sanitizeStringArray(huongDan, 1000),
      batDauLuc: startTime,
      ketThucLuc: endTime,
      hanDangKy: registrationDue ? toDate(registrationDue) : null,
      hanHuyDangKy: cancellationDue ? toDate(cancellationDue) : null,
      phuongThucDiemDanh: normalizedAttendanceMethod,
      hocKyId: academicPeriod.hocKyId,
      namHocId: academicPeriod.namHocId,
    };

    const newActivity = await prisma.hoatDong.create({
      data,
    });

    if (hasCoverImage) {
      try {
        const coverResult = await processActivityCover({
          activityId: newActivity.id,
          payload: coverPayload,
          existing: null,
        });
        await prisma.hoatDong.update({
          where: { id: newActivity.id },
          data: { hinhAnh: coverResult.metadata },
        });
        coverResult.removed.forEach((target) => {
          if (target?.bucket && target?.path) {
            removeFiles(target.bucket, [target.path]);
          }
        });
      } catch (error) {
        console.error("Không thể xử lý ảnh bìa hoạt động:", error);
        const message =
          error?.code === "SUPABASE_NOT_CONFIGURED"
            ? "Dịch vụ lưu trữ chưa được cấu hình"
            : error?.message || "Không thể xử lý ảnh bìa hoạt động";
        return res.status(500).json({ error: message });
      }
    }

    const activity = await buildActivityResponse(newActivity.id, req.user?.sub);

    res.status(201).json({ activity });
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({ error: error.message || "Không thể tạo hoạt động" });
  }
};

export const updateActivity = async (req, res) => {
  const { id } = req.params;
  const {
    tieuDe,
    nhomDiem,
    diemCong,
    diaDiem,
    sucChuaToiDa,
    moTa,
    yeuCau,
    huongDan,
    batDauLuc,
    ketThucLuc,
    attendanceMethod,
    registrationDeadline,
    cancellationDeadline,
  } = req.body;
  const hasCoverImage =
    Object.prototype.hasOwnProperty.call(req.body ?? {}, "coverImage") ||
    Object.prototype.hasOwnProperty.call(req.body ?? {}, "hinhAnh");
  const coverPayload = Object.prototype.hasOwnProperty.call(req.body ?? {}, "coverImage")
    ? req.body.coverImage
    : req.body?.hinhAnh;

  const normalizedTitle = sanitizeOptionalText(tieuDe, 255);
  if (!normalizedTitle) {
    return res.status(400).json({ error: "Trường 'tieuDe' (Tên hoạt động) là bắt buộc" });
  }
  if (!nhomDiem) {
    return res.status(400).json({ error: "Trường 'nhomDiem' (Nhóm hoạt động) là bắt buộc" });
  }
  if (!isValidPointGroup(nhomDiem)) {
    return res.status(400).json({ error: "Giá trị 'nhomDiem' không hợp lệ" });
  }

  try {
    const existingActivity = await prisma.hoatDong.findUnique({
      where: { id },
      select: { hinhAnh: true },
    });
    if (!existingActivity) {
      return res.status(404).json({ error: "Hoạt động không tồn tại" });
    }

    const startTime = batDauLuc ? toDate(batDauLuc) : null;
    const endTime = ketThucLuc ? toDate(ketThucLuc) : null;
    const academicPeriod = await resolveAcademicPeriodForDate(startTime ?? endTime ?? new Date());
    const normalizedAttendanceMethod =
      normalizeAttendanceMethod(attendanceMethod ?? req.body?.phuongThucDiemDanh) ||
      getDefaultAttendanceMethod();
    const registrationDue = registrationDeadline ?? req.body?.hanDangKy;
    const cancellationDue = cancellationDeadline ?? req.body?.hanHuyDangKy;

    let coverResult = null;
    if (hasCoverImage) {
      try {
        coverResult = await processActivityCover({
          activityId: id,
          payload: coverPayload,
          existing: existingActivity.hinhAnh,
        });
      } catch (error) {
        console.error("Không thể xử lý ảnh bìa hoạt động:", error);
        const message =
          error?.code === "SUPABASE_NOT_CONFIGURED"
            ? "Dịch vụ lưu trữ chưa được cấu hình"
            : error?.message || "Không thể xử lý ảnh bìa hoạt động";
        return res.status(500).json({ error: message });
      }
    }

    const updateData = {
      tieuDe: normalizedTitle,
      nhomDiem: normalizePointGroup(nhomDiem),
      diemCong: sanitizePoints(diemCong),
      diaDiem: sanitizeOptionalText(diaDiem, 255),
      sucChuaToiDa: sanitizeCapacity(sucChuaToiDa),
      moTa: sanitizeOptionalText(moTa),
      yeuCau: sanitizeStringArray(yeuCau),
      huongDan: sanitizeStringArray(huongDan, 1000),
      batDauLuc: startTime,
      ketThucLuc: endTime,
      hanDangKy: registrationDue ? toDate(registrationDue) : null,
      hanHuyDangKy: cancellationDue ? toDate(cancellationDue) : null,
      phuongThucDiemDanh: normalizedAttendanceMethod,
      hocKyId: academicPeriod.hocKyId,
      namHocId: academicPeriod.namHocId,
    };

    if (hasCoverImage) {
      updateData.hinhAnh = coverResult?.metadata ?? null;
    }

    const updated = await prisma.hoatDong.update({
      where: { id },
      data: updateData,
    });

    if (coverResult?.removed?.length) {
      const buckets = new Map();
      coverResult.removed.forEach((target) => {
        if (!target?.bucket || !target?.path) return;
        if (!buckets.has(target.bucket)) {
          buckets.set(target.bucket, []);
        }
        buckets.get(target.bucket).push(target.path);
      });
      buckets.forEach((paths, bucket) => {
        if (paths.length) {
          removeFiles(bucket, paths);
        }
      });
    }

    const activity = await buildActivityResponse(updated.id, req.user?.sub);
    res.json({ activity });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Hoạt động không tồn tại" });
    }
    console.error("Error updating activity:", error);
    res.status(500).json({ error: error.message || "Không thể cập nhật hoạt động" });
  }
};

export const deleteActivity = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.hoatDong.delete({ where: { id } });
    res.json({ message: "Đã xóa hoạt động" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Hoạt động không tồn tại" });
    }
    console.error("Error deleting activity:", error);
    res.status(500).json({ error: error.message || "Không thể xóa hoạt động" });
  }
};

export const listMyActivities = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { status, feedbackStatus } = req.query || {};
  const normalizedStatus = status ? sanitizeStatusFilter(status, REGISTRATION_STATUSES) : undefined;
  const normalizedFeedback =
    feedbackStatus && feedbackStatus !== "ALL"
      ? feedbackStatus === "NONE"
        ? "NONE"
        : sanitizeStatusFilter(feedbackStatus, FEEDBACK_STATUSES)
      : undefined;

  const registrations = await prisma.dangKyHoatDong.findMany({
    where: {
      nguoiDungId: userId,
      ...(normalizedStatus ? { trangThai: normalizedStatus } : {}),
    },
    include: {
      ...REGISTRATION_INCLUDE,
      hoatDong: {
        include: ACTIVITY_INCLUDE,
      },
    },
    orderBy: [{ dangKyLuc: "desc" }],
  });

  const now = new Date();
  const absentRegistrationIds = registrations
    .filter((registration) => {
      if (registration.trangThai !== "DANG_KY") return false;
      const end = registration.hoatDong?.ketThucLuc ? new Date(registration.hoatDong.ketThucLuc) : null;
      if (!end || now <= end) return false;
      const history = registration.lichSuDiemDanh ?? [];
      const hasCheckin = history.some((entry) => entry.loai === "CHECKIN");
      const hasCheckout = history.some((entry) => entry.loai === "CHECKOUT");
      return !hasCheckin && !hasCheckout;
    })
    .map((registration) => registration.id);

  if (absentRegistrationIds.length) {
    await prisma.dangKyHoatDong.updateMany({
      where: { id: { in: absentRegistrationIds } },
      data: { trangThai: "VANG_MAT" },
    });
    const absentSet = new Set(absentRegistrationIds);
    registrations.forEach((registration) => {
      if (absentSet.has(registration.id)) {
        // eslint-disable-next-line no-param-reassign
        registration.trangThai = "VANG_MAT";
      }
    });
  }

  const filtered = normalizedFeedback
    ? registrations.filter((registration) => {
        if (normalizedFeedback === "NONE") return !registration.phanHoi;
        return registration.phanHoi?.trangThai === normalizedFeedback;
      })
    : registrations;

  const faceProfile = await prisma.faceProfile.findUnique({ where: { nguoiDungId: userId } });
  const faceEnrollmentSummary = summarizeFaceProfile(faceProfile);

  res.json({
    registrations: filtered.map((registration) => ({
      ...mapRegistration(registration, registration.hoatDong),
      activity: mapActivity(registration.hoatDong, registration, { faceEnrollment: faceEnrollmentSummary }),
    })),
  });
};
