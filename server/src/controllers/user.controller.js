import prisma from "../prisma.js";

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

export const listUsers = async (req, res) => {
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

export default {
  listUsers
};
