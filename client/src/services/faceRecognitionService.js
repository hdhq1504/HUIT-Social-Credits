import * as faceapi from 'face-api.js';

const MODEL_URI = '/models';

let baseModelsPromise = null;
let recognitionModelPromise = null;

const createDetectorOptions = (overrides = {}) =>
  new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.5,
    ...overrides,
  });

const loadBaseModels = () => {
  if (!baseModelsPromise) {
    baseModelsPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URI),
    ]);
  }
  return baseModelsPromise;
};

const loadRecognitionModel = () => {
  if (!recognitionModelPromise) {
    recognitionModelPromise = faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URI);
  }
  return recognitionModelPromise;
};

const ensureModelsLoaded = async ({ withRecognition = false } = {}) => {
  await loadBaseModels();
  if (withRecognition) {
    await loadRecognitionModel();
  }
};

const extractDescriptorFromDataUrl = async (dataUrl, options) => {
  if (!dataUrl) {
    throw new Error('INVALID_IMAGE');
  }

  await ensureModelsLoaded({ withRecognition: true });

  const detectorOptions =
    options?.detectorOptions instanceof faceapi.TinyFaceDetectorOptions
      ? options.detectorOptions
      : createDetectorOptions(options?.detectorOptions);

  const image = await faceapi.fetchImage(dataUrl);
  try {
    const detection = await faceapi
      .detectSingleFace(image, detectorOptions)
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('FACE_NOT_DETECTED');
    }

    return Array.from(detection.descriptor);
  } finally {
    if (image instanceof HTMLElement && typeof image.remove === 'function') {
      image.remove();
    }
  }
};

export default {
  ensureModelsLoaded,
  extractDescriptorFromDataUrl,
  createDetectorOptions,
};
