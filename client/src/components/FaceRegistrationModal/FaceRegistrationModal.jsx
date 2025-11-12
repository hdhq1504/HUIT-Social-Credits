import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { Modal } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import Webcam from 'react-webcam';
import { useMutation } from '@tanstack/react-query';
import faceApi from '@api/face.api';
import * as faceapi from 'face-api.js';
import { estimateFaceOrientation } from '@/utils/faceOrientation';
import useToast from '../Toast/Toast';
import styles from './FaceRegistrationModal.module.scss';

const cx = classNames.bind(styles);

const ORIENTATION_BUCKETS = [
  {
    key: 'front',
    title: 'Nhìn thẳng',
    description: 'Giữ khuôn mặt trực diện camera.',
    validate: ({ yaw, pitch }) => Math.abs(yaw) <= 0.12 && Math.abs(pitch) <= 0.12,
  },
  {
    key: 'left',
    title: 'Nghiêng trái',
    description: 'Quay nhẹ sang trái để lộ tai trái.',
    validate: ({ yaw }) => yaw >= 0.18,
  },
  {
    key: 'right',
    title: 'Nghiêng phải',
    description: 'Quay nhẹ sang phải để lộ tai phải.',
    validate: ({ yaw }) => yaw <= -0.18,
  },
  {
    key: 'down',
    title: 'Cúi xuống',
    description: 'Hạ cằm xuống một chút.',
    validate: ({ pitch }) => pitch >= 0.08,
  },
  {
    key: 'up',
    title: 'Ngẩng lên',
    description: 'Ngẩng cằm hướng lên trên.',
    validate: ({ pitch }) => pitch <= -0.08,
  },
];

const MAX_SAMPLES = ORIENTATION_BUCKETS.length;

const buildInitialCoverage = () =>
  ORIENTATION_BUCKETS.reduce((acc, bucket) => {
    acc[bucket.key] = false;
    return acc;
  }, {});

const buildInitialFaceState = () => ({
  captures: [],
  isCameraReady: false,
  processing: false,
  modelsReady: false,
  progress: 0,
  coverage: buildInitialCoverage(),
});

const mergeState = (state, updates = {}) => {
  let changed = false;
  const nextState = { ...state };

  Object.entries(updates).forEach(([key, value]) => {
    if (!Object.is(state[key], value)) {
      nextState[key] = value;
      changed = true;
    }
  });

  return changed ? nextState : state;
};

const faceRegistrationReducer = (state, action) => {
  switch (action.type) {
    case 'RESET':
      return { ...buildInitialFaceState(), ...(action.payload ?? {}) };
    case 'SET':
      return mergeState(state, action.payload ?? {});
    case 'RESET_CAPTURES':
      return { ...state, captures: [] };
    case 'ADD_CAPTURE': {
      const { capture } = action.payload ?? {};
      if (!capture) return state;
      if (state.captures.length >= MAX_SAMPLES) return state;
      if (state.captures.some((item) => item.dataUrl === capture.dataUrl)) return state;
      return { ...state, captures: [...state.captures, capture] };
    }
    case 'SET_COVERAGE': {
      const payload = action.payload ?? {};
      const nextCoverage = { ...state.coverage };
      let changed = false;

      Object.entries(payload).forEach(([key, value]) => {
        if (!Object.is(nextCoverage[key], value)) {
          nextCoverage[key] = value;
          changed = true;
        }
      });

      if (!changed) return state;
      return { ...state, coverage: nextCoverage };
    }
    default:
      return state;
  }
};

function FaceRegistrationModal({ open, onClose, onSuccess }) {
  const webcamRef = useRef(null);
  const landmarksCanvasRef = useRef(null);
  const wasOpenRef = useRef(false);
  const processingRef = useRef(false);
  const detectionIntervalRef = useRef(null);
  const progressRef = useRef(0);
  const modelsLoadedRef = useRef(false);
  const detectorOptionsRef = useRef(null);
  const coverageRef = useRef(buildInitialCoverage());
  const captureLockRef = useRef(false);
  const [state, dispatch] = useReducer(faceRegistrationReducer, null, buildInitialFaceState);
  const { captures, isCameraReady, processing, modelsReady, progress, coverage } = state;
  const { contextHolder, open: toast } = useToast();

  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const updateProgress = useCallback(
    (value) => {
      const safeValue = Math.max(0, Math.min(100, value));
      progressRef.current = safeValue;
      dispatch({ type: 'SET', payload: { progress: safeValue } });
    },
    [dispatch],
  );

  const resetCoverage = useCallback(() => {
    const freshCoverage = buildInitialCoverage();
    coverageRef.current = { ...freshCoverage };
    dispatch({ type: 'SET_COVERAGE', payload: freshCoverage });
  }, [dispatch]);

  const clearLandmarks = useCallback(() => {
    const canvas = landmarksCanvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const registrationMutation = useMutation({
    mutationFn: (payload) => faceApi.register(payload),
    onSuccess: (data) => {
      toastRef.current({ message: data?.message || 'Đăng ký khuôn mặt thành công!', variant: 'success' });
      onSuccess?.(data?.profile ?? null);
      dispatch({ type: 'RESET_CAPTURES' });
      resetCoverage();
      updateProgress(0);
      clearLandmarks();
    },
    onError: (error) => {
      const message = error?.response?.data?.error || 'Không thể đăng ký khuôn mặt. Vui lòng thử lại.';
      toastRef.current({ message, variant: 'danger' });
    },
  });

  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (!Object.is(progressRef.current, 0)) {
      updateProgress(0);
    }
    resetCoverage();
    clearLandmarks();
  }, [clearLandmarks, resetCoverage, updateProgress]);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      dispatch({
        type: 'RESET',
        payload: { modelsReady: modelsLoadedRef.current },
      });
    }
    if (!open && wasOpenRef.current) {
      stopDetection();
      dispatch({ type: 'RESET' });
      processingRef.current = false;
    }
    wasOpenRef.current = open;
  }, [dispatch, open, stopDetection]);

  const ensureFaceModels = useCallback(async () => {
    if (modelsLoadedRef.current) {
      dispatch({ type: 'SET', payload: { modelsReady: true } });
      return;
    }
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      modelsLoadedRef.current = true;
      dispatch({ type: 'SET', payload: { modelsReady: true } });
    } catch (error) {
      console.error('Failed to load face-api models', error);
      toastRef.current({ message: 'Không thể tải mô hình nhận diện khuôn mặt.', variant: 'danger' });
      dispatch({ type: 'SET', payload: { modelsReady: false } });
    }
  }, [dispatch]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    (async () => {
      await ensureFaceModels();
      if (!cancelled && modelsLoadedRef.current) {
        dispatch({ type: 'SET', payload: { modelsReady: true } });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, open, ensureFaceModels]);

  const addCapture = useCallback(
    (dataUrl, descriptor, { silent } = {}) => {
      if (!dataUrl || captures.length >= MAX_SAMPLES) return;
      if (captures.some((item) => item.dataUrl === dataUrl)) return;

      const capturedAt = new Date().toISOString();
      dispatch({ type: 'ADD_CAPTURE', payload: { capture: { dataUrl, descriptor, capturedAt } } });

      const nextLength = Math.min(captures.length + 1, MAX_SAMPLES);
      if (silent !== true) {
        toastRef.current({
          message: `Đã ghi nhận ảnh ${nextLength}/${MAX_SAMPLES}`,
          variant: nextLength === MAX_SAMPLES ? 'success' : 'info',
        });
      }
    },
    [captures, dispatch],
  );

  const runCapture = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!webcamRef.current?.video) {
          throw new Error('WEBCAM_NOT_AVAILABLE');
        }
        if (processing) return false;

        const dataUrl = webcamRef.current.getScreenshot();
        if (!dataUrl) {
          throw new Error('CAPTURE_FAILED');
        }
        processingRef.current = true;
        dispatch({ type: 'SET', payload: { processing: true } });

        const detection = await faceapi
          .detectSingleFace(webcamRef.current.video, detectorOptionsRef.current)
          .withFaceLandmarks(true)
          .withFaceDescriptor();

        if (!detection) {
          throw new Error('FACE_NOT_DETECTED');
        }

        const descriptor = Array.from(detection.descriptor);
        addCapture(dataUrl, descriptor, { silent });
        return true;
      } catch (error) {
        console.error('Face capture error:', error);
        if (!silent) {
          const message =
            error.message === 'FACE_NOT_DETECTED'
              ? 'Không nhận diện được khuôn mặt. Vui lòng thử lại.'
              : 'Chụp ảnh thất bại. Vui lòng thử lại.';
          toastRef.current({ message, variant: 'danger' });
        }
        return false;
      } finally {
        processingRef.current = false;
        dispatch({ type: 'SET', payload: { processing: false } });
      }
    },
    [dispatch, processing, addCapture, detectorOptionsRef],
  );

  useEffect(() => {
    if (!open || !isCameraReady || !modelsReady || captures.length >= MAX_SAMPLES) {
      stopDetection();
      return undefined;
    }

    stopDetection();
    let cancelled = false;

    const detect = async () => {
      if (cancelled || captureLockRef.current || !webcamRef.current?.video) {
        return;
      }
      const video = webcamRef.current.video;
      if (!video || video.readyState < 2) {
        return;
      }
      try {
        if (!detectorOptionsRef.current) {
          detectorOptionsRef.current = new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 });
        }
        const detection = await faceapi
          .detectSingleFace(video, detectorOptionsRef.current)
          .withFaceLandmarks(true);

        if (cancelled) return;

        if (!detection || !detection.landmarks) {
          clearLandmarks();
          return;
        }

        const canvas = landmarksCanvasRef.current;
        if (canvas) {
          const context = canvas.getContext('2d');
          if (context) {
            const { videoWidth, videoHeight } = video;
            if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
              canvas.width = videoWidth;
              canvas.height = videoHeight;
            }
            context.clearRect(0, 0, canvas.width, canvas.height);
            const resizedLandmarks = detection.landmarks.forSize(canvas.width, canvas.height);
            faceapi.draw.drawFaceLandmarks(canvas, resizedLandmarks, {
              drawLines: true,
              lineWidth: 2,
              color: '#22c55e',
            });
          }
        }

        const estimatedOrientation = estimateFaceOrientation(detection.landmarks, { mirrored: true });

        const nextBucket = ORIENTATION_BUCKETS.find(
          (bucket) => !coverageRef.current[bucket.key] && bucket.validate(estimatedOrientation),
        );

        if (!nextBucket || processingRef.current) {
          return;
        }

        captureLockRef.current = true;
        coverageRef.current[nextBucket.key] = true;
        dispatch({ type: 'SET_COVERAGE', payload: { [nextBucket.key]: true } });

        try {
          const success = await runCapture({ silent: false });
          if (!success) {
            coverageRef.current[nextBucket.key] = false;
            dispatch({ type: 'SET_COVERAGE', payload: { [nextBucket.key]: false } });
            return;
          }

          const completed = ORIENTATION_BUCKETS.filter((bucket) => coverageRef.current[bucket.key]).length;
          const nextProgress = (completed / MAX_SAMPLES) * 100;
          updateProgress(nextProgress);
        } finally {
          captureLockRef.current = false;
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('Face detection error', error);
        }
      }
    };

    detectionIntervalRef.current = setInterval(() => {
      void detect();
    }, 200);

    return () => {
      cancelled = true;
      stopDetection();
    };
  }, [captures.length, clearLandmarks, dispatch, isCameraReady, modelsReady, open, runCapture, stopDetection, updateProgress]);

  const handleSubmit = async () => {
    if (captures.length < MAX_SAMPLES || registrationMutation.isPending) return;
    try {
      const descriptors = captures.map((item) => item.descriptor);
      const samples = captures.map((item) => ({ dataUrl: item.dataUrl, capturedAt: item.capturedAt }));
      await registrationMutation.mutateAsync({ descriptors, samples });
      onClose?.();
    } catch {
      // handled by mutation
    }
  };

  const instructions = useMemo(
    () => [
      'Đưa khuôn mặt vào giữa khung hình và di chuyển nhẹ sang trái, phải, lên và xuống để hệ thống quét đầy đủ.',
      'Giữ ánh sáng ổn định, tránh che chắn khuôn mặt bằng khẩu trang hoặc kính râm.',
      'Giữ khoảng cách vừa phải (40-60cm) để điểm mốc được nhận diện chính xác.',
    ],
    [],
  );

  const completedCount = captures.length;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnHidden
      className={cx('modal')}
      title={
        <div className={cx('modal__title')}>
          <FontAwesomeIcon icon={faCircleCheck} className={cx('modal__title-icon')} />
          <span>Đăng ký nhận diện khuôn mặt</span>
        </div>
      }
    >
      {contextHolder}
      <div className={cx('modal__body')}>
        <aside className={cx('modal__instructions')}>
          <h4>Hướng dẫn</h4>
          <ol>
            {instructions.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ol>
        </aside>

        <section className={cx('modal__content')}>
          <div className={cx('modal__viewer')}>
            {completedCount < MAX_SAMPLES ? (
              <div className={cx('modal__camera-frame')}>
                <Webcam
                  className={cx('modal__webcam')}
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  mirrored
                  onUserMedia={() => dispatch({ type: 'SET', payload: { isCameraReady: true } })}
                  onUserMediaError={() => dispatch({ type: 'SET', payload: { isCameraReady: false } })}
                />
                <canvas ref={landmarksCanvasRef} className={cx('modal__landmarks')} />
                <div className={cx('modal__overlay')}>
                  <div
                    className={cx('modal__progress', progress >= 100 && 'modal__progress--active')}
                    style={{
                      '--progress-angle': `${Math.round((progress / 100) * 360)}deg`,
                    }}
                  >
                    <div className={cx('modal__progress-content')}>
                      <FontAwesomeIcon icon={progress >= 100 ? faCircleCheck : faCamera} />
                      <span>{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <div className={cx('modal__overlay-hint')}>
                    <span className={cx('modal__step-title')}>
                      {progress >= 100 ? 'Quét hoàn tất' : 'Đang quét khuôn mặt'}
                    </span>
                    <p>
                      {progress >= 100
                        ? 'Đã thu đủ dữ liệu khuôn mặt. Bấm hoàn tất để đăng ký.'
                        : 'Di chuyển khuôn mặt nhẹ nhàng để hệ thống ghi nhận đầy đủ các góc.'}
                    </p>
                    <ul className={cx('modal__status-list')}>
                      {ORIENTATION_BUCKETS.map((bucket) => (
                        <li
                          key={bucket.key}
                          className={cx(
                            'modal__status-item',
                            coverage[bucket.key] && 'modal__status-item--done',
                          )}
                        >
                          <FontAwesomeIcon icon={coverage[bucket.key] ? faCircleCheck : faCamera} />
                          <span>{bucket.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className={cx('modal__completed')}>
                <FontAwesomeIcon icon={faCircleCheck} />
                <p>Đã thu đủ dữ liệu khuôn mặt. Sẵn sàng đăng ký!</p>
              </div>
            )}
          </div>
          <div className={cx('modal__actions')}>
            <button
              type="button"
              className={cx(
                'modal__btn',
                'modal__btn--success',
                completedCount < MAX_SAMPLES && 'modal__btn--disabled',
              )}
              onClick={handleSubmit}
              disabled={completedCount < MAX_SAMPLES || registrationMutation.isPending || processing}
            >
              {registrationMutation.isPending ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
            </button>
          </div>
          <div className={cx('modal__previews')}>
            {captures.map((item, index) => (
              <div key={item.dataUrl} className={cx('modal__preview-card')}>
                <img src={item.dataUrl} alt={`Ảnh ${index + 1}`} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}

FaceRegistrationModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSuccess: PropTypes.func,
};

export default FaceRegistrationModal;
