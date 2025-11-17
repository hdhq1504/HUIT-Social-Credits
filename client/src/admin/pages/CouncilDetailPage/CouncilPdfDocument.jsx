import dayjs from 'dayjs';
import { Document, Page, Text } from '@react-pdf/renderer';

const GROUP_REQUIREMENTS = {
  group1: 50,
  group23: 50,
};

const RESULT_LABELS = {
  PASSED: 'Dat',
  FAILED: 'Khong dat',
  PENDING: 'Cho xet',
};

const stripAccents = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const toSafeText = (value) => stripAccents(value || '').trim() || '--';

const formatPoints = (value) => {
  const num = Number(value) || 0;
  const formatted = num.toFixed(1);
  return stripAccents(formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted);
};

const splitFullName = (fullName = '') => {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  const firstName = parts.pop();
  return { firstName, lastName: parts.join(' ') };
};

const wrapCell = (value, width) => {
  const text = stripAccents(String(value ?? ''));
  if (!text) return [''];
  const chunks = [];
  let remaining = text;
  while (remaining.length > width) {
    chunks.push(remaining.slice(0, width));
    remaining = remaining.slice(width);
  }
  chunks.push(remaining);
  return chunks;
};

const padValue = (value, width, align = 'left') => {
  const text = stripAccents(String(value ?? ''));
  const truncated = text.length > width ? text.slice(0, width) : text;
  if (align === 'center') {
    const totalPadding = width - truncated.length;
    const left = Math.floor(totalPadding / 2);
    const right = totalPadding - left;
    return ` ${' '.repeat(left)}${truncated}${' '.repeat(right)} `;
  }
  if (align === 'right') {
    return ` ${truncated.padStart(width, ' ')} `;
  }
  return ` ${truncated.padEnd(width, ' ')} `;
};

const COLUMNS = [
  { key: 'index', label: 'STT', width: 4, align: 'center' },
  { key: 'studentCode', label: 'MSSV', width: 10 },
  { key: 'lastName', label: 'Ho', width: 20 },
  { key: 'firstName', label: 'Ten', width: 8 },
  { key: 'classCode', label: 'Lop', width: 8 },
  { key: 'group1Points', label: 'Diem nhom 1', width: 12, align: 'right' },
  { key: 'group1Result', label: 'KQ nhom 1', width: 12, align: 'center' },
  { key: 'group2Points', label: 'Diem nhom 2', width: 12, align: 'right' },
  { key: 'group3Points', label: 'Diem nhom 3', width: 12, align: 'right' },
  { key: 'group23Result', label: 'KQ nhom 2,3', width: 14, align: 'center' },
  { key: 'finalResult', label: 'Ket qua', width: 12, align: 'center' },
  { key: 'note', label: 'Ghi chu', width: 30 },
];

const buildStudentNote = (evaluation, group1Points, group23Points) => {
  if (evaluation.note) {
    return stripAccents(evaluation.note);
  }
  const reminders = [];
  const missingGroup1 = Math.max(0, GROUP_REQUIREMENTS.group1 - group1Points);
  const missingGroup23 = Math.max(0, GROUP_REQUIREMENTS.group23 - group23Points);
  if (missingGroup1 > 0) reminders.push(`Thieu ${missingGroup1} diem N1`);
  if (missingGroup23 > 0) reminders.push(`Thieu ${missingGroup23} diem N2+3`);
  if (!reminders.length && evaluation.result === 'FAILED') {
    reminders.push('Chua dat yeu cau chung');
  }
  return reminders.join('; ');
};

const mapStudentsToRows = (students = []) =>
  students.map((entry, index) => {
    const { firstName, lastName } = splitFullName(entry.student?.fullName || '');
    const groupPoints = entry.groupPoints || {};
    const group1 = Number(groupPoints.group1 || 0);
    const group2 = Number(groupPoints.group2 || 0);
    const group3 = Number(groupPoints.group3 || 0);
    const group23 = group2 + group3;
    return {
      index: String(index + 1),
      studentCode: entry.student?.studentCode || '--',
      lastName,
      firstName,
      classCode: entry.student?.classCode || '--',
      group1Points: formatPoints(group1),
      group1Result: group1 >= GROUP_REQUIREMENTS.group1 ? 'Dat' : 'Khong dat',
      group2Points: formatPoints(group2),
      group3Points: formatPoints(group3),
      group23Result: group23 >= GROUP_REQUIREMENTS.group23 ? 'Dat' : 'Khong dat',
      finalResult: RESULT_LABELS[entry.result] || 'Cho xet',
      note: buildStudentNote(entry, group1, group23),
    };
  });

const buildTableLines = (rows) => {
  if (!rows.length) {
    return ['(Chua co sinh vien trong hoi dong)'];
  }
  const border = `+${COLUMNS.map((col) => '-'.repeat(col.width + 2)).join('+')}+`;
  const header = `|${COLUMNS.map((col) => padValue(col.label, col.width, 'center')).join('|')}|`;
  const tableLines = [border, header, border];

  rows.forEach((row) => {
    const cellMatrix = COLUMNS.map((col) => wrapCell(row[col.key], col.width));
    const height = Math.max(...cellMatrix.map((lines) => lines.length));
    for (let lineIndex = 0; lineIndex < height; lineIndex += 1) {
      const line = cellMatrix
        .map((cellLines, columnIndex) => padValue(cellLines[lineIndex] ?? '', COLUMNS[columnIndex].width, COLUMNS[columnIndex].align))
        .join('|');
      tableLines.push(`|${line}|`);
    }
    tableLines.push(border);
  });

  return tableLines;
};

const CouncilPdfDocument = ({ council, students = [], generatedAt = new Date() }) => {
  const rows = mapStudentsToRows(students);
  const headerLines = [
    'BIEN BAN HOI DONG XET DIEM CTXH',
    `Hoi dong: ${toSafeText(council?.name || council?.description || '')}`,
    `Nam hoc: ${toSafeText(council?.academicYear || '')} | Hoc ky: ${toSafeText(council?.semesterLabel || '')}`,
    `Khoa/phong phu trach: ${toSafeText(council?.facultyCode || 'Toan truong')}`,
    `Ngay xuat: ${dayjs(generatedAt).format('DD/MM/YYYY HH:mm')}`,
    `Yeu cau: Nhom 1 >= ${GROUP_REQUIREMENTS.group1} diem | Nhom 2+3 >= ${GROUP_REQUIREMENTS.group23} diem`,
    '',
    'Bang tong hop ket qua xet duyet:',
  ];

  const tableLines = buildTableLines(rows);
  const footerLines = [
    '',
    `Tong so sinh vien: ${students.length}`,
    '',
    'Chu ky xac nhan:',
    '- Chu tich hoi dong',
    '- Thu ky hoi dong',
    '- Uy vien',
  ];

  const lines = [...headerLines, ...tableLines, ...footerLines];

  return (
    <Document>
      <Page>{lines.map((line, index) => <Text key={`${index}-${line}`}>{line}</Text>)}</Page>
    </Document>
  );
};

export default CouncilPdfDocument;
