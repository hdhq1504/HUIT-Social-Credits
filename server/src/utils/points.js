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
