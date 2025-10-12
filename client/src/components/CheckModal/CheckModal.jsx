import React, { useEffect, useRef, useState, useMemo } from 'react';
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

  // Camera state
  const webcamRef = useRef(null);
  const activeStreamRef = useRef(null); // giữ stream hiện tại để stop cứng khi đóng
  const [isCameraOn, setIsCameraOn] = useState(false);

  // Danh sách camera & camera đang chọn
  const [videoInputs, setVideoInputs] = useState([]); // [{deviceId, label}, ...]
  const [deviceId, setDeviceId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasVideoInput, setHasVideoInput] = useState(true);

  // ========= Helpers =========
  const revokePreview = () => {
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    prevUrlRef.current = null;
  };

  // Dừng toàn bộ track của stream (fix Safari/IOS không tắt đèn camera)
  const hardStopCamera = () => {
    try {
      const videoEl =
        webcamRef.current?.video ||
        webcamRef.current?.videoRef?.current ||
        document.querySelector('.check-modal video');

      const stream = videoEl?.srcObject || webcamRef.current?.stream || activeStreamRef.current;

      if (stream?.getTracks) {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
      }
    } catch {}
    activeStreamRef.current = null;
    setIsCameraOn(false);
  };

  // ========= Effects =========
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setPhase(variant || 'checkin');
      setPreviewUrl(null);
      setFile(null);
      setIsCameraOn(false);
      setDeviceId(null);
      setCurrentIndex(0);
    }
    // Khi chuyển từ open=true -> false: tắt camera cứng
    if (!open && wasOpenRef.current) {
      hardStopCamera();
      revokePreview();
    }
    wasOpenRef.current = open;
  }, [open, variant]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      hardStopCamera();
      revokePreview();
    };
  }, []);

  const enumerateVideoInputs = async () => {
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices?.();
      const vids = (devices || []).filter((d) => d.kind === 'videoinput');
      setVideoInputs(vids);
      setHasVideoInput(vids.length > 0);

      if (vids.length) {
        const backIdx = vids.findIndex((d) => /back|rear|environment/i.test(d.label));
        const idx = backIdx >= 0 ? backIdx : 0;
        setCurrentIndex(idx);
        setDeviceId(vids[idx].deviceId);
      } else {
        setDeviceId(null);
      }
    } catch {
      setHasVideoInput(false);
    }
  };

  // Xin quyền trước, sau đó liệt kê device và bật khung
  const openCamera = async () => {
    try {
      const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      // stop ngay stream tạm
      tmp.getTracks().forEach((t) => t.stop());
      await enumerateVideoInputs();
      setIsCameraOn(true);
    } catch (err) {
      if (err?.name === 'NotAllowedError') {
        message.error('Bạn đã từ chối quyền camera. Hãy cấp quyền trong cài đặt trình duyệt và thử lại.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
        message.error('Không tìm thấy thiết bị camera phù hợp.');
      } else {
        message.error('Không thể mở camera: ' + (err?.message || 'Lỗi không xác định'));
      }
      setIsCameraOn(false);
    }
  };

  const toggleCamera = async () => {
    if (!videoInputs.length) return;
    // dừng stream hiện tại trước khi đổi
    hardStopCamera();
    const nextIdx = (currentIndex + 1) % videoInputs.length;
    setCurrentIndex(nextIdx);
    setDeviceId(videoInputs[nextIdx].deviceId);
    // bật lại khung ở tick tiếp theo
    setTimeout(() => setIsCameraOn(true), 0);
  };

  // ========= Capture / Submit =========
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
    revokePreview();
    const url = URL.createObjectURL(f);
    prevUrlRef.current = url;

    setFile(f);
    setPreviewUrl(url);
    setPhase('checkout');

    // tắt camera ngay sau khi chụp
    hardStopCamera();

    onCapture?.({ file: f, previewUrl: url });
  };

  const handleRetake = async () => {
    revokePreview();
    setFile(null);
    setPreviewUrl(null);
    setPhase('checkin');
    await openCamera(); // bật lại camera
    onRetake?.();
  };

  const handleSubmit = () => {
    if (!file) return;
    onSubmit?.({ file, previewUrl });
  };

  // Fallback chọn file (desktop/thiết bị không có camera)
  const fileInputRef = useRef(null);
  const openFilePicker = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    revokePreview();
    const url = URL.createObjectURL(f);
    prevUrlRef.current = url;
    setFile(f);
    setPreviewUrl(url);
    setPhase('checkout');
    hardStopCamera();
    onCapture?.({ file: f, previewUrl: url });
  };

  // constraints: iOS ưa dùng deviceId exact
  const videoConstraints = useMemo(() => {
    return deviceId
      ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
      : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } };
  }, [deviceId]);

  const webcamKey = deviceId || 'default';

  return (
    <Modal
      open={open}
      destroyOnClose // unmount nội dung khi đóng modal
      onCancel={() => {
        hardStopCamera(); // luôn tắt stream khi đóng
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
          {/* Khi camera ON */}
          {!previewUrl && isCameraOn && hasVideoInput && (
            <div className={cx('check-modal__webcam-wrap')}>
              <Webcam
                key={webcamKey}
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className={cx('check-modal__webcam')}
                mirrored={false}
                playsInline
                onUserMedia={() => {
                  // lưu stream thực tế để stop cứng khi cần
                  const videoEl = webcamRef.current?.video || webcamRef.current?.videoRef?.current;
                  const stream = videoEl?.srcObject || webcamRef.current?.stream;
                  if (stream) activeStreamRef.current = stream;
                }}
                onUserMediaError={(e) => {
                  message.error('Không thể truy cập camera: ' + (e?.message || 'Lỗi không xác định'));
                }}
              />
            </div>
          )}

          {/* Idle */}
          {!previewUrl && (!isCameraOn || !hasVideoInput) && (
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
            {phase !== 'checkout' ? (
              <>
                {hasVideoInput && (
                  <button
                    className={cx('check-modal__confirm-button')}
                    onClick={() => {
                      if (!isCameraOn)
                        openCamera(); // xin quyền + bật camera
                      else handleCapture(); // đang bật: chụp ảnh
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
                {isCameraOn && videoInputs.length > 1 && (
                  <button className={cx('check-modal__cancel-button')} onClick={toggleCamera}>
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
