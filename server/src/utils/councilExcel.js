import XLSX from "xlsx";

const HEADER_LINE_1 = "TRƯỜNG ĐẠI HỌC CÔNG THƯƠNG THÀNH PHỐ HỒ CHÍ MINH";
const HEADER_LINE_2 = "PHÒNG CÔNG TÁC SINH VIÊN & THANH TRA GIÁO DỤC";
const TITLE = "KẾT QUẢ THỰC HIỆN MÔN HỌC GIÁO DỤC NGHỀ NGHIỆP & CÔNG TÁC XÃ HỘI";

export const generateCertificationExcel = ({ students, facultyName }) => {
  const workbook = XLSX.utils.book_new();

  const data = [];

  data.push([HEADER_LINE_1]);
  data.push([HEADER_LINE_2]);
  data.push([]);
  data.push([TITLE]);

  if (facultyName) {
    data.push([]);
    data.push([`Khoa: ${facultyName}`]);
  }

  data.push([]);

  data.push([
    'STT',
    'MSSV',
    'Họ tên',
    'Lớp',
    'Điểm nhóm 1',
    'Tổng điểm nhóm 1',
    'Kết quả nhóm 1',
    'Điểm nhóm 2+3',
    'Điểm dư nhóm 1 chuyển qua',
    'Tổng điểm nhóm 2,3',
    'Kết quả nhóm 2,3',
    'Kết quả đánh giá',
    'Đợt cấp chứng nhận',
  ]);

  students.forEach((student, index) => {
    data.push([
      index + 1,
      student.studentCode || '--',
      student.fullName || '--',
      student.classCode || '--',
      student.groupOnePoints || 0,
      student.groupOneTotalEffective || 0,
      student.groupOneResult || '--',
      student.groupTwoThreePoints || 0,
      student.groupOneOverflow || 0,
      student.groupTwoThreeTotalEffective || 0,
      student.groupTwoThreeResult || '--',
      student.overallResult || '--',
      student.certificationDate || 'Chưa cấp CN',
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 25 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 15 },
    { wch: 18 },
    { wch: 20 },
  ];

  const headerRowIndex = facultyName ? 7 : 6;

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 12 } },
  ];

  if (facultyName) {
    worksheet['!merges'].push({ s: { r: 5, c: 0 }, e: { r: 5, c: 12 } });
  }

  const headerRow = headerRowIndex + 1;
  const numColumns = 13;

  for (let col = 0; col < numColumns; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
    if (!worksheet[cellAddress]) continue;

    worksheet[cellAddress].s = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'D3D3D3' } },
    };
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return buffer;
};
