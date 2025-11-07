import dayjs from 'dayjs';

const FALL_SEMESTER_TRANSITION_DAY = 15;
const SUMMER_SEMESTER_START_DAY = 16;

const deriveStaticSemester = (value) => {
  const date = value ? dayjs(value) : null;
  if (!date || !date.isValid()) {
    return { semester: '', academicYear: '' };
  }

  const month = date.month() + 1;
  const day = date.date();

  let semester;
  if (month === 8) {
    semester = day >= FALL_SEMESTER_TRANSITION_DAY ? 'Học kỳ 1' : 'Học kỳ 3';
  } else if (month >= 9 && month <= 12) {
    semester = 'Học kỳ 1';
  } else if (month === 1) {
    semester = 'Học kỳ 1';
  } else if (month >= 2 && month <= 5) {
    semester = 'Học kỳ 2';
  } else if (month === 6) {
    semester = day >= SUMMER_SEMESTER_START_DAY ? 'Học kỳ 3' : 'Học kỳ 2';
  } else if (month === 7) {
    semester = 'Học kỳ 3';
  } else {
    semester = 'Học kỳ 3';
  }

  const startsNewAcademicYear = month > 8 || (month === 8 && day >= FALL_SEMESTER_TRANSITION_DAY);
  const startYear = startsNewAcademicYear ? date.year() : date.year() - 1;
  const academicYear = `${startYear}-${startYear + 1}`;

  return { semester, academicYear };
};

const normalizeDefinitions = (definitions) => {
  if (!Array.isArray(definitions)) return [];
  return definitions
    .map((item) => {
      if (!item) return null;
      const start = item.startDate ? dayjs(item.startDate) : null;
      const end = item.endDate ? dayjs(item.endDate) : null;
      if (!start?.isValid() || !end?.isValid()) return null;

      return {
        id: item.id ?? null,
        label: item.label ?? item.name ?? '',
        academicYear: item.academicYearLabel ?? item.academicYear ?? '',
        academicYearId: item.academicYearId ?? null,
        academicYearCode: item.academicYearCode ?? null,
        start,
        end,
      };
    })
    .filter(Boolean);
};

export const deriveSemesterInfo = (value, definitions = []) => {
  const date = value ? dayjs(value) : null;
  if (!date || !date.isValid()) {
    return { semester: '', academicYear: '', semesterId: null, academicYearId: null };
  }

  const normalized = normalizeDefinitions(definitions);
  const matched = normalized.find((definition) =>
    (date.isAfter(definition.start) || date.isSame(definition.start, 'day')) &&
    (date.isBefore(definition.end) || date.isSame(definition.end, 'day'))
  );

  if (matched) {
    return {
      semester: matched.label || '',
      academicYear: matched.academicYear || '',
      semesterId: matched.id,
      academicYearId: matched.academicYearId,
    };
  }

  const fallback = deriveStaticSemester(date);
  return { ...fallback, semesterId: null, academicYearId: null };
};

export default deriveSemesterInfo;