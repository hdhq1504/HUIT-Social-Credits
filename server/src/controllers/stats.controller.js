import prisma from "../prisma.js";
import {
  CERTIFICATE_TARGETS,
  CERTIFICATE_TOTAL_TARGET,
  DEFAULT_POINT_GROUP,
  POINT_GROUPS,
  getPointGroupLabel,
  normalizePointGroup
} from "../utils/points.js";
import { mapAttendanceMethodToApi } from "../utils/attendance.js";

const PROGRESS_GROUP_KEYS = Object.keys(POINT_GROUPS);
const GROUP_ONE_KEY = "NHOM_1";
const GROUP_TWO_KEY = "NHOM_2";
const GROUP_THREE_KEY = "NHOM_3";
const COMBINED_GROUP_KEY = "NHOM_23";
const ACTIVE_REG_STATUSES = ["DANG_KY", "DA_THAM_GIA"];

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

  let hasRedAddressParticipation = false;

  registrations.forEach((registration) => {
    const activity = registration.hoatDong;
    if (!activity) return;

    const group = normalizePointGroup(activity.nhomDiem ?? DEFAULT_POINT_GROUP);
    const points = activity.diemCong ?? 0;
    pointTotals[group] += points;

    if (!hasRedAddressParticipation && group === GROUP_ONE_KEY) {
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
      return "Cần tham gia ít nhất 1 hoạt động thuộc nhóm 1";
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

const computePercentChange = (current, previous) => {
  if (!previous) {
    return current > 0 ? 100 : 0;
  }
  const delta = ((current - previous) / previous) * 100;
  if (!Number.isFinite(delta)) {
    return 0;
  }
  return Math.round(delta);
};

const monthLabel = (month) => `T${month}`;

const buildChartData = (activities = []) => {
  const buckets = new Map();

  activities.forEach((activity) => {
    const start = activity.batDauLuc ? new Date(activity.batDauLuc) : null;
    if (!start || Number.isNaN(start.getTime())) return;

    const year = start.getFullYear();
    const month = start.getMonth() + 1;
    if (!buckets.has(year)) {
      buckets.set(year, new Map());
    }
    const yearBucket = buckets.get(year);
    if (!yearBucket.has(month)) {
      yearBucket.set(month, { group1: 0, group23: 0 });
    }
    const target = yearBucket.get(month);
    if (activity.nhomDiem === GROUP_ONE_KEY) {
      target.group1 += 1;
    } else {
      target.group23 += 1;
    }
  });

  const chart = {};
  Array.from(buckets.entries())
    .sort(([yearA], [yearB]) => Number(yearA) - Number(yearB))
    .forEach(([year, months]) => {
      const rows = [];
      for (let month = 1; month <= 12; month += 1) {
        const entry = months.get(month) ?? { group1: 0, group23: 0 };
        rows.push({
          month,
          label: monthLabel(month),
          group1: entry.group1,
          group23: entry.group23
        });
      }
      chart[year] = rows;
    });

  return chart;
};

const mapUpcomingActivities = (activities = []) =>
  activities.map((activity) => {
    const attendanceMethod = mapAttendanceMethodToApi(activity.phuongThucDiemDanh);
    return {
      id: activity.id,
      title: activity.tieuDe,
      location: activity.diaDiem ?? "Đang cập nhật",
      startTime: activity.batDauLuc?.toISOString() ?? null,
      attendanceMethod,
      participantsCount: activity.dangKy?.length ?? 0,
      maxCapacity: activity.sucChuaToiDa ?? null
    };
  });

const mapFeedbackSummaries = (feedbacks = []) =>
  feedbacks.map((feedback) => ({
    id: feedback.id,
    message: feedback.noiDung,
    submittedAt: feedback.taoLuc?.toISOString() ?? null,
    name: feedback.nguoiDung?.hoTen ?? feedback.nguoiDung?.email ?? "Người dùng",
    avatarUrl: feedback.nguoiDung?.avatarUrl ?? null
  }));

export const getAdminDashboardOverview = async (req, res) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000);
  const chartStartDate = new Date(now.getFullYear() - 2, 0, 1);

  const [
    [totalActivities, totalParticipants, pendingFeedback],
    [recentActivities, previousActivities, recentParticipants, previousParticipants, recentFeedbacks, previousFeedbacks],
    chartSource,
    upcomingActivities,
    pendingFeedbackList
  ] = await Promise.all([
    Promise.all([
      prisma.hoatDong.count(),
      prisma.dangKyHoatDong.count({ where: { trangThai: { in: ACTIVE_REG_STATUSES } } }),
      prisma.phanHoiHoatDong.count({ where: { trangThai: "CHO_DUYET" } })
    ]),
    Promise.all([
      prisma.hoatDong.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.hoatDong.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.dangKyHoatDong.count({ where: { dangKyLuc: { gte: thirtyDaysAgo }, trangThai: { in: ACTIVE_REG_STATUSES } } }),
      prisma.dangKyHoatDong.count({
        where: {
          dangKyLuc: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
          trangThai: { in: ACTIVE_REG_STATUSES }
        }
      }),
      prisma.phanHoiHoatDong.count({ where: { taoLuc: { gte: thirtyDaysAgo } } }),
      prisma.phanHoiHoatDong.count({ where: { taoLuc: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } })
    ]),
    prisma.hoatDong.findMany({
      where: { batDauLuc: { not: null, gte: chartStartDate } },
      select: { id: true, nhomDiem: true, batDauLuc: true }
    }),
    prisma.hoatDong.findMany({
      where: {
        batDauLuc: { gte: now },
        isPublished: true
      },
      include: {
        dangKy: {
          where: { trangThai: { in: ACTIVE_REG_STATUSES } },
          select: { id: true }
        }
      },
      orderBy: { batDauLuc: "asc" },
      take: 4
    }),
    prisma.phanHoiHoatDong.findMany({
      where: { trangThai: "CHO_DUYET" },
      include: {
        nguoiDung: {
          select: {
            hoTen: true,
            email: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { taoLuc: "desc" },
      take: 5
    })
  ]);

  const overview = {
    activities: {
      total: totalActivities,
      changePercent: computePercentChange(recentActivities, previousActivities)
    },
    participants: {
      total: totalParticipants,
      changePercent: computePercentChange(recentParticipants, previousParticipants)
    },
    feedbacks: {
      total: pendingFeedback,
      changePercent: computePercentChange(recentFeedbacks, previousFeedbacks)
    }
  };

  const chart = buildChartData(chartSource);
  const upcoming = mapUpcomingActivities(upcomingActivities);
  const feedbacks = mapFeedbackSummaries(pendingFeedbackList);

  res.json({ overview, chart, upcoming, feedbacks });
};
