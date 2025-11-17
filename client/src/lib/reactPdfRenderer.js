const stripAccents = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const createComponent = (typeName) => {
  const Component = (props) => props.children ?? null;
  Component.__pdfType = typeName;
  return Component;
};

export const Document = createComponent('Document');
export const Page = createComponent('Page');
export const View = createComponent('View');
export const Text = createComponent('Text');
export const StyleSheet = { create: (styles) => styles };
export const Font = { register: () => {} };

const isRenderableValue = (value) => value !== null && value !== undefined && value !== false;

const flattenChildren = (children) => {
  if (!isRenderableValue(children)) return [];
  if (Array.isArray(children)) {
    return children.flatMap((child) => flattenChildren(child));
  }
  return [children];
};

const resolveElement = (element) => {
  if (!isRenderableValue(element)) return null;
  if (typeof element === 'string' || typeof element === 'number') {
    return String(element);
  }
  if (Array.isArray(element)) {
    return element.map((child) => resolveElement(child));
  }
  if (typeof element.type === 'function') {
    if (element.type.__pdfType) {
      const children = flattenChildren(element.props?.children).map((child) => resolveElement(child));
      return { type: element.type, props: element.props || {}, children };
    }
    const output = element.type({ ...(element.props || {}) });
    return resolveElement(output);
  }
  const children = flattenChildren(element.props?.children).map((child) => resolveElement(child));
  return { type: element.type, props: element.props || {}, children };
};

const collectLines = (node, lines) => {
  if (!isRenderableValue(node)) return;
  if (typeof node === 'string' || typeof node === 'number') {
    lines.push(stripAccents(String(node)));
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((child) => collectLines(child, lines));
    return;
  }
  const pdfType = node.type?.__pdfType;
  if (pdfType === 'Text') {
    const text = flattenChildren(node.children)
      .map((child) => (typeof child === 'string' || typeof child === 'number' ? stripAccents(String(child)) : ''))
      .join('');
    lines.push(text);
    return;
  }
  if (node.children && node.children.length) {
    node.children.forEach((child) => collectLines(child, lines));
  }
};

const escapePdfText = (value = '') => value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const buildContentStream = (lines) => {
  const commands = ['BT', '/F1 11 Tf', '14 TL', '1 0 0 1 40 780 Tm'];
  lines.forEach((line) => {
    commands.push(`(${escapePdfText(line || ' ')}) Tj`);
    commands.push('T*');
  });
  commands.push('ET');
  return commands.join('\n');
};

const encoder = new TextEncoder();
const byteLength = (value) => encoder.encode(value).length;

const buildPages = (lines) => {
  if (!lines.length) return [[' ']];
  const maxPerPage = 42;
  return lines.reduce((pages, line) => {
    const current = pages[pages.length - 1];
    if (current.length >= maxPerPage) {
      pages.push([]);
    }
    pages[pages.length - 1].push(line);
    return pages;
  }, [[]]);
};

const buildPdfBuffer = (pages) => {
  const objects = [];
  const addObject = (content = '') => {
    objects.push(content);
    return objects.length;
  };

  const catalogNumber = addObject();
  const pagesNumber = addObject();
  const fontNumber = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const contentEntries = [];
  const pageEntries = [];

  pages.forEach((lines) => {
    const contentNumber = addObject();
    const pageNumber = addObject();
    contentEntries.push({ number: contentNumber, lines });
    pageEntries.push({ number: pageNumber, contentNumber });
  });

  contentEntries.forEach((entry) => {
    const stream = buildContentStream(entry.lines);
    const length = byteLength(stream);
    objects[entry.number - 1] = `<< /Length ${length} >>\nstream\n${stream}\nendstream`;
  });

  pageEntries.forEach((entry) => {
    objects[entry.number - 1] =
      `<< /Type /Page /Parent ${pagesNumber} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontNumber} 0 R >> >> /Contents ${entry.contentNumber} 0 R >>`;
  });

  const kids = pageEntries.map((entry) => `${entry.number} 0 R`).join(' ');
  objects[pagesNumber - 1] = `<< /Type /Pages /Count ${pageEntries.length} /Kids [${kids}] >>`;
  objects[catalogNumber - 1] = `<< /Type /Catalog /Pages ${pagesNumber} 0 R >>`;

  const header = '%PDF-1.4\n';
  const parts = [header];
  const offsets = [];
  let offset = byteLength(header);

  objects.forEach((object, index) => {
    offsets.push(offset);
    const content = `${index + 1} 0 obj\n${object}\nendobj\n`;
    parts.push(content);
    offset += byteLength(content);
  });

  const xrefStart = offset;
  const xrefHeader = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  parts.push(xrefHeader);
  offset += byteLength(xrefHeader);

  offsets.forEach((position) => {
    const line = `${String(position).padStart(10, '0')} 00000 n \n`;
    parts.push(line);
    offset += byteLength(line);
  });

  const trailer = `trailer << /Size ${objects.length + 1} /Root ${catalogNumber} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  parts.push(trailer);

  return parts.join('');
};

export const pdf = (element) => {
  const resolved = resolveElement(element);
  const lines = [];
  collectLines(resolved, lines);
  const pages = buildPages(lines);
  const pdfString = buildPdfBuffer(pages);
  return {
    async toBlob() {
      const bytes = encoder.encode(pdfString);
      return new Blob([bytes], { type: 'application/pdf' });
    },
  };
};
