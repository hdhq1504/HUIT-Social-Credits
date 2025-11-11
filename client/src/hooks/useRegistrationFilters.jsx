import { useCallback, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import useDebounce from './useDebounce';

const DEFAULT_SEARCH_FIELDS = ['title', 'code', 'location', 'pointGroup', 'pointGroupLabel'];

const normalizeText = (value) =>
  (value ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getValueByPath = (source, field) => {
  if (!source || !field) return undefined;
  if (typeof field === 'function') return field(source);
  if (typeof field !== 'string') return undefined;
  return field.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), source);
};

const defaultActivityResolver = (item) => item?.activity ?? item ?? null;

const defaultSemesterLabelResolver = (activity) => {
  if (!activity) return null;
  const semesterLabel =
    activity.semesterDisplay ||
    (activity.semester && activity.academicYear
      ? `${activity.semester} - ${activity.academicYear}`
      : activity.semester) ||
    null;
  return semesterLabel ?? null;
};

const defaultTimeResolver = (item, activity) =>
  item?.registeredAt || activity?.registeredAt || activity?.startTime || null;

const normalizeRange = (range) => {
  if (!range || !Array.isArray(range) || range.length !== 2) return null;
  const [start, end] = range;
  const normalizedStart = start ? dayjs(start).startOf('day') : null;
  const normalizedEnd = end ? dayjs(end).endOf('day') : null;
  if (!normalizedStart && !normalizedEnd) return null;
  return [normalizedStart, normalizedEnd];
};

const buildSearchHaystack = (activity, fields) => {
  if (!activity) return '';
  const parts = fields
    .map((field) => getValueByPath(activity, field))
    .filter((value) => value !== undefined && value !== null)
    .map((value) => value.toString());
  return normalizeText(parts.join(' '));
};

const sortSemesters = (values) => {
  values.sort((a, b) => b.localeCompare(a, 'vi', { sensitivity: 'base' }));
  return values;
};

function useRegistrationFilters(
  registrations,
  {
    enableSemester = false,
    enableTimeRange = false,
    searchFields = DEFAULT_SEARCH_FIELDS,
    debounceMs = 400,
    getActivity = defaultActivityResolver,
    getSemesterLabel = defaultSemesterLabelResolver,
    getTimeValue = defaultTimeResolver,
  } = {},
) {
  const [keyword, setKeyword] = useState('');
  const [semester, setSemester] = useState('all');
  const [timeRange, setTimeRangeState] = useState(null);

  const debouncedKeyword = useDebounce(keyword, debounceMs);
  const normalizedKeyword = useMemo(() => normalizeText(debouncedKeyword.trim()), [debouncedKeyword]);
  const normalizedRange = useMemo(() => normalizeRange(timeRange), [timeRange]);

  const semesters = useMemo(() => {
    if (!enableSemester) return [];
    const semesterSet = new Set();
    registrations.forEach((item) => {
      const activity = getActivity(item);
      const label = getSemesterLabel(activity, item);
      if (label) {
        semesterSet.add(label);
      }
    });
    return sortSemesters(Array.from(semesterSet));
  }, [enableSemester, registrations, getActivity, getSemesterLabel]);

  const filtered = useMemo(() => {
    return registrations.filter((item) => {
      const activity = getActivity(item);
      if (!activity) return false;

      if (enableSemester && semester !== 'all') {
        const semesterLabel = getSemesterLabel(activity, item);
        if (semesterLabel !== semester) {
          return false;
        }
      }

      if (enableTimeRange && normalizedRange) {
        const [start, end] = normalizedRange;
        const timeValue = getTimeValue(item, activity);
        if (!timeValue) return false;
        const time = dayjs(timeValue);
        if (!time.isValid()) return false;
        if (start && time.isBefore(start)) return false;
        if (end && time.isAfter(end)) return false;
      }

      if (normalizedKeyword) {
        const haystack = buildSearchHaystack(activity, searchFields);
        if (!haystack.includes(normalizedKeyword)) {
          return false;
        }
      }

      return true;
    });
  }, [
    registrations,
    getActivity,
    enableSemester,
    semester,
    getSemesterLabel,
    enableTimeRange,
    normalizedRange,
    normalizedKeyword,
    searchFields,
    getTimeValue,
  ]);

  const setTimeRange = useCallback(
    (value) => {
      if (!enableTimeRange) return;
      if (!value || !Array.isArray(value) || value.length !== 2) {
        setTimeRangeState(null);
      } else {
        setTimeRangeState(value);
      }
    },
    [enableTimeRange],
  );

  const resetFilters = useCallback(() => {
    setKeyword('');
    if (enableSemester) {
      setSemester('all');
    }
    if (enableTimeRange) {
      setTimeRangeState(null);
    }
  }, [enableSemester, enableTimeRange]);

  return {
    keyword,
    setKeyword,
    debouncedKeyword,
    semester,
    setSemester,
    semesters,
    timeRange,
    setTimeRange,
    filtered,
    resetFilters,
    hasSemesterFilter: enableSemester,
    hasTimeFilter: enableTimeRange,
  };
}

export default useRegistrationFilters;
