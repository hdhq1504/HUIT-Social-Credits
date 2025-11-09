import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import { Modal, Steps, Tag } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faCircleCheck, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import Webcam from 'react-webcam';
import { useMutation } from '@tanstack/react-query';
import faceApi from '@api/face.api';
import faceRecognitionService from '@/services/faceRecognitionService';
import useToast from '../Toast/Toast';
import styles from './FaceRegistrationModal.module.scss';

const cx = classNames.bind(styles);

const MAX_SAMPLES = 5;

function FaceRegistrationModal({ open, onClose, onSuccess }) {
  const webcamRef = useRef(null);
  const wasOpenRef = useRef(false);
  const processingRef = useRef(false);
  const capturesRef = useRef([]);
  const [captures, setCaptures] = useState([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [autoCapturing, setAutoCapturing] = useState(false);
  const { contextHolder, open: toast } = useToast();

  const registrationMutation = useMutation({
    mutationFn: (payload) => faceApi.register(payload),
    onSuccess: (data) => {
      toast({ message: data?.message || 'Đăng ký khuôn mặt thành công!', variant: 'success' });
      onSuccess?.(data?.profile ?? null);
      setCaptures([]);
    },
    onError: (error) => {
      const message = error?.response?.data?.error || 'Không thể đăng ký khuôn mặt. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setCaptures([]);
      setProcessing(false);
      setIsCameraReady(false);
      setAutoCapturing(true);
    }
    if (!open && wasOpenRef.current) {
      setCaptures([]);
      setProcessing(false);
      setIsCameraReady(false);
      setAutoCapturing(false);
      processingRef.current = false;
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    capturesRef.current = captures;
  }, [captures]);

  const addCapture = useCallback(
    (dataUrl, descriptor, { silent } = {}) => {
      const capturedAt = new Date().toISOString();
      let nextLength = null;
      setCaptures((prev) => {
        if (prev.length >= MAX_SAMPLES) return prev;
        if (prev.some((item) => item.dataUrl === dataUrl)) return prev;
        const next = [...prev, { dataUrl, descriptor, capturedAt }];
        nextLength = next.length;
        return next;
      });

      if (nextLength && nextLength <= MAX_SAMPLES && silent !== true) {
        toast({
          message: `Đã ghi nhận ảnh ${nextLength}/${MAX_SAMPLES}`,
          variant: nextLength === MAX_SAMPLES ? 'success' : 'info',
        });
      }
    },
    [toast],
  );

  const runCapture = useCallback(
    async ({ silent = false, skipErrorToast = false } = {}) => {
      if (processingRef.current || !webcamRef.current) return false;

      const dataUrl = webcamRef.current.getScreenshot();
      if (!dataUrl) {
        if (!skipErrorToast) {
          toast({
            message: 'Không thể chụp ảnh. Hãy đảm bảo camera đang hoạt động.',
            variant: 'danger',
          });
        }
        return false;
      }

      processingRef.current = true;
      setProcessing(true);

      try {
        const descriptor = await faceRecognitionService.extractDescriptorFromDataUrl(dataUrl);
        addCapture(dataUrl, descriptor, { silent });
        return true;
      } catch (error) {
        const code = error?.message || '';
        if (!skipErrorToast) {
          const message =
            code === 'FACE_NOT_DETECTED'
              ? 'Không tìm thấy khuôn mặt trong ảnh. Vui lòng điều chỉnh góc chụp và thử lại.'
              : 'Không thể xử lý ảnh khuôn mặt. Vui lòng thử lại.';
          toast({ message, variant: 'danger' });
        }
        return false;
      } finally {
        processingRef.current = false;
        setProcessing(false);
      }
    },
    [addCapture, toast],
  );

  const handleCapture = useCallback(() => {
    void runCapture();
  }, [runCapture]);

  useEffect(() => {
    if (!open || !isCameraReady) {
      return undefined;
    }
    if (captures.length >= MAX_SAMPLES) {
      setAutoCapturing(false);
      return undefined;
    }

    setAutoCapturing(true);
    let isCancelled = false;
    const interval = setInterval(() => {
      if (isCancelled) return;
      if (processingRef.current) return;
      if ((capturesRef.current?.length ?? 0) >= MAX_SAMPLES) {
        setAutoCapturing(false);
        return;
      }
      void runCapture({ skipErrorToast: true });
    }, 1500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [open, isCameraReady, captures.length, runCapture]);

  const handleRemoveLast = () => {
    setCaptures((prev) => prev.slice(0, prev.length - 1));
  };

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
      'Chụp đủ 5 ảnh với các góc độ khác nhau (thẳng, trái, phải, cúi, ngẩng).',
      'Giữ khuôn mặt trong khung hình, tránh ánh sáng ngược.',
      'Không sử dụng khẩu trang, kính râm hoặc che mặt.',
    ],
    [],
  );

  const stepItems = useMemo(
    () =>
      Array.from({ length: MAX_SAMPLES }).map((_, index) => ({
        title: `Ảnh ${index + 1}`,
        status: index < captures.length ? 'finish' : 'wait',
      })),
    [captures.length],
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
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
        <section className={cx('modal__instructions')}>
          <h4>Hướng dẫn</h4>
          <ul>
            {instructions.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </section>

        <section className={cx('modal__content')}>
          <Steps current={captures.length} items={stepItems} className={cx('modal__steps')} responsive={false} />

          <div className={cx('modal__status')}>
            <Tag color={captures.length >= MAX_SAMPLES ? 'green' : autoCapturing ? 'geekblue' : 'default'}>
              {!isCameraReady
                ? 'Đang khởi tạo camera…'
                : captures.length >= MAX_SAMPLES
                  ? 'Đã đủ ảnh. Bạn có thể hoàn tất đăng ký.'
                  : autoCapturing
                    ? 'Đang tự động ghi nhận khuôn mặt…'
                    : 'Giữ khuôn mặt trong vòng tròn để hệ thống quét.'}
            </Tag>
          </div>

          <div className={cx('modal__camera')}>
            {captures.length < MAX_SAMPLES ? (
              <div className={cx('modal__camera-frame')}>
                <Webcam
                  className={cx('modal__webcam')}
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  mirrored
                  onUserMedia={() => setIsCameraReady(true)}
                  onUserMediaError={() => setIsCameraReady(false)}
                />
                <div className={cx('modal__camera-overlay')}>
                  <div className={cx('modal__camera-circle')} aria-hidden />
                  <span className={cx('modal__camera-hint')}>
                    Căn chỉnh khuôn mặt trong vòng tròn để ghi nhận tự động
                  </span>
                  <span className={cx('modal__camera-indicator', processing && 'modal__camera-indicator--active')}>
                    {processing
                      ? 'Đang xử lý...'
                      : !isCameraReady
                        ? 'Đang mở camera'
                        : autoCapturing
                          ? 'Đang quét'
                          : 'Sẵn sàng'}
                  </span>
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
              className={cx('modal__btn', 'modal__btn--primary')}
              onClick={handleCapture}
              disabled={!isCameraReady || captures.length >= MAX_SAMPLES || processing}
            >
              <FontAwesomeIcon icon={faCamera} />
              <span>Chụp ảnh</span>
            </button>
            <button
              type="button"
              className={cx('modal__btn', captures.length === 0 && 'modal__btn--disabled')}
              onClick={handleRemoveLast}
              disabled={captures.length === 0 || processing}
            >
              <FontAwesomeIcon icon={faRotateLeft} />
              <span>Chụp lại ảnh cuối</span>
            </button>
            <button
              type="button"
              className={cx(
                'modal__btn',
                'modal__btn--success',
                captures.length < MAX_SAMPLES && 'modal__btn--disabled',
              )}
              onClick={handleSubmit}
              disabled={captures.length < MAX_SAMPLES || registrationMutation.isPending || processing}
            >
              {registrationMutation.isPending ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
            </button>
          </div>

          <div className={cx('modal__previews')}>
            {captures.map((item, index) => (
              <div key={item.dataUrl} className={cx('modal__preview-card')}>
                <img src={item.dataUrl} alt={`Ảnh ${index + 1}`} />
                <Tag color="blue">Ảnh {index + 1}</Tag>
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
