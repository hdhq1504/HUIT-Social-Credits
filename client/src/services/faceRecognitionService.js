const GRID_COLUMNS = 16;
const GRID_ROWS = 8;
const CANVAS_SIZE = 128;

const toGray = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('EMPTY_IMAGE_SOURCE'));
      return;
    }
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('IMAGE_LOAD_ERROR'));
    image.src = src;
  });

const ensureCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  return canvas;
};

const normalizeDescriptor = (values) => {
  if (!values.length) return values;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance) || 1;
  return values.map((value) => {
    const normalized = (value - mean) / stdDev;
    const clamped = Math.max(-3, Math.min(3, normalized));
    return Math.round(clamped * 1e6) / 1e6;
  });
};

export const extractDescriptorFromDataUrl = async (dataUrl) => {
  const image = await loadImage(dataUrl);
  const canvas = ensureCanvas();
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const { data, width, height } = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  if (!width || !height) {
    throw new Error('INVALID_IMAGE_DATA');
  }

  const cellWidth = Math.floor(width / GRID_COLUMNS) || 1;
  const cellHeight = Math.floor(height / GRID_ROWS) || 1;
  const descriptor = [];

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLUMNS; col += 1) {
      let sum = 0;
      let count = 0;
      const startX = col * cellWidth;
      const startY = row * cellHeight;

      for (let y = startY; y < startY + cellHeight && y < height; y += 1) {
        for (let x = startX; x < startX + cellWidth && x < width; x += 1) {
          const index = (y * width + x) * 4;
          const gray = toGray(data[index], data[index + 1], data[index + 2]);
          sum += gray;
          count += 1;
        }
      }

      descriptor.push(count ? sum / count : 0);
    }
  }

  const normalized = normalizeDescriptor(descriptor);
  const variance = normalized.reduce((sum, value) => sum + value ** 2, 0) / normalized.length;
  if (variance < 0.05) {
    throw new Error('FACE_NOT_DETECTED');
  }

  return normalized;
};

export const extractDescriptors = async (dataUrls) => {
  if (!Array.isArray(dataUrls) || !dataUrls.length) return [];
  const descriptors = [];
  for (const dataUrl of dataUrls) {
    const descriptor = await extractDescriptorFromDataUrl(dataUrl);
    descriptors.push(descriptor);
  }
  return descriptors;
};

export default {
  extractDescriptorFromDataUrl,
  extractDescriptors,
};
