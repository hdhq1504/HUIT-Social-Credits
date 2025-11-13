import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Modal, Tag, message, Spin } from 'antd';
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
  confirmLoading = false,
  analysisLoading = false,
  analysisResult = null,
}) {
  // Local state for preview / file / dataUrl
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [dataUrl, setDataUrl] = useState(null);
  const [captureStage, setCaptureStage] = useState(variant);
  const wasOpenRef = useRef(false);
  const prevUrlRef = useRef(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  // Camera state
  const webcamRef = useRef(null);
  const activeStreamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  // Danh sách camera & camera đang chọn
  const [videoInputs, setVideoInputs] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasVideoInput, setHasVideoInput] = useState(true);

  // ========= Helpers =========
  const revokePreview = () => {
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    prevUrlRef.current = null;
  };

  // Dừng tất cả tracks và set lại trạng thái camera
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
          } catch (stopError) {
            console.warn('Không thể dừng track camera:', stopError);
          }
        });
      }
    } catch (cameraError) {
      console.warn('Không thể tắt camera:', cameraError);
    }
    activeStreamRef.current = null;
    setIsCameraOn(false);
  };

  // ========= Effects =========
  useEffect(() => {
    // Khi mở modal lần đầu: reset các trạng thái liên quan đến capture
    if (open && !wasOpenRef.current) {
      setCaptureStage(variant || 'checkin');
      setPreviewUrl(null);
      setFile(null);
      setDataUrl(null);
      setIsCameraOn(false);
      setDeviceId(null);
      setCurrentIndex(0);
      setIsReadingFile(false);
    }

    // Khi đóng modal: dọn dẹp camera + revoke object URL
    if (!open && wasOpenRef.current) {
      hardStopCamera();
      revokePreview();
      setDataUrl(null);
      setIsReadingFile(false);
    }
    wasOpenRef.current = open;
  }, [open, variant]);

  useEffect(() => {
    return () => {
      // Unmount: chắc chắn dừng camera và dọn URL
      hardStopCamera();
      revokePreview();
      setDataUrl(null);
      setIsReadingFile(false);
    };
  }, []);

  // Lấy danh sách thiết bị video (nếu có)
  const enumerateVideoInputs = async () => {
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices?.();
      const vids = (devices || []).filter((d) => d.kind === 'videoinput');
      setVideoInputs(vids);
      setHasVideoInput(vids.length > 0);

      if (vids.length) {
        // ưu tiên camera sau (back) nếu có
        const backIdx = vids.findIndex((d) => /back|rear|environment/i.test(d.label));
        const idx = backIdx >= 0 ? backIdx : 0;
        setCurrentIndex(idx);
        setDeviceId(vids[idx].deviceId);
      } else {
        setDeviceId(null);
      }
    } catch (error) {
      console.warn('Không thể lấy danh sách thiết bị video:', error);
      setHasVideoInput(false);
    }
  };
  const openCamera = async () => {
    try {
      // Thử getUserMedia để xin quyền, nhưng stop ngay để chỉ enumerate devices
      const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      tmp.getTracks().forEach((t) => t.stop());
      await enumerateVideoInputs();
      setIsCameraOn(true);
    } catch (err) {
      // Xử lý lỗi phổ biến: user từ chối quyền, không có camera
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

  // Chuyển camera (nếu có nhiều hơn 1)
  const toggleCamera = async () => {
    if (!videoInputs.length) return;
    hardStopCamera();
    const nextIdx = (currentIndex + 1) % videoInputs.length;
    setCurrentIndex(nextIdx);
    setDeviceId(videoInputs[nextIdx].deviceId);
    // setIsCameraOn true sau khi deviceId cập nhật => Webcam sẽ mount lại
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
    setDataUrl(dataUrl);
    setCaptureStage('checkout');
    setIsReadingFile(false);

    // Dừng camera để giảm resource usage (người dùng đã chụp)
    hardStopCamera();

    // Báo parent rằng đã có capture (nếu cần)
    onCapture?.({ file: f, previewUrl: url, dataUrl });
  };

  const handleRetake = async () => {
    // Xóa preview cũ, mở camera lại
    revokePreview();
    setFile(null);
    setPreviewUrl(null);
    setDataUrl(dataUrl);
    setCaptureStage('checkin');
    setIsReadingFile(false);
    await openCamera();
    onRetake?.();
  };

  const handleSubmit = () => {
    // Nếu đang confirmLoading hoặc chưa có file thì ignore
    if (confirmLoading || !file) return;
    if (!dataUrl) {
      message.warning('Hình ảnh đang được xử lý, vui lòng chờ trong giây lát.');
      return;
    }
    onSubmit?.({ file, previewUrl, dataUrl });
  };

  // File picker fallback: user có thể upload file từ máy
  const fileInputRef = useRef(null);
  const openFilePicker = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setIsReadingFile(true);
    revokePreview();
    const url = URL.createObjectURL(f);
    prevUrlRef.current = url;
    setFile(f);
    setPreviewUrl(url);
    setDataUrl(null);
    setCaptureStage('checkin');
    hardStopCamera();
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) {
        message.error('Không thể đọc file. Vui lòng thử lại với ảnh khác.');
        setIsReadingFile(false);
        return;
      }
      setDataUrl(result);
      setCaptureStage('checkout');
      setIsReadingFile(false);
      onCapture?.({ file: f, previewUrl: url, dataUrl: result });
    };
    reader.onerror = () => {
      message.error('Không thể đọc file. Vui lòng thử lại với ảnh khác.');
      setIsReadingFile(false);
    };
    reader.readAsDataURL(f);
    if (e.target) {
      e.target.value = '';
    }
  };

  // Set constraints video dựa vào deviceId
  const videoConstraints = useMemo(() => {
    return deviceId
      ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
      : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } };
  }, [deviceId]);

  const webcamKey = deviceId || 'default';

  const hasPreview = Boolean(previewUrl);
  const canShowCamera = !hasPreview && isCameraOn && hasVideoInput;
  const shouldShowPlaceholder = !hasPreview && (!isCameraOn || !hasVideoInput);

  return (
    <Modal
      open={open}
      destroyOnHidden
      onCancel={() => {
        hardStopCamera();
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

        {/* Camera / preview area */}
        <div className={cx('check-modal__camera-box')}>
          <div className={cx('check-modal__camera-frame', hasPreview && 'has-preview')}>
            {canShowCamera && (
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

            {shouldShowPlaceholder && (
              <div className={cx('check-modal__camera-empty')}>
                <div className={cx('check-modal__camera-icon')}>
                  <FontAwesomeIcon icon={faCamera} />
                </div>
                <div className={cx('check-modal__camera-title')}>Camera sẵn sàng</div>
                <div className={cx('check-modal__camera-hint')}>Đảm bảo bạn hiển thị rõ trong khung hình</div>
              </div>
            )}

            {hasPreview && (
              <img className={cx('check-modal__camera-preview')} src={previewUrl} alt="preview" />
            )}
          </div>

          {(analysisLoading || analysisResult) && (
            <div
              className={cx(
                'check-modal__analysis',
                analysisResult?.tone ? `is-${analysisResult.tone}` : null,
                analysisResult?.status === 'approved' && 'is-approved',
              )}
            >
              {analysisLoading ? (
                <>
                  <Spin size="small" />
                  <span>Đang đối chiếu ảnh với hồ sơ khuôn mặt…</span>
                </>
              ) : (
                <>
                  {typeof analysisResult?.score === 'number' && Number.isFinite(analysisResult.score) && (
                    <span className={cx('check-modal__analysis-score')}>
                      Sai khác: {analysisResult.score.toFixed(3)}
                    </span>
                  )}
                  <span>{analysisResult?.message}</span>
                </>
              )}
            </div>
          )}

          {/* Actions (chụp / đổi camera / upload / gửi) */}
          <div className={cx('check-modal__actions')}>
            {captureStage !== 'checkout' ? (
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
                <button
                  className={cx('check-modal__confirm-button')}
                  onClick={handleSubmit}
                  disabled={
                    isReadingFile ||
                    !file ||
                    !dataUrl ||
                    confirmLoading ||
                    analysisLoading ||
                    analysisResult?.blockSubmission
                  }
                >
                  <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: 8 }} />
                  {confirmLoading ? 'Đang gửi...' : 'Gửi điểm danh'}
                </button>
              </>
            )}
          </div>
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
    </Modal>
  );
}

export default CheckModal;
