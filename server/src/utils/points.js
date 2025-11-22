import prisma from "../prisma.js";

export const POINT_GROUPS = {
  NHOM_1: {
    id: 'NHOM_1',
    label: 'Nhóm 1',
    target: 50,
  },
  NHOM_2: {
    id: 'NHOM_2',
    label: 'Nhóm 2',
    target: 60,
  },
  NHOM_3: {
    id: 'NHOM_3',
    label: 'Nhóm 3',
    target: 60,
  },
};

export const CERTIFICATE_TARGETS = {
  GROUP_ONE: 50,
  GROUP_TWO_THREE: 120,
};

export const CERTIFICATE_TOTAL_TARGET =
  CERTIFICATE_TARGETS.GROUP_ONE + CERTIFICATE_TARGETS.GROUP_TWO_THREE;

export const DEFAULT_POINT_GROUP = 'NHOM_2';

const hasPointGroup = (value) => Object.prototype.hasOwnProperty.call(POINT_GROUPS, value);

/**
 * Kiểm tra xem mã nhóm điểm có hợp lệ không.
 * @param {string} value - Mã nhóm điểm.
 * @returns {boolean} True nếu hợp lệ.
 */
export const isValidPointGroup = (value) => hasPointGroup(value);

/**
 * Chuẩn hóa mã nhóm điểm (về mặc định nếu không hợp lệ).
 * @param {string} value - Mã nhóm điểm.
 * @returns {string} Mã nhóm điểm hợp lệ.
 */
export const normalizePointGroup = (value) =>
  hasPointGroup(value) ? value : DEFAULT_POINT_GROUP;

/**
 * Lấy tên hiển thị của nhóm điểm.
 * @param {string} value - Mã nhóm điểm.
 * @returns {string} Tên nhóm điểm.
 */
export const getPointGroupLabel = (value) => POINT_GROUPS[normalizePointGroup(value)].label;

/**
 * Lấy điểm mục tiêu của nhóm điểm.
 * @param {string} value - Mã nhóm điểm.
 * @returns {number} Điểm mục tiêu.
 */
export const getPointGroupTarget = (value) => POINT_GROUPS[normalizePointGroup(value)].target;

/**
 * Lấy danh sách tóm tắt các nhóm điểm.
 * @returns {Array<Object>} Danh sách nhóm điểm { id, label, target }.
 */
export const getPointGroupSummary = () =>
  Object.values(POINT_GROUPS).map(({ id, label, target }) => ({
    id,
    label,
    target,
  }));

/**
 * Tính tổng điểm mục tiêu của tất cả các nhóm.
 * @returns {number} Tổng điểm mục tiêu.
 */
export const getTotalTargetPoints = () =>
  Object.values(POINT_GROUPS).reduce((sum, group) => sum + group.target, 0);

/**
 * Tính toán điểm rèn luyện của người dùng.
 * @param {string} userId - ID người dùng.
 * @param {string} [hocKyId] - ID học kỳ (tùy chọn).
 * @returns {Promise<Object>} Tổng điểm và chi tiết theo nhóm.
 */
export const calculateUserPoints = async (userId, hocKyId) => {
  if (!userId) {
    return { tongDiem: 0, diemTheoNhom: [] };
  }

  const registrations = await prisma.dangKyHoatDong.findMany({
    where: {
      nguoiDungId: userId,
      hoatDong: {
        trangThai: "DA_DIEN_RA",
        ...(hocKyId ? { hocKyId } : {}),
      },
    },
    include: {
      hoatDong: {
        select: {
          nhomDiem: true,
          diemCong: true,
          hocKyId: true,
        },
      },
      phanHoi: {
        select: {
          trangThai: true,
          diemNhan: true,
        },
      },
    },
  });

  const pointsByGroup = {};
  let totalPoints = 0;

  registrations.forEach((registration) => {
    const isApproved = registration.phanHoi?.trangThai === "DA_DUYET";
    const pointValue = isApproved
      ? registration.phanHoi?.diemNhan ?? registration.hoatDong?.diemCong ?? 0
      : 0;

    if (pointValue <= 0) return;

    const groupKey = normalizePointGroup(registration.hoatDong?.nhomDiem ?? DEFAULT_POINT_GROUP);
    if (!pointsByGroup[groupKey]) {
      pointsByGroup[groupKey] = {
        id: groupKey,
        tenNhom: getPointGroupLabel(groupKey),
        tongDiem: 0,
        soHoatDong: 0,
      };
    }

    pointsByGroup[groupKey].tongDiem += pointValue;
    pointsByGroup[groupKey].soHoatDong += 1;
    totalPoints += pointValue;
  });

  return {
    tongDiem: totalPoints,
    diemTheoNhom: Object.values(pointsByGroup),
  };
};
