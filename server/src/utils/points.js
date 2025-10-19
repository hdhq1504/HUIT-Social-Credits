export const POINT_GROUPS = {
  NHOM_1: {
    id: 'NHOM_1',
    label: 'Nhóm 1',
    target: 50,
  },
  NHOM_2_3: {
    id: 'NHOM_2_3',
    label: 'Nhóm 2,3',
    target: 120,
  },
};

export const DEFAULT_POINT_GROUP = 'NHOM_2_3';

export const normalizePointGroup = (value) =>
  Object.prototype.hasOwnProperty.call(POINT_GROUPS, value) ? value : DEFAULT_POINT_GROUP;

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
