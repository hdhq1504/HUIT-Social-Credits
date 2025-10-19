import prisma from "../prisma.js";
import {
  DEFAULT_POINT_GROUP,
  POINT_GROUPS,
  getPointGroupLabel,
  getPointGroupSummary,
  getTotalTargetPoints,
  normalizePointGroup
} from "../utils/points.js";

const PROGRESS_GROUP_KEYS = Object.keys(POINT_GROUPS);

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
            nhomDiem: true
          }
        }
      }
    })
  ]);

  const pointTotals = PROGRESS_GROUP_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  registrations.forEach((registration) => {
    const group = normalizePointGroup(registration.hoatDong?.nhomDiem ?? DEFAULT_POINT_GROUP);
    const points = registration.hoatDong?.diemCong ?? 0;
    pointTotals[group] += points;
  });

  const totalPoints = Object.values(pointTotals).reduce((sum, value) => sum + value, 0);
  const totalTarget = getTotalTargetPoints();

  const groups = getPointGroupSummary().map(({ id, label, target }) => {
    const current = pointTotals[id] ?? 0;
    const remaining = Math.max(target - current, 0);
    const status = remaining > 0 ? "warning" : "success";
    const note = remaining > 0 ? `Còn ${remaining} điểm` : "Hoàn thành";
    return {
      id,
      name: label,
      target,
      current,
      remaining,
      status,
      note,
      value: `${current}/${target}`
    };
  });

  const missingPoints = groups.reduce((sum, group) => sum + group.remaining, 0);
  const percent = totalTarget > 0 ? Math.min(100, Math.round((totalPoints / totalTarget) * 100)) : 0;

  res.json({
    progress: {
      currentPoints: totalPoints,
      targetPoints: totalTarget,
      percent,
      missingPoints,
      groups,
      avatarUrl: user?.avatarUrl ?? null
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
