import prisma from "../prisma.js";
import {
  CERTIFICATE_TARGETS,
  CERTIFICATE_TOTAL_TARGET,
  DEFAULT_POINT_GROUP,
  POINT_GROUPS,
  RED_ADDRESS_CATEGORY_NAME,
  getPointGroupLabel,
  normalizePointGroup
} from "../utils/points.js";

const PROGRESS_GROUP_KEYS = Object.keys(POINT_GROUPS);
const GROUP_ONE_KEY = "NHOM_1";
const GROUP_TWO_KEY = "NHOM_2";
const GROUP_THREE_KEY = "NHOM_3";
const COMBINED_GROUP_KEY = "NHOM_23";
const RED_ADDRESS_NAME_NORMALIZED = RED_ADDRESS_CATEGORY_NAME.trim().toLowerCase();

const normalizeCategoryName = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const isRedAddressCategory = (value) =>
  normalizeCategoryName(value) === RED_ADDRESS_NAME_NORMALIZED;

const buildGroupMap = (groups = []) => {
  const map = new Map();
  groups.forEach((group) => {
    if (group?.id) {
      map.set(group.id, group);
    }
  });
  return map;
};

export const getProgressSummary = async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const [user, registrations] = await Promise.all([
    prisma.nguoiDung.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    }),
    prisma.dangKyHoatDong.findMany({
      where: {
        nguoiDungId: userId,
        trangThai: "DA_THAM_GIA"
      },
      include: {
        hoatDong: {
          select: {
            diemCong: true,
            nhomDiem: true,
            danhMucRef: {
              select: { ten: true }
            }
          }
        }
      }
    })
  ]);

  const pointTotals = PROGRESS_GROUP_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  let hasRedAddressParticipation = false;

  registrations.forEach((registration) => {
    const activity = registration.hoatDong;
    if (!activity) return;

    const group = normalizePointGroup(activity.nhomDiem ?? DEFAULT_POINT_GROUP);
    const points = activity.diemCong ?? 0;
    pointTotals[group] += points;

    if (!hasRedAddressParticipation && isRedAddressCategory(activity.danhMucRef?.ten)) {
      hasRedAddressParticipation = true;
    }
  });

  const groupOneTarget = CERTIFICATE_TARGETS.GROUP_ONE;
  const groupTwoThreeTarget = CERTIFICATE_TARGETS.GROUP_TWO_THREE;

  const groupOneRawPoints = pointTotals[GROUP_ONE_KEY] ?? 0;
  const groupTwoRawPoints = pointTotals[GROUP_TWO_KEY] ?? 0;
  const groupThreeRawPoints = pointTotals[GROUP_THREE_KEY] ?? 0;

  const overflowFromGroupOne = Math.max(groupOneRawPoints - groupOneTarget, 0);
  const groupOneEffectivePoints = Math.min(groupOneRawPoints, groupOneTarget);
  const groupTwoThreeEffectivePoints = groupTwoRawPoints + groupThreeRawPoints + overflowFromGroupOne;
  const normalizedGroupTwoThreePoints = Math.min(groupTwoThreeEffectivePoints, groupTwoThreeTarget);

  const normalizedGroupOnePoints = groupOneEffectivePoints;
  const totalPoints = normalizedGroupOnePoints + normalizedGroupTwoThreePoints;
  const totalTarget = CERTIFICATE_TOTAL_TARGET;

  const groupOneRemaining = Math.max(groupOneTarget - groupOneEffectivePoints, 0);
  const groupTwoThreeRemaining = Math.max(groupTwoThreeTarget - normalizedGroupTwoThreePoints, 0);

  const groupOneHasRequiredPoints = groupOneEffectivePoints >= groupOneTarget;
  const groupTwoThreeHasRequiredPoints = groupTwoThreeEffectivePoints >= groupTwoThreeTarget;
  const isQualified =
    groupOneHasRequiredPoints && groupTwoThreeHasRequiredPoints && hasRedAddressParticipation;

  const groupOneStatus = groupOneHasRequiredPoints && hasRedAddressParticipation ? "success" : "warning";
  const groupTwoThreeStatus = groupTwoThreeHasRequiredPoints ? "success" : "warning";

  const groupOneNote = (() => {
    if (!groupOneHasRequiredPoints) {
      return groupOneRemaining > 0 ? `Còn ${groupOneRemaining} điểm` : "Cần hoàn thành điểm nhóm 1";
    }
    if (!hasRedAddressParticipation) {
      return "Cần tham gia hoạt động Địa chỉ đỏ";
    }
    return "Hoàn thành";
  })();

  const groupTwoThreeNote = groupTwoThreeRemaining > 0 ? `Còn ${groupTwoThreeRemaining} điểm` : "Hoàn thành";

  const groups = [
    {
      id: GROUP_ONE_KEY,
      name: "Nhóm 1",
      target: groupOneTarget,
      current: groupOneRawPoints,
      remaining: groupOneRemaining,
      status: groupOneStatus,
      note: groupOneNote,
      value: `${groupOneRawPoints}/${groupOneTarget}`,
      details: {
        rawPoints: groupOneRawPoints,
        effectivePoints: groupOneEffectivePoints,
        overflowTransferred: overflowFromGroupOne,
        hasRedAddressParticipation
      }
    },
    {
      id: COMBINED_GROUP_KEY,
      name: "Nhóm 2,3",
      target: groupTwoThreeTarget,
      current: groupTwoThreeEffectivePoints,
      remaining: groupTwoThreeRemaining,
      status: groupTwoThreeStatus,
      note: groupTwoThreeNote,
      value: `${groupTwoThreeEffectivePoints}/${groupTwoThreeTarget}`,
      details: {
        rawGroupTwoPoints: groupTwoRawPoints,
        rawGroupThreePoints: groupThreeRawPoints,
        overflowFromGroupOne
      }
    }
  ];

  const missingPoints = groupOneRemaining + groupTwoThreeRemaining;
  const percent = totalTarget > 0 ? Math.min(100, Math.round((totalPoints / totalTarget) * 100)) : 0;

  const requirements = {
    isQualified,
    totalTarget,
    totalEarnedPoints: totalPoints,
    totalRawPoints: groupOneRawPoints + groupTwoRawPoints + groupThreeRawPoints,
    groupOne: {
      target: groupOneTarget,
      earned: groupOneRawPoints,
      effective: groupOneEffectivePoints,
      hasRequiredPoints: groupOneHasRequiredPoints,
      hasRedAddressParticipation,
      overflowToGroup23: overflowFromGroupOne
    },
    groupTwoThree: {
      target: groupTwoThreeTarget,
      earned: groupTwoThreeEffectivePoints,
      rawGroupTwoPoints: groupTwoRawPoints,
      rawGroupThreePoints: groupThreeRawPoints,
      hasRequiredPoints: groupTwoThreeHasRequiredPoints,
      overflowFromGroupOne
    }
  };

  res.json({
    progress: {
      currentPoints: totalPoints,
      targetPoints: totalTarget,
      percent,
      missingPoints,
      groups,
      avatarUrl: user?.avatarUrl ?? null,
      isQualified,
      requirements
    }
  });
};

export const getActivityCategories = async (_req, res) => {
  const [categories, activityCounts] = await Promise.all([
    prisma.danhMucHoatDong.findMany({
      where: { isActive: true },
      orderBy: { ten: "asc" }
    }),
    prisma.hoatDong.groupBy({
      by: ["danhMucId"],
      where: { isPublished: true, danhMucId: { not: null } },
      _count: { _all: true }
    })
  ]);

  const countMap = buildGroupMap(
    activityCounts.map((item) => ({
      id: item.danhMucId,
      count: item._count?._all ?? 0
    }))
  );

  const items = categories.map((category) => {
    const pointGroup = normalizePointGroup(category.nhomDiem ?? DEFAULT_POINT_GROUP);
    return {
      id: category.id,
      code: category.ma,
      name: category.ten,
      description: category.moTa ?? null,
      pointGroup,
      pointGroupLabel: getPointGroupLabel(pointGroup),
      activityCount: countMap.get(category.id)?.count ?? 0,
      isActive: category.isActive
    };
  });

  const totals = items.reduce(
    (acc, item) => {
      acc.totalActivities += item.activityCount;
      return acc;
    },
    { totalCategories: items.length, totalActivities: 0 }
  );

  res.json({ categories: items, summary: totals });
};
