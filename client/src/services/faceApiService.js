import * as faceapi from 'face-api.js';

const LOCAL_MODEL_URL = '/models';
const CDN_MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';

let loadPromise = null;

const loadFromBase = async (baseUrl) => {
  console.debug('[face-api] Đang tải mô hình nhận diện từ:', baseUrl);
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(baseUrl),
    faceapi.nets.faceLandmark68Net.loadFromUri(baseUrl),
    faceapi.nets.faceRecognitionNet.loadFromUri(baseUrl),
  ]);
  console.debug('[face-api] Đã tải mô hình nhận diện thành công từ:', baseUrl);
};

export const ensureModelsLoaded = async () => {
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        await loadFromBase(LOCAL_MODEL_URL);
      } catch (localError) {
        console.warn('Không thể tải mô hình từ thư mục cục bộ, thử tải từ CDN.', localError);
        await loadFromBase(CDN_MODEL_URL);
      }
    })();
  }
  await loadPromise;
};

export const computeDescriptorFromDataUrl = async (dataUrl, { minConfidence = 0.5 } = {}) => {
  if (!dataUrl) return null;
  await ensureModelsLoaded();
  console.debug('[face-api] Bắt đầu trích xuất descriptor khuôn mặt.');
  const image = await faceapi.fetchImage(dataUrl);
  const detection = await faceapi
    .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) {
    console.debug('[face-api] Không phát hiện được khuôn mặt trong ảnh.');
    return null;
  }
  const descriptor = Array.from(detection.descriptor || []);
  console.debug('[face-api] Hoàn tất trích xuất descriptor, độ dài:', descriptor.length);
  return descriptor;
};

export const computeMultipleDescriptors = async (dataUrls = [], options) => {
  await ensureModelsLoaded();
  const results = [];
  for (const url of dataUrls) {
    const descriptor = await computeDescriptorFromDataUrl(url, options);
    if (descriptor) {
      results.push(descriptor);
    }
  }
  return results;
};

export default {
  ensureModelsLoaded,
  computeDescriptorFromDataUrl,
  computeMultipleDescriptors,
};
