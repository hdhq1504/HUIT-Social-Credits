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

export const isValidPointGroup = (value) => hasPointGroup(value);

export const normalizePointGroup = (value) =>
  hasPointGroup(value) ? value : DEFAULT_POINT_GROUP;

export const getPointGroupLabel = (value) => POINT_GROUPS[normalizePointGroup(value)].label;

export const getPointGroupTarget = (value) => POINT_GROUPS[normalizePointGroup(value)].target;

export const getPointGroupSummary = () =>
  Object.values(POINT_GROUPS).map(({ id, label, target }) => ({
    id,
    label,
    target,
  }));

export const getTotalTargetPoints = () =>
  Object.values(POINT_GROUPS).reduce((sum, group) => sum + group.target, 0);

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
