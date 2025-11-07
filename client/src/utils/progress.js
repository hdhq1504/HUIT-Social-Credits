const GROUP_CONFIG = {
  NHOM_1: { id: 'NHOM_1', name: 'Nhóm 1', target: 50 },
  NHOM_23: { id: 'NHOM_23', name: 'Nhóm 2,3', target: 120 },
};

const GROUP_IDS = Object.keys(GROUP_CONFIG);
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
  detail: null,
});

export const DEFAULT_PROGRESS_SECTION = {
  currentPoints: 0,
  targetPoints: GROUP_IDS.reduce((sum, id) => sum + GROUP_CONFIG[id].target, 0),
  percent: 0,
  missingPoints: GROUP_IDS.reduce((sum, id) => sum + GROUP_CONFIG[id].target, 0),
  groups: GROUP_IDS.map((id) => buildDefaultGroup(GROUP_CONFIG[id])),
  imageUrl: DEFAULT_IMAGE,
  isQualified: false,
  requirements: null,
};

const parseFraction = (value) => {
  if (!value) return [undefined, undefined];
  const [currentPart, targetPart] = String(value).split('/');
  const current = Number(currentPart);
  const target = Number(targetPart);
  return [Number.isFinite(current) ? current : undefined, Number.isFinite(target) ? target : undefined];
};

const extractGroupMetrics = (group, fallbackTarget) => {
  if (!group) {
    return {
      current: 0,
      target: fallbackTarget,
      remaining: fallbackTarget,
      status: 'warning',
      note: `Còn ${fallbackTarget} điểm`,
    };
  }

  const [fractionCurrent, fractionTarget] = parseFraction(group.value);
  const current = Number.isFinite(group.current) ? group.current : fractionCurrent ?? 0;
  const target = Number.isFinite(group.target) ? group.target : fractionTarget ?? fallbackTarget ?? 0;
  const remaining = Math.max(target - current, 0);
  const status = group.status || (remaining > 0 ? 'warning' : 'success');
  const note = group.note || (remaining > 0 ? `Còn ${remaining} điểm` : 'Hoàn thành');

  return { current, target, remaining, status, note };
};

export const mapProgressSummaryToSection = (summary) => {
  if (!summary) return DEFAULT_PROGRESS_SECTION;

  const groupMap = new Map();
  (summary.groups || []).forEach((group) => {
    if (group?.id) {
      groupMap.set(group.id, group);
    }
  });

  const groups = GROUP_IDS.map((id) => {
    const config = GROUP_CONFIG[id];
    const groupData = groupMap.get(id);
    const metrics = extractGroupMetrics(groupData, config?.target);
    const current = metrics.current || 0;
    const target = metrics.target || config?.target || 0;
    const remaining = Number.isFinite(metrics.remaining)
      ? metrics.remaining
      : Math.max(target - Math.min(current, target), 0);

    return {
      id: groupData?.id || config.id,
      name: groupData?.name || config.name,
      target,
      current,
      remaining,
      status: metrics.status,
      note: metrics.note,
      value: groupData?.value || `${current}/${target}`,
      details: groupData?.details ?? null,
    };
  });

  const currentPoints = Number.isFinite(summary.currentPoints)
    ? summary.currentPoints
    : groups.reduce((sum, group) => sum + Math.min(group.current ?? 0, group.target ?? 0), 0);

  const targetPoints = Number.isFinite(summary.targetPoints)
    ? summary.targetPoints
    : groups.reduce((sum, group) => sum + group.target, 0);

  const missingPoints = Number.isFinite(summary.missingPoints)
    ? Math.max(summary.missingPoints, 0)
    : groups.reduce(
      (sum, group) =>
        sum + Math.max((group.target ?? 0) - Math.min(group.current ?? 0, group.target ?? 0), 0),
      0,
    );

  const percent = Number.isFinite(summary.percent)
    ? summary.percent
    : targetPoints > 0
      ? Math.min(100, Math.round((currentPoints / targetPoints) * 100))
      : 0;

  return {
    currentPoints,
    targetPoints,
    percent,
    missingPoints,
    groups,
    imageUrl: summary.avatarUrl || summary.imageUrl || DEFAULT_IMAGE,
    isQualified: Boolean(summary.isQualified ?? summary.requirements?.isQualified),
    requirements: summary.requirements ?? null,
  };
};
