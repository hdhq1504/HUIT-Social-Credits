import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HEADER_LINE_1 = "TRƯỜNG ĐẠI HỌC CÔNG THƯƠNG THÀNH PHỐ HỒ CHÍ MINH";
const HEADER_LINE_2 = "PHÒNG CÔNG TÁC SINH VIÊN & THANH TRA GIÁO DỤC";
const TITLE = "KẾT QUẢ THỰC HIỆN MÔN HỌC GIÁO DỤC NGHỀ NGHIỆP & CÔNG TÁC XÃ HỘI";

const FONT_SIZE = 14;
const HEADER_FONT_SIZE = 16;

const drawCellBorder = (doc, x, y, width, height) => {
  doc.rect(x, y, width, height).stroke();
};

const fillCellBackground = (doc, x, y, width, height, color) => {
  doc.save();
  doc.fillColor(color);
  doc.rect(x, y, width, height).fill();
  doc.restore();
  doc.fillColor('black');
};

/**
 * Tạo file PDF danh sách chứng nhận.
 * @param {Object} params - Tham số đầu vào.
 * @param {Array} params.students - Danh sách sinh viên.
 * @param {string} params.facultyName - Tên khoa (tùy chọn).
 * @returns {Promise<Buffer>} Promise trả về Buffer của file PDF.
 */
export const generateCertificationPdf = async ({ students, facultyName }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [1200, 700],
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      });

      const fontPath = path.join(__dirname, '../assets/fonts/SVN-Times New Roman 2.ttf');
      const boldFontPath = path.join(__dirname, '../assets/fonts/SVN-Times New Roman 2 bold.ttf');
      doc.registerFont('Times New Roman', fontPath);
      doc.registerFont('Times New Roman Bold', boldFontPath);

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.font('Times New Roman Bold');
      doc.fontSize(HEADER_FONT_SIZE);

      doc.text(HEADER_LINE_1, 40, 40, { align: 'left' });
      doc.text(HEADER_LINE_2, 40, 56, { align: 'left' });

      doc.fontSize(HEADER_FONT_SIZE);
      doc.text(TITLE, 40, 85, { align: 'center', width: doc.page.width - 80 });

      let tableTop = 135;
      if (facultyName) {
        doc.fontSize(FONT_SIZE);
        doc.text(`Khoa: ${facultyName}`, 40, 110, { align: 'center', width: doc.page.width - 80 });
        tableTop = 150;
      }

      const headerRowHeight = 45;
      const dataRowHeight = 30;

      const columns = [
        { header: 'STT', width: 50, align: 'center' },
        { header: 'MSSV', width: 90, align: 'center' },
        { header: 'Họ và tên', width: 150, align: 'center' },
        { header: 'Lớp', width: 80, align: 'center' },
        { header: 'Điểm Nhóm 1', width: 75, align: 'center' },
        { header: 'Tổng điểm Nhóm 1', width: 75, align: 'center' },
        { header: 'Kết quả Nhóm 1', width: 85, align: 'center' },
        { header: 'Điểm Nhóm 2+3', width: 75, align: 'center' },
        { header: 'Điểm dư Nhóm 1', width: 75, align: 'center' },
        { header: 'Tổng điểm Nhóm 2,3', width: 80, align: 'center' },
        { header: 'Kết quả Nhóm 2,3', width: 85, align: 'center' },
        { header: 'Kết quả đánh giá', width: 115, align: 'center' },
        { header: 'Đợt cấp chứng nhận', width: 85, align: 'center' },
      ];

      let currentX = 40;
      let currentY = tableTop;

      doc.font('Times New Roman Bold');
      doc.fontSize(FONT_SIZE);

      columns.forEach((col) => {
        fillCellBackground(doc, currentX, currentY, col.width, headerRowHeight, '#D3D3D3');

        drawCellBorder(doc, currentX, currentY, col.width, headerRowHeight);

        doc.text(col.header, currentX + 3, currentY + 6, {
          width: col.width - 6,
          align: col.align,
          lineBreak: true,
        });
        currentX += col.width;
      });

      currentY += headerRowHeight;

      doc.font('Times New Roman');
      doc.fontSize(FONT_SIZE);

      students.forEach((student, index) => {
        if (currentY > doc.page.height - 60) {
          doc.addPage();
          currentY = 40;
          currentX = 40;
          doc.font('Times New Roman Bold');

          columns.forEach((col) => {
            fillCellBackground(doc, currentX, currentY, col.width, headerRowHeight, '#D3D3D3');
            drawCellBorder(doc, currentX, currentY, col.width, headerRowHeight);
            doc.text(col.header, currentX + 3, currentY + 6, {
              width: col.width - 6,
              align: col.align,
              lineBreak: true,
            });
            currentX += col.width;
          });
          currentY += headerRowHeight;
          doc.font('Times New Roman');
        }

        currentX = 40;

        const rowData = [
          String(index + 1),
          student.studentCode || '--',
          student.fullName || '--',
          student.classCode || '--',
          String(student.groupOnePoints || 0),
          String(student.groupOneTotalEffective || 0),
          student.groupOneResult || '--',
          String(student.groupTwoThreePoints || 0),
          String(student.groupOneOverflow || 0),
          String(student.groupTwoThreeTotalEffective || 0),
          student.groupTwoThreeResult || '--',
          student.overallResult || '--',
          student.certificationDate || 'Chưa cấp',
        ];

        rowData.forEach((data, colIndex) => {
          const col = columns[colIndex];

          drawCellBorder(doc, currentX, currentY, col.width, dataRowHeight);

          const textY = currentY + (dataRowHeight - FONT_SIZE) / 2;
          doc.text(data, currentX + 3, textY, {
            width: col.width - 6,
            align: col.align,
            lineBreak: false,
            ellipsis: true,
          });
          currentX += col.width;
        });

        currentY += dataRowHeight;
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
