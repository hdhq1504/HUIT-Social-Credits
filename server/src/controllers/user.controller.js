import bcrypt from "bcrypt";
import prisma from "../prisma.js";
import { uploadBase64Image, removeFiles, buildPublicUrl } from "../utils/supabaseStorage.js";
import { env } from "../env.js";

const ROLE_VALUES = new Set(["SINHVIEN", "GIANGVIEN", "NHANVIEN", "ADMIN"]);
const STATUS_VALUES = new Set(["active", "inactive"]);
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const SORTABLE_FIELDS = {
  createdAt: ['createdAt'],
  fullName: ['hoTen'],
  email: ['email'],
  identifier: ['maSV', 'maCB'],
  role: ['vaiTro'],
  departmentCode: ['maKhoa', 'maLop'],
  phoneNumber: ['soDT'],
  isActive: ['isActive'],
  lastLoginAt: ['lastLoginAt'],
};

const normalizeSearch = (value) => {
  if (!value) return "";
  if (typeof value !== "string") return "";
  return value.trim();
};

const normalizeRole = (value) => {
  if (!value) return undefined;
  const upper = String(value).trim().toUpperCase();
  return ROLE_VALUES.has(upper) ? upper : undefined;
};

const normalizeStatus = (value) => {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  return STATUS_VALUES.has(normalized) ? normalized === "active" : undefined;
};

const normalizePage = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 1;
};

const normalizePageSize = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
};

const normalizeSortBy = (value) => {
  if (!value) return 'createdAt';
  const key = String(value).trim();
  return SORTABLE_FIELDS[key] ? key : 'createdAt';
};

const normalizeSortOrder = (value) => {
  if (!value) return 'desc';
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'asc' ? 'asc' : 'desc';
};

const buildOrderBy = (sortBy, sortOrder) => {
  const fields = SORTABLE_FIELDS[sortBy] || SORTABLE_FIELDS.createdAt;
  if (Array.isArray(fields) && fields.length > 1) {
    return fields.map((field) => ({ [field]: sortOrder }));
  }
  const field = Array.isArray(fields) ? fields[0] : fields;
  return { [field]: sortOrder };
};

const buildSearchCondition = (search) => {
  if (!search) return undefined;
  return {
    OR: [
      { hoTen: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { maSV: { contains: search, mode: "insensitive" } },
      { maCB: { contains: search, mode: "insensitive" } },
      { soDT: { contains: search, mode: "insensitive" } }
    ]
  };
};

const mapUserForResponse = (user) => ({
  id: user.id,
  fullName: user.hoTen,
  email: user.email,
  role: user.vaiTro,
  studentCode: user.maSV,
  staffCode: user.maCB,
  classCode: user.maLop,
  departmentCode: user.maKhoa,
  phoneNumber: user.soDT,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  avatarUrl: user.avatarUrl
});

const sanitizeString = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : undefined;
};

const normalizeEmail = (value) => {
  const email = sanitizeString(value)?.toLowerCase();
  if (!email) return undefined;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? email : null;
};

const normalizeRoleInput = (value) => {
  if (!value) return undefined;
  const upper = String(value).trim().toUpperCase();
  return ROLE_VALUES.has(upper) ? upper : undefined;
};

const normalizeActiveState = (value, fallback = true) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "active"].includes(normalized)) return true;
  if (["false", "0", "inactive"].includes(normalized)) return false;
  return fallback;
};

const assertAdmin = (req) => {
  if (req.user?.role !== "ADMIN") {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }
};

/**
 * Lấy danh sách người dùng (Admin).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const listUsers = async (req, res) => {
  try {
    assertAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { search, role, status, page, pageSize, sortBy, sortOrder } = req.query || {};
  const normalizedSearch = normalizeSearch(search);
  const normalizedRole = normalizeRole(role);
  const normalizedStatus = normalizeStatus(status);
  const currentPage = normalizePage(page);
  const take = normalizePageSize(pageSize);
  const skip = (currentPage - 1) * take;
  const normalizedSortBy = normalizeSortBy(sortBy);
  const normalizedSortOrder = normalizeSortOrder(sortOrder);

  const where = {
    ...(normalizedRole ? { vaiTro: normalizedRole } : {}),
    ...(typeof normalizedStatus === "boolean" ? { isActive: normalizedStatus } : {}),
    ...(normalizedSearch ? buildSearchCondition(normalizedSearch) : {}),
  };

  const [users, total] = await Promise.all([
    prisma.nguoiDung.findMany({
      where,
      orderBy: buildOrderBy(normalizedSortBy, normalizedSortOrder),
      skip,
      take,
      select: {
        id: true,
        hoTen: true,
        email: true,
        vaiTro: true,
        maSV: true,
        maCB: true,
        maLop: true,
        maKhoa: true,
        soDT: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        avatarUrl: true
      }
    }),
    prisma.nguoiDung.count({ where })
  ]);

  res.json({
    users: users.map(mapUserForResponse),
    pagination: {
      page: currentPage,
      pageSize: take,
      total,
      pageCount: Math.ceil(total / take) || 0
    }
  });
};

/**
 * Lấy thông tin chi tiết người dùng theo ID (Admin).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const getUserById = async (req, res) => {
  try {
    assertAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;

  try {
    const user = await prisma.nguoiDung.findUnique({
      where: { id },
      select: {
        id: true,
        hoTen: true,
        email: true,
        vaiTro: true,
        maSV: true,
        maCB: true,
        maLop: true,
        maKhoa: true,
        soDT: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        avatarUrl: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    res.json({ user: mapUserForResponse(user) });
  } catch (error) {
    console.error("Error fetching user detail:", error);
    res.status(500).json({ error: error.message || "Không thể lấy thông tin người dùng" });
  }
};

/**
 * Tạo người dùng mới (Admin).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const createUser = async (req, res) => {
  try {
    assertAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { fullName, email, role, password, studentCode, staffCode, classCode, departmentCode, phoneNumber, isActive, avatarImage } =
    req.body || {};

  const normalizedName = sanitizeString(fullName);
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = normalizeRoleInput(role) ?? "SINHVIEN";
  const normalizedStudentCode = sanitizeString(studentCode) ?? null;
  const normalizedStaffCode = sanitizeString(staffCode) ?? null;
  const normalizedClassCode = sanitizeString(classCode) ?? null;
  const normalizedDepartmentCode = sanitizeString(departmentCode) ?? null;
  const normalizedPhoneNumber = sanitizeString(phoneNumber) ?? null;
  const normalizedPassword = sanitizeString(password);
  const activeState = normalizeActiveState(isActive, true);

  if (!normalizedName) {
    return res.status(400).json({ error: "Vui lòng nhập họ tên" });
  }

  if (!normalizedEmail) {
    return res.status(400).json({ error: "Email không hợp lệ" });
  }

  if (!normalizedPassword || normalizedPassword.length < 6) {
    return res.status(400).json({ error: "Mật khẩu phải có ít nhất 6 ký tự" });
  }

  try {
    const existingUser = await prisma.nguoiDung.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ error: "Email đã tồn tại trong hệ thống" });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    const createdUser = await prisma.nguoiDung.create({
      data: {
        hoTen: normalizedName,
        email: normalizedEmail,
        matKhau: hashedPassword,
        vaiTro: normalizedRole,
        maSV: normalizedStudentCode,
        maCB: normalizedStaffCode,
        maLop: normalizedClassCode,
        maKhoa: normalizedDepartmentCode,
        soDT: normalizedPhoneNumber,
        isActive: activeState,
      },
    });

    // Handle avatar upload if provided
    if (avatarImage?.dataUrl) {
      try {
        const uploadResult = await uploadBase64Image({
          dataUrl: avatarImage.dataUrl,
          bucket: env.SUPABASE_AVATAR_BUCKET,
          pathPrefix: createdUser.id,
          fileName: avatarImage.fileName || 'avatar',
        });

        await prisma.nguoiDung.update({
          where: { id: createdUser.id },
          data: { avatarUrl: uploadResult.url },
        });
      } catch (uploadError) {
        console.error('Avatar upload failed:', uploadError);
        // Continue without avatar if upload fails
      }
    }

    res.status(201).json({
      message: "Thêm người dùng thành công",
      user: mapUserForResponse(createdUser),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message || "Không thể tạo người dùng" });
  }
};

/**
 * Cập nhật thông tin người dùng (Admin).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const updateUser = async (req, res) => {
  try {
    assertAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;
  const { fullName, email, role, password, studentCode, staffCode, classCode, departmentCode, phoneNumber, isActive, avatarImage } =
    req.body || {};

  const normalizedName = sanitizeString(fullName);
  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = normalizeRoleInput(role);
  const normalizedStudentCode = sanitizeString(studentCode);
  const normalizedStaffCode = sanitizeString(staffCode);
  const normalizedClassCode = sanitizeString(classCode);
  const normalizedDepartmentCode = sanitizeString(departmentCode);
  const normalizedPhoneNumber = sanitizeString(phoneNumber);
  const normalizedPassword = sanitizeString(password);
  const activeState = normalizeActiveState(isActive, undefined);

  if (!normalizedName) {
    return res.status(400).json({ error: "Vui lòng nhập họ tên" });
  }

  if (normalizedEmail === null) {
    return res.status(400).json({ error: "Email không hợp lệ" });
  }

  try {
    const existing = await prisma.nguoiDung.findUnique({
      where: { id },
      select: { id: true, email: true, avatarUrl: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    if (normalizedEmail && normalizedEmail !== existing.email) {
      const emailConflict = await prisma.nguoiDung.findUnique({ where: { email: normalizedEmail } });
      if (emailConflict) {
        return res.status(409).json({ error: "Email đã tồn tại trong hệ thống" });
      }
    }

    const updateData = {
      hoTen: normalizedName,
      ...(normalizedEmail ? { email: normalizedEmail } : {}),
      ...(normalizedRole ? { vaiTro: normalizedRole } : {}),
      maSV: normalizedStudentCode ?? null,
      maCB: normalizedStaffCode ?? null,
      maLop: normalizedClassCode ?? null,
      maKhoa: normalizedDepartmentCode ?? null,
      soDT: normalizedPhoneNumber ?? null,
    };

    if (activeState !== undefined) {
      updateData.isActive = activeState;
    }

    if (normalizedPassword) {
      if (normalizedPassword.length < 6) {
        return res.status(400).json({ error: "Mật khẩu phải có ít nhất 6 ký tự" });
      }
      updateData.matKhau = await bcrypt.hash(normalizedPassword, 10);
    }

    // Handle avatar upload if provided
    if (avatarImage) {
      if (avatarImage === null) {
        // Remove avatar
        if (existing.avatarUrl) {
          try {
            // Extract path from URL to delete from storage
            const oldPath = existing.avatarUrl.split('/').slice(-2).join('/');
            await removeFiles(env.SUPABASE_AVATAR_BUCKET, [oldPath]);
          } catch (cleanupError) {
            console.error('Failed to cleanup old avatar:', cleanupError);
          }
        }
        updateData.avatarUrl = null;
      } else if (avatarImage.dataUrl) {
        // Upload new avatar
        try {
          const uploadResult = await uploadBase64Image({
            dataUrl: avatarImage.dataUrl,
            bucket: env.SUPABASE_AVATAR_BUCKET,
            pathPrefix: id,
            fileName: avatarImage.fileName || 'avatar',
          });

          // Clean up old avatar if exists
          if (existing.avatarUrl) {
            try {
              const oldPath = existing.avatarUrl.split('/').slice(-2).join('/');
              await removeFiles(env.SUPABASE_AVATAR_BUCKET, [oldPath]);
            } catch (cleanupError) {
              console.error('Failed to cleanup old avatar:', cleanupError);
            }
          }

          updateData.avatarUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Avatar upload failed:', uploadError);
          return res.status(500).json({ error: 'Không thể upload avatar' });
        }
      }
    }

    const updatedUser = await prisma.nguoiDung.update({ where: { id }, data: updateData });

    res.json({ message: "Cập nhật người dùng thành công", user: mapUserForResponse(updatedUser) });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }
    console.error("Error updating user:", error);
    res.status(500).json({ error: error.message || "Không thể cập nhật người dùng" });
  }
};

/**
 * Xóa người dùng (Admin).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const deleteUser = async (req, res) => {
  try {
    assertAdmin(req);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }

  const { id } = req.params;

  try {
    await prisma.nguoiDung.delete({ where: { id } });
    res.json({ message: "Đã xóa người dùng" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }
    console.error("Error deleting user:", error);
    res.status(500).json({ error: error.message || "Không thể xóa người dùng" });
  }
};

export default {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
