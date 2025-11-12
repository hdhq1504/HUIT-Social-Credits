import * as faceapi from 'face-api.js';

const MODEL_BASE_PATH = '/models';
const DEFAULT_DETECTOR_OPTIONS = { scoreThreshold: 0.5, inputSize: 224 };

const toArray = (descriptor) => {
  if (!descriptor) return null;
  if (Array.isArray(descriptor)) return descriptor.map((value) => Number(value));
  if (descriptor instanceof Float32Array || descriptor instanceof Float64Array) {
    return Array.from(descriptor, (value) => Number(value));
  }
  if (typeof descriptor === 'object' && typeof descriptor.length === 'number') {
    return Array.from(descriptor, (value) => Number(value));
  }
  return null;
};

class FaceRecognitionService {
  constructor() {
    this.modelsLoading = null;
    this.detectorOptions = null;
  }

  async loadModels() {
    if (!this.modelsLoading) {
      this.modelsLoading = Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_BASE_PATH),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_BASE_PATH),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE_PATH),
      ])
        .then(() => true)
        .catch((error) => {
          this.modelsLoading = null;
          throw error;
        });
    }
    await this.modelsLoading;
  }

  async ensureModelsLoaded() {
    try {
      await this.loadModels();
    } catch (error) {
      const failure = new Error('FACE_MODEL_LOADING_FAILED');
      failure.cause = error;
      throw failure;
    }
  }

  getDetectorOptions() {
    if (!this.detectorOptions) {
      const { scoreThreshold, inputSize } = DEFAULT_DETECTOR_OPTIONS;
      this.detectorOptions = new faceapi.TinyFaceDetectorOptions({ scoreThreshold, inputSize });
    }
    return this.detectorOptions;
  }

  async detectFaceDescriptor(source) {
    await this.ensureModelsLoaded();

    const detection = await faceapi
      .detectSingleFace(source, this.getDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!detection?.descriptor) {
      throw new Error('FACE_NOT_DETECTED');
    }

    const descriptor = toArray(detection.descriptor);
    if (!descriptor || descriptor.length !== 128) {
      throw new Error('FACE_DESCRIPTOR_INVALID');
    }
    return descriptor;
  }

  async extractDescriptorFromDataUrl(dataUrl) {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      throw new Error('FACE_DATA_URL_INVALID');
    }

    const image = await faceapi.fetchImage(dataUrl);
    return this.detectFaceDescriptor(image);
  }

  async extractDescriptorFromVideoFrame(videoElement) {
    if (!videoElement) {
      throw new Error('FACE_SOURCE_UNAVAILABLE');
    }
    return this.detectFaceDescriptor(videoElement);
  }
}

const faceRecognitionService = new FaceRecognitionService();

export default faceRecognitionService;
