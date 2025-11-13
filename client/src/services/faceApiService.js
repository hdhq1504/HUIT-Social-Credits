import * as faceapi from 'face-api.js';

const LOCAL_MODEL_URL = '/models';
const CDN_MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';

let loadPromise = null;

const loadFromBase = async (baseUrl) => {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(baseUrl),
    faceapi.nets.faceLandmark68Net.loadFromUri(baseUrl),
    faceapi.nets.faceRecognitionNet.loadFromUri(baseUrl),
  ]);
};

export const ensureModelsLoaded = async () => {
  if (!loadPromise) {
    loadPromise = loadFromBase(LOCAL_MODEL_URL).catch(async () => {
      console.warn('Không thể tải mô hình từ thư mục cục bộ, thử tải từ CDN.');
      await loadFromBase(CDN_MODEL_URL);
    });
  }
  await loadPromise;
};

export const computeDescriptorFromDataUrl = async (dataUrl, { minConfidence = 0.4 } = {}) => {
  if (!dataUrl) return null;
  await ensureModelsLoaded();
  const image = await faceapi.fetchImage(dataUrl);
  const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: minConfidence }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return Array.from(detection.descriptor || []);
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
