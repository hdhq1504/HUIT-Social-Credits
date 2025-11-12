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

const MATCH_DURATION_MS = 1200;
const STEP_SEQUENCE = [
  {
    key: 'front',
    title: 'Nhìn thẳng',
    description: 'Giữ thẳng đầu, nhìn trực diện vào camera.',
    hint: 'Giữ mặt cân đối trong khung tròn.',
    validate: ({ yaw, pitch }) => Math.abs(yaw) <= 0.12 && Math.abs(pitch) <= 0.12,
  },
  {
    key: 'left',
    title: 'Nghiêng trái',
    description: 'Quay mặt nhẹ sang trái sao cho tai trái tiến gần về phía camera.',
    hint: 'Nghiêng mặt sang trái và giữ ổn định.',
    validate: ({ yaw }) => yaw >= 0.18,
  },
  {
    key: 'right',
    title: 'Nghiêng phải',
    description: 'Quay mặt nhẹ sang phải và giữ mắt nhìn về camera.',
    hint: 'Nghiêng mặt sang phải và giữ ổn định.',
    validate: ({ yaw }) => yaw <= -0.18,
  },
  {
    key: 'down',
    title: 'Cúi đầu',
    description: 'Cúi cằm nhẹ xuống, vẫn nhìn vào camera.',
    hint: 'Hạ cằm xuống một chút rồi giữ nguyên.',
    validate: ({ pitch }) => pitch >= 0.08,
  },
  {
    key: 'up',
    title: 'Ngẩng đầu',
    description: 'Ngẩng đầu nhẹ lên phía trên.',
    hint: 'Ngẩng cằm lên một chút rồi giữ nguyên.',
    validate: ({ pitch }) => pitch <= -0.08,
  },
];
const MAX_SAMPLES = STEP_SEQUENCE.length;

const buildInitialOrientation = (overrides = {}) => ({ yaw: 0, pitch: 0, matched: false, ...overrides });

const buildInitialFaceState = () => ({
  captures: [],
  isCameraReady: false,
  processing: false,
  modelsReady: false,
  progress: 0,
  orientation: buildInitialOrientation(),
});

const faceRegistrationReducer = (state, action) => {
  switch (action.type) {
    case 'RESET':
      return { ...buildInitialFaceState(), ...(action.payload ?? {}) };
    case 'SET':
      return { ...state, ...action.payload };
    case 'RESET_CAPTURES':
      return { ...state, captures: [] };
    case 'ADD_CAPTURE': {
      const { capture } = action.payload ?? {};
      if (!capture) return state;
      if (state.captures.length >= MAX_SAMPLES) return state;
      if (state.captures.some((item) => item.dataUrl === capture.dataUrl)) return state;
      return { ...state, captures: [...state.captures, capture] };
    }
    case 'SET_ORIENTATION':
      return { ...state, orientation: buildInitialOrientation(action.payload ?? {}) };
    default:
      return state;
  }
};

function FaceRegistrationModal({ open, onClose, onSuccess }) {
  const webcamRef = useRef(null);
  const wasOpenRef = useRef(false);
  const processingRef = useRef(false);
  const detectionIntervalRef = useRef(null);
  const matchStartRef = useRef(null);
  const progressRef = useRef(0);
  const modelsLoadedRef = useRef(false);
  const detectorOptionsRef = useRef(null);
  const [state, dispatch] = useReducer(faceRegistrationReducer, null, buildInitialFaceState);
  const { captures, isCameraReady, processing, modelsReady, progress, orientation } = state;
  const { contextHolder, open: toast } = useToast();

  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const registrationMutation = useMutation({
    mutationFn: (payload) => faceApi.register(payload),
    onSuccess: (data) => {
      toastRef.current({ message: data?.message || 'Đăng ký khuôn mặt thành công!', variant: 'success' });
      onSuccess?.(data?.profile ?? null);
      dispatch({ type: 'RESET_CAPTURED' });
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
    matchStartRef.current = null;
    progressRef.current = 0;
    dispatch({ type: 'SET', payload: { progress: 0 } });
    dispatch({ type: 'SET_ORIENTATION' });
  }, [dispatch]);

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
        dispatch({ type: 'SET', processing: true });

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
          toast.error(message);
        }
        return false;
      } finally {
        dispatch({ type: 'SET', processing: true });
      }
    },
    [dispatch, processing, toast, addCapture, detectorOptionsRef],
  );

  const pendingStep = useMemo(() => {
    if (captures.length >= STEP_SEQUENCE.length) return null;
    return STEP_SEQUENCE[captures.length];
  }, [captures.length]);

  const updateProgress = useCallback((value) => {
    const safeValue = Math.max(0, Math.min(100, value));
    progressRef.current = safeValue;
    dispatch({ type: 'SET', payload: { progress: safeValue } });
  }, []);

  useEffect(() => {
    updateProgress(0);
    dispatch({ type: 'SET_ORIENTATION', payload: { yaw: orientation.yaw, pitch: orientation.pitch, matched: false } });
    matchStartRef.current = null;
  }, [captures.length, dispatch, orientation.pitch, orientation.yaw, updateProgress]);

  useEffect(() => {
    if (!open || !isCameraReady || !modelsReady || !pendingStep) {
      stopDetection();
      return undefined;
    }

    stopDetection();
    let cancelled = false;
    let isCapturing = false;

    const detect = async () => {
      if (cancelled || isCapturing || !webcamRef.current?.video) {
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
        const detection = await faceapi.detectSingleFace(video, detectorOptionsRef.current).withFaceLandmarks(true);

        if (cancelled) return;

        if (!detection || !detection.landmarks) {
          if (progressRef.current !== 0) {
            updateProgress(0);
          }
          dispatch({ type: 'SET_ORIENTATION' });
          matchStartRef.current = null;
          return;
        }

        const estimatedOrientation = estimateFaceOrientation(detection.landmarks, { mirrored: true });
        const matched = pendingStep.validate(estimatedOrientation);
        dispatch({ type: 'SET_ORIENTATION', payload: { ...estimatedOrientation, matched } });

        if (matched) {
          if (!matchStartRef.current) {
            matchStartRef.current = performance.now();
          }
          const elapsed = performance.now() - matchStartRef.current;
          const ratio = Math.min(elapsed / MATCH_DURATION_MS, 1);
          const nextProgress = ratio * 100;
          if (Math.abs(nextProgress - progressRef.current) >= 1) {
            updateProgress(nextProgress);
          }

          if (ratio >= 1 && !isCapturing && !processingRef.current) {
            isCapturing = true;
            matchStartRef.current = null;
            updateProgress(0);
            const success = await runCapture({ silent: false, skipErrorToast: false });
            isCapturing = false;

            if (!success) {
              matchStartRef.current = null;
            }
          }
        } else {
          if (progressRef.current !== 0) {
            updateProgress(0);
          }
          matchStartRef.current = null;
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
  }, [dispatch, isCameraReady, modelsReady, open, pendingStep, runCapture, stopDetection, updateProgress]);

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
      'Thực hiện lần lượt 5 góc chụp: Nhìn thẳng, nghiêng trái, nghiêng phải, cúi đầu, ngẩng đầu.',
      'Giữ khuôn mặt nằm trọn trong vòng tròn và tránh ánh sáng quá mạnh phía sau.',
      'Không đeo khẩu trang, kính râm hoặc che khuất khuôn mặt.',
    ],
    [],
  );

  const completedCount = captures.length;
  const activeStep = completedCount >= STEP_SEQUENCE.length ? null : STEP_SEQUENCE[completedCount];

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
                <div className={cx('modal__overlay')}>
                  <div
                    className={cx('modal__progress', orientation.matched && 'modal__progress--active')}
                    style={{
                      '--progress-angle': `${Math.round((progress / 100) * 360)}deg`,
                    }}
                  >
                    <div className={cx('modal__progress-content')}>
                      <FontAwesomeIcon icon={orientation.matched ? faCircleCheck : faCamera} />
                      <span>{Math.round(progress)}%</span>
                    </div>
                  </div>
                  <div className={cx('modal__overlay-hint')}>
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        zIndex: 10,
                      }}
                    >
                      {/* Hiển thị giá trị Yaw (Nghiêng) và Pitch (Ngẩng) */}
                      <div>Yaw: {orientation.yaw.toFixed(2)}</div>
                      <div>Pitch: {orientation.pitch.toFixed(2)}</div>
                    </div>

                    {activeStep ? (
                      <>
                        <span className={cx('modal__step-title')}>{activeStep.title}</span>
                        <p>{activeStep.description}</p>
                      </>
                    ) : (
                      <>
                        <span className={cx('modal__step-title')}>Hoàn tất</span>
                        <p>Đã đủ {MAX_SAMPLES} ảnh. Vui lòng bấm hoàn tất đăng ký.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={cx('modal__completed')}>
                <FontAwesomeIcon icon={faCircleCheck} />
                <p>Đã đủ {MAX_SAMPLES} ảnh. Sẵn sàng đăng ký!</p>
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
