import React, { useEffect, useRef, useState } from 'react';
import { Modal, Tag, message } from 'antd';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faLocationDot, faCamera, faRotate, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import Webcam from 'react-webcam';
import styles from './CheckModal.module.scss';

const cx = classNames.bind(styles);

function CheckModal({
  open,
  onCancel,
  onSubmit,
  onCapture,
  onRetake,
  variant = 'checkin',
  campaignName,
  groupLabel,
  pointsLabel,
  dateTime,
  location,
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState(variant);
  const wasOpenRef = useRef(false);
  const prevUrlRef = useRef(null);

  const webcamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [hasVideoInput, setHasVideoInput] = useState(true);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setPhase(variant || 'checkin');
      setPreviewUrl(null);
      setFile(null);
      setIsCameraOn(false);
    }
    wasOpenRef.current = open;
  }, [open, variant]);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    async function checkDevices() {
      try {
        const devices = await navigator.mediaDevices?.enumerateDevices?.();
        const hasCam = !!devices?.some((d) => d.kind === 'videoinput');
        setHasVideoInput(hasCam);
      } catch {
        setHasVideoInput(false);
      }
    }
    if (open) checkDevices();
  }, [open]);

  const isCheckoutPhase = phase === 'checkout';

  const openCamera = async () => {
    try {
      const constraints = {
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach((t) => t.stop());
      setIsCameraOn(true);
    } catch (err) {
      if (err?.name === 'NotAllowedError') {
        message.error('Bạn đã từ chối quyền camera. Hãy cấp quyền trong cài đặt trình duyệt và thử lại.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
        message.error('Không tìm thấy thiết bị camera phù hợp.');
      } else {
        message.error('Không thể mở camera: ' + (err?.message || 'Lỗi không xác định'));
      }
    }
  };

  const stopCamera = () => setIsCameraOn(false);

  const toggleFacingMode = () => {
    setFacingMode((m) => (m === 'user' ? 'environment' : 'user'));
  };

  const dataURLtoFile = (dataUrl, fileName) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], fileName, { type: mime });
  };

  const handleCapture = () => {
    if (!webcamRef.current) return;
    const dataUrl = webcamRef.current.getScreenshot();
    if (!dataUrl) {
      message.error('Không thể chụp ảnh. Hãy thử lại hoặc kiểm tra quyền camera.');
      return;
    }
    const f = dataURLtoFile(dataUrl, `attendance_${Date.now()}.jpg`);
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    const url = URL.createObjectURL(f);
    prevUrlRef.current = url;

    setFile(f);
    setPreviewUrl(url);
    setPhase('checkout');
    setIsCameraOn(false);
    onCapture?.({ file: f, previewUrl: url });
  };

  const handleRetake = () => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
    setFile(null);
    setPreviewUrl(null);
    setPhase('checkin');
    setIsCameraOn(true);
    onRetake?.();
  };

  const handleSubmit = () => {
    if (!file) return;
    onSubmit?.({ file, previewUrl });
  };

  const fileInputRef = useRef(null);
  const openFilePicker = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    const url = URL.createObjectURL(f);
    prevUrlRef.current = url;
    setFile(f);
    setPreviewUrl(url);
    setPhase('checkout');
    setIsCameraOn(false);
    onCapture?.({ file: f, previewUrl: url });
  };

  const videoConstraints = {
    facingMode,
    width: { ideal: 360 },
    height: { ideal: 240 },
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        stopCamera();
        onCancel?.();
      }}
      footer={null}
      centered
      className={cx('check-modal')}
      title={
        <div className={cx('check-modal__header')}>
          <h3 className={cx('check-modal__title')}>Điểm danh hoạt động</h3>
        </div>
      }
    >
      <div className={cx('check-modal__body')}>
        <div className={cx('check-modal__campaign')}>
          <h4 className={cx('check-modal__campaign-title')}>{campaignName}</h4>
        </div>

        <div className={cx('check-modal__meta')}>
          {groupLabel && <Tag className={cx('check-modal__tag', 'check-modal__tag-group')}>{groupLabel}</Tag>}
          {pointsLabel && <Tag className={cx('check-modal__tag', 'check-modal__tag-points')}>{pointsLabel}</Tag>}
        </div>

        <div className={cx('check-modal__info')}>
          <div className={cx('check-modal__info-row')}>
            <FontAwesomeIcon className={cx('check-modal__info-icon')} icon={faCalendar} />
            <span className={cx('check-modal__info-text')}>{dateTime}</span>
          </div>
          <div className={cx('check-modal__info-row')}>
            <FontAwesomeIcon className={cx('check-modal__info-icon')} icon={faLocationDot} />
            <span>{location}</span>
          </div>
        </div>

        {/* Khung chụp / xem trước */}
        <div className={cx('check-modal__camera-box', !previewUrl && 'camera-box--idle')}>
          {!previewUrl && isCameraOn && hasVideoInput && (
            <div className={cx('check-modal__webcam-wrap')}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className={cx('check-modal__webcam')}
                mirrored={facingMode === 'user'}
              />
            </div>
          )}

          {/* Idle */}
          {!previewUrl && !isCameraOn && (
            <div className={cx('check-modal__camera-box-empty')}>
              <div className={cx('check-modal__camera-box-icon')}>
                <FontAwesomeIcon icon={faCamera} />
              </div>
              <div className={cx('check-modal__camera-box-title')}>Camera sẵn sàng</div>
              <div className={cx('check-modal__camera-box-hint')}>Đảm bảo khuôn mặt hiển thị rõ trong khung hình</div>
            </div>
          )}

          {/* Preview */}
          {previewUrl && <img className={cx('check-modal__camera-box-preview')} src={previewUrl} alt="preview" />}

          {/* Actions */}
          <div className={cx('check-modal__actions')}>
            {!isCheckoutPhase ? (
              <>
                {hasVideoInput && (
                  <button
                    className={cx('check-modal__confirm-button')}
                    onClick={() => {
                      if (!isCameraOn) openCamera();
                      else handleCapture();
                    }}
                  >
                    <FontAwesomeIcon icon={faCamera} style={{ marginRight: 8 }} />
                    Chụp ảnh
                  </button>
                )}
                {!hasVideoInput && (
                  <button className={cx('check-modal__confirm-button')} onClick={openFilePicker}>
                    <FontAwesomeIcon icon={faCamera} style={{ marginRight: 8 }} />
                    Chọn ảnh từ máy
                  </button>
                )}
                {isCameraOn && (
                  <button className={cx('check-modal__cancel-button')} onClick={toggleFacingMode}>
                    <FontAwesomeIcon icon={faRotate} style={{ marginRight: 8 }} />
                    Đổi camera
                  </button>
                )}
                {!isCameraOn && hasVideoInput && (
                  <button className={cx('check-modal__cancel-button')} onClick={openFilePicker}>
                    Chọn ảnh từ máy
                  </button>
                )}
              </>
            ) : (
              <>
                <button className={cx('check-modal__cancel-button')} onClick={handleRetake}>
                  <FontAwesomeIcon icon={faCamera} style={{ marginRight: 8 }} />
                  Chụp lại
                </button>
                <button className={cx('check-modal__confirm-button')} onClick={handleSubmit}>
                  <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: 8 }} />
                  Gửi điểm danh
                </button>
              </>
            )}
          </div>

          {/* Fallback input file */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>
    </Modal>
  );
}

export default CheckModal;
