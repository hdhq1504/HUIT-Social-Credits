const GROUP_CONFIG = {
  NHOM_1: { id: 'NHOM_1', name: 'Nhóm 1', target: 50 },
  NHOM_2_3: { id: 'NHOM_2_3', name: 'Nhóm 2,3', target: 120 },
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

export const mapProgressSummaryToSection = (summary) => {
  if (!summary) return DEFAULT_PROGRESS_SECTION;

  const defaultTarget = DEFAULT_PROGRESS_SECTION.targetPoints;
  const totalTarget = Number.isFinite(summary.targetPoints) ? summary.targetPoints : defaultTarget;
  const currentPoints = Number.isFinite(summary.currentPoints) ? summary.currentPoints : 0;

  const mappedGroups = Object.values(GROUP_CONFIG).map((config) => {
    const source = (summary.groups || []).find((group) => group?.id === config.id || group?.name === config.name) || {};
    const [fractionCurrent, fractionTarget] = parseFraction(source.value);
    const current = Number.isFinite(source.current) ? source.current : (fractionCurrent ?? 0);
    const target = Number.isFinite(source.target) ? source.target : (fractionTarget ?? config.target);
    const remaining = Number.isFinite(source.remaining) ? source.remaining : Math.max(target - current, 0);
    const status = source.status || (remaining > 0 ? 'warning' : 'success');
    const note = source.note || (remaining > 0 ? `Còn ${remaining} điểm` : 'Hoàn thành');

    return {
      id: config.id,
      name: config.name,
      target,
      current,
      remaining,
      status,
      note,
      value: source.value || `${current}/${target}`,
    };
  });

  const knownIds = new Set(Object.keys(GROUP_CONFIG));
  const extraGroups = (summary.groups || [])
    .filter((group) => group?.id && !knownIds.has(group.id))
    .map((group) => {
      const [fractionCurrent, fractionTarget] = parseFraction(group.value);
      const current = Number.isFinite(group.current) ? group.current : (fractionCurrent ?? 0);
      const target = Number.isFinite(group.target) ? group.target : (fractionTarget ?? current);
      const remaining = Number.isFinite(group.remaining) ? group.remaining : Math.max(target - current, 0);
      const status = group.status || (remaining > 0 ? 'warning' : 'success');
      const note = group.note || (remaining > 0 ? `Còn ${remaining} điểm` : 'Hoàn thành');
      return {
        id: group.id,
        name: group.name || group.id,
        target,
        current,
        remaining,
        status,
        note,
        value: group.value || `${current}/${target}`,
      };
    });

  const groups = [...mappedGroups, ...extraGroups];
  const missingPoints = Number.isFinite(summary.missingPoints)
    ? summary.missingPoints
    : groups.reduce((sum, group) => sum + Math.max(group.target - group.current, 0), 0);

  const percent = Number.isFinite(summary.percent)
    ? summary.percent
    : totalTarget > 0
      ? Math.min(100, Math.round((currentPoints / totalTarget) * 100))
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
