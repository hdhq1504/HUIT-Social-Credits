import prisma from "../../prisma.js";
import { resolveAcademicPeriodForDate } from "../../utils/academic.js";
import {
  getDefaultAttendanceMethod,
  normalizeAttendanceMethod,
} from "../../utils/attendance.js";
import { removeFiles } from "../../utils/supabaseStorage.js";
import { normalizePointGroup, isValidPointGroup } from "../../utils/points.js";
import {
  buildActivityResponse,
  processActivityCover,
  sanitizeOptionalText,
  sanitizePoints,
  sanitizeCapacity,
  sanitizeStringArray,
  toDate,
} from "../../utils/activity.js";

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
    isFeatured,
  } = req.body;
  const hasCoverImage = Object.prototype.hasOwnProperty.call(req.body ?? {}, "coverImage")
    || Object.prototype.hasOwnProperty.call(req.body ?? {}, "hinhAnh");
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
      normalizeAttendanceMethod(attendanceMethod ?? req.body?.phuongThucDiemDanh) || getDefaultAttendanceMethod();
    const registrationDue = registrationDeadline ?? req.body?.hanDangKy;
    const cancellationDue = cancellationDeadline ?? req.body?.hanHuyDangKy;

    // Determine approval status based on user role
    const userRole = req.user?.role;
    const isTeacher = userRole === 'GIANGVIEN';
    const isAdmin = userRole === 'ADMIN';

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
      nguoiTaoId: req.user?.sub || null,
      nguoiPhuTrachId: req.user?.sub || null,
      trangThaiDuyet: isTeacher ? 'CHO_DUYET' : 'DA_DUYET',
      isPublished: isAdmin,
      isFeatured: typeof isFeatured === 'boolean' ? isFeatured : false,
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
  const hasCoverImage = Object.prototype.hasOwnProperty.call(req.body ?? {}, "coverImage")
    || Object.prototype.hasOwnProperty.call(req.body ?? {}, "hinhAnh");
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
      normalizeAttendanceMethod(attendanceMethod ?? req.body?.phuongThucDiemDanh) || getDefaultAttendanceMethod();
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

    if (typeof isFeatured === 'boolean') {
      updateData.isFeatured = isFeatured;
    }

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

export const approveActivity = async (req, res) => {
  const { id } = req.params;

  try {
    const activity = await prisma.hoatDong.findUnique({
      where: { id },
      select: { trangThaiDuyet: true },
    });

    if (!activity) {
      return res.status(404).json({ error: "Hoạt động không tồn tại" });
    }

    if (activity.trangThaiDuyet === "DA_DUYET") {
      return res.status(400).json({ error: "Hoạt động đã được duyệt" });
    }

    const updated = await prisma.hoatDong.update({
      where: { id },
      data: {
        trangThaiDuyet: "DA_DUYET",
        isPublished: true,
        lyDoTuChoi: null,
      },
    });

    const activityResponse = await buildActivityResponse(updated.id, req.user?.sub);
    res.json({ activity: activityResponse, message: "Đã duyệt hoạt động" });
  } catch (error) {
    console.error("Error approving activity:", error);
    res.status(500).json({ error: error.message || "Không thể duyệt hoạt động" });
  }
};

export const rejectActivity = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: "Vui lòng cung cấp lý do từ chối" });
  }

  try {
    const activity = await prisma.hoatDong.findUnique({
      where: { id },
      select: { trangThaiDuyet: true },
    });

    if (!activity) {
      return res.status(404).json({ error: "Hoạt động không tồn tại" });
    }

    if (activity.trangThaiDuyet === "BI_TU_CHOI") {
      return res.status(400).json({ error: "Hoạt động đã bị từ chối" });
    }

    const updated = await prisma.hoatDong.update({
      where: { id },
      data: {
        trangThaiDuyet: "BI_TU_CHOI",
        isPublished: false,
        lyDoTuChoi: reason.trim(),
      },
    });

    const activityResponse = await buildActivityResponse(updated.id, req.user?.sub);
    res.json({ activity: activityResponse, message: "Đã từ chối hoạt động" });
  } catch (error) {
    console.error("Error rejecting activity:", error);
    res.status(500).json({ error: error.message || "Không thể từ chối hoạt động" });
  }
};