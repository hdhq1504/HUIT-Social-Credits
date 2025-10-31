const GROUP_CONFIG = {
  NHOM_1: { id: 'NHOM_1', name: 'Nhóm 1', target: 50 },
  NHOM_2_3: { id: 'NHOM_2_3', name: 'Nhóm 2,3', target: 120 },
};

const POINT_TARGETS = {
  NHOM_1: 50,
  NHOM_2: 60,
  NHOM_3: 60,
};

const DEFAULT_IMAGE = '/images/profile.png';

const buildDefaultGroup = (config) => ({
  id: config.id,
  name: config.name,
  target: config.target,
  current: 0,
  remaining: config.target,
  status: 'warning',
  note: `Còn ${config.target} điểm`,
  value: `0/${config.target}`,
});

export const DEFAULT_PROGRESS_SECTION = {
  currentPoints: 0,
  targetPoints: Object.values(GROUP_CONFIG).reduce((sum, item) => sum + item.target, 0),
  percent: 0,
  missingPoints: Object.values(GROUP_CONFIG).reduce((sum, item) => sum + item.target, 0),
  groups: Object.values(GROUP_CONFIG).map(buildDefaultGroup),
  imageUrl: DEFAULT_IMAGE,
};

const parseFraction = (value) => {
  if (!value) return [undefined, undefined];
  const [currentPart, targetPart] = String(value).split('/');
  const current = Number(currentPart);
  const target = Number(targetPart);
  return [Number.isFinite(current) ? current : undefined, Number.isFinite(target) ? target : undefined];
};

const parseMetrics = (group, fallbackTarget) => {
  if (!group) {
    return { current: 0, target: fallbackTarget };
  }

  const [fractionCurrent, fractionTarget] = parseFraction(group.value);
  const current = Number.isFinite(group.current) ? group.current : (fractionCurrent ?? 0);
  const target = Number.isFinite(group.target)
    ? group.target
    : (fractionTarget ?? fallbackTarget ?? 0);

  return { current, target, source: group };
};

const computeNormalizedGroups = (groups = []) => {
  const groupMap = new Map();
  groups.forEach((group) => {
    if (group?.id) {
      groupMap.set(group.id, group);
    }
  });

  const group1Metrics = parseMetrics(groupMap.get('NHOM_1'), POINT_TARGETS.NHOM_1);
  const group2Metrics = parseMetrics(groupMap.get('NHOM_2'), POINT_TARGETS.NHOM_2);
  const group3Metrics = parseMetrics(groupMap.get('NHOM_3'), POINT_TARGETS.NHOM_3);
  const aggregatedMetrics = parseMetrics(groupMap.get('NHOM_2_3'), GROUP_CONFIG.NHOM_2_3.target);

  const group1Target = group1Metrics.target || POINT_TARGETS.NHOM_1;
  const group1Current = group1Metrics.current || 0;
  const overflow = Math.max(group1Current - group1Target, 0);
  const normalizedGroup1Current = Math.min(group1Current, group1Target);

  const computedGroup23Target =
    ((group2Metrics.target || 0) + (group3Metrics.target || 0)) || aggregatedMetrics.target || GROUP_CONFIG.NHOM_2_3.target;
  const computedGroup23Current = overflow + (group2Metrics.current || 0) + (group3Metrics.current || 0);
  const normalizedGroup23Current = Math.max(computedGroup23Current, aggregatedMetrics.current || 0);
  const normalizedGroup23Target = aggregatedMetrics.target || computedGroup23Target;

  const normalized = new Map();
  normalized.set('NHOM_1', {
    current: normalizedGroup1Current,
    target: group1Target,
    source: group1Metrics.source,
  });
  normalized.set('NHOM_2_3', {
    current: normalizedGroup23Current,
    target: normalizedGroup23Target,
    source: aggregatedMetrics.source,
  });

  return normalized;
};

export const mapProgressSummaryToSection = (summary) => {
  if (!summary) return DEFAULT_PROGRESS_SECTION;

  const defaultTarget = DEFAULT_PROGRESS_SECTION.targetPoints;
  const totalTarget = Number.isFinite(summary.targetPoints) ? summary.targetPoints : defaultTarget;
  const currentPoints = Number.isFinite(summary.currentPoints) ? summary.currentPoints : 0;

  const normalizedGroups = computeNormalizedGroups(summary.groups);

  const groups = Object.values(GROUP_CONFIG).map((config) => {
    const metrics = normalizedGroups.get(config.id);
    const source = metrics?.source;
    const current = metrics?.current ?? 0;
    const target = metrics?.target ?? config.target;
    const remaining = Math.max(target - current, 0);
    const status = source?.status || (remaining > 0 ? 'warning' : 'success');
    const note = source?.note || (remaining > 0 ? `Còn ${remaining} điểm` : 'Hoàn thành');

    return {
      id: config.id,
      name: config.name,
      target,
      current,
      remaining,
      status,
      note,
      value: `${current}/${target}`,
    };
  });

  const missingPointsRaw = Number.isFinite(summary.missingPoints)
    ? summary.missingPoints
    : groups.reduce((sum, group) => sum + Math.max(group.target - group.current, 0), 0);
  const missingPoints = Math.max(missingPointsRaw, 0);

  const percent = Number.isFinite(summary.percent)
    ? summary.percent
    : totalTarget > 0
      ? Math.round((currentPoints / totalTarget) * 100)
      : 0;

  return {
    currentPoints,
    targetPoints: totalTarget,
    percent,
    missingPoints,
    groups,
    imageUrl: summary.avatarUrl || summary.imageUrl || DEFAULT_IMAGE,
  };
};
