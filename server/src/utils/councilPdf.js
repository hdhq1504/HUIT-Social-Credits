const escapePdfText = (value = "") =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const removeDiacritics = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const chunkString = (value, length) => {
  if (!value) return [""];
  const result = [];
  let current = value;
  while (current.length > length) {
    result.push(current.slice(0, length));
    current = current.slice(length);
  }
  result.push(current);
  return result;
};

const formatLine = (value, maxLength = 110) => {
  const normalized = removeDiacritics(value || "");
  return chunkString(normalized, maxLength);
};

const buildPages = (lines, linesPerPage = 40) => {
  if (!lines.length) return [[" "]];
  const pages = [[]];
  lines.forEach((line) => {
    const currentPage = pages[pages.length - 1];
    if (currentPage.length >= linesPerPage) {
      pages.push([]);
    }
    pages[pages.length - 1].push(line);
  });
  return pages;
};

const buildContentStream = (pageLines) => {
  const commands = ["BT", "/F1 12 Tf", "16 TL", "1 0 0 1 50 780 Tm"];
  pageLines.forEach((line) => {
    commands.push(`(${escapePdfText(line)}) Tj`);
    commands.push("T*");
  });
  commands.push("ET");
  return commands.join("\n");
};

const buildPdfBuffer = (pages) => {
  const objects = [];
  const addObject = (content = "") => {
    objects.push(content);
    return objects.length; // PDF object number
  };

  const catalogNumber = addObject();
  const pagesNumber = addObject();
  const fontNumber = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const contentEntries = [];
  const pageEntries = [];
  pages.forEach((lines) => {
    const contentNumber = addObject();
    const pageNumber = addObject();
    contentEntries.push({ number: contentNumber, lines });
    pageEntries.push({ number: pageNumber, contentNumber });
  });

  pageEntries.forEach((entry) => {
    const lines = contentEntries.find((item) => item.number === entry.contentNumber)?.lines || [" "];
    const stream = buildContentStream(lines);
    const length = Buffer.byteLength(stream, "utf8");
    objects[entry.contentNumber - 1] = `<< /Length ${length} >>\nstream\n${stream}\nendstream`;
    objects[entry.number - 1] =
      `<< /Type /Page /Parent ${pagesNumber} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontNumber} 0 R >> >> /Contents ${entry.contentNumber} 0 R >>`;
  });

  const kids = pageEntries.map((entry) => `${entry.number} 0 R`).join(" ");
  objects[pagesNumber - 1] = `<< /Type /Pages /Count ${pageEntries.length} /Kids [${kids}] >>`;
  objects[catalogNumber - 1] = `<< /Type /Catalog /Pages ${pagesNumber} 0 R >>`;

  const parts = ["%PDF-1.4\n"];
  const xref = [];
  let offset = Buffer.byteLength(parts[0], "utf8");
  objects.forEach((object, index) => {
    xref.push(offset);
    const content = `${index + 1} 0 obj\n${object}\nendobj\n`;
    parts.push(content);
    offset += Buffer.byteLength(content, "utf8");
  });

  const xrefStart = offset;
  const header = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  parts.push(header);
  offset += Buffer.byteLength(header, "utf8");
  xref.forEach((position) => {
    const line = `${String(position).padStart(10, "0")} 00000 n \n`;
    parts.push(line);
    offset += Buffer.byteLength(line, "utf8");
  });
  const trailer = `trailer << /Size ${objects.length + 1} /Root ${catalogNumber} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  parts.push(trailer);
  return Buffer.from(parts.join(""), "utf8");
};

const buildStudentLine = (index, evaluation) => {
  const { student } = evaluation;
  const studentCode = student?.maSV || "--";
  const fullName = student?.hoTen || "--";
  const classCode = student?.maLop || "--";
  const facultyCode = student?.maKhoa || "--";
  const result = evaluation.result === "PASSED" ? "Dat" : evaluation.result === "FAILED" ? "Khong dat" : "Chua xet";
  const note = evaluation.note ? ` - ${evaluation.note}` : "";
  return `${String(index).padStart(2, "0")}. ${studentCode} | ${fullName} | Lop ${classCode} | Khoa ${facultyCode} | Diem: ${evaluation.totalPoints} | Ket qua: ${result}${note}`;
};

export const generateCouncilPdf = async ({ council, evaluations }) => {
  const lines = [];
  lines.push(...formatLine(`Bien ban hoi dong xet diem CTXH - ${council.name}`));
  lines.push(...formatLine(`Nam hoc: ${council.academicYear} - Hoc ky: ${council.semesterLabel}`));
  if (council.facultyCode) {
    lines.push(...formatLine(`Khoa/phong phu trach: ${council.facultyCode}`));
  }
  lines.push(" ");
  lines.push("Danh sach thanh vien hoi dong:");
  if (Array.isArray(council.members) && council.members.length) {
    council.members.forEach((member, idx) => {
      const label = `${idx + 1}. ${member.user?.hoTen || "Thanh vien"} - ${member.roleInCouncil}`;
      lines.push(...formatLine(label));
    });
  } else {
    lines.push("(Chua cap nhat)");
  }
  lines.push(" ");
  lines.push("Danh sach sinh vien xet duyet:");
  evaluations.forEach((evaluation, index) => {
    const studentLine = buildStudentLine(index + 1, evaluation);
    lines.push(...formatLine(studentLine));
  });
  if (!evaluations.length) {
    lines.push("Chua co sinh vien duoc them vao hoi dong.");
  }
  lines.push(" ");
  lines.push("Chu ky xac nhan:");
  lines.push("- Chu tich hoi dong");
  lines.push("- Thu ky hoi dong");
  lines.push("- Uy vien");

  const pages = buildPages(lines);
  return buildPdfBuffer(pages);
};

export default {
  generateCouncilPdf,
};