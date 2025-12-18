import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Modal, Tag, message } from 'antd';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faLocationDot, faCamera, faRotate, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import Webcam from 'react-webcam';
import { computeDescriptorFromDataUrl } from '@/services/faceApiService';
import styles from './AttendanceModal.module.scss';

const cx = classNames.bind(styles);

/**
 * Modal điểm danh hoạt động CTXH bằng camera/upload ảnh.
 * Hỗ trợ chụp ảnh qua webcam, chọn ảnh từ máy và gửi kèm face descriptor.
 *
 * @param {Object} props - Props của component.
 * @param {boolean} props.open - Trạng thái hiển thị modal.
 * @param {Function} props.onCancel - Callback khi đóng modal.
 * @param {Function} props.onSubmit - Callback khi gửi điểm danh (nhận { file, previewUrl, dataUrl, faceDescriptor }).
 * @param {Function} [props.onCapture] - Callback khi chụp/chọn ảnh thành công.
 * @param {Function} [props.onRetake] - Callback khi chụp lại ảnh.
 * @param {'checkin'|'checkout'} [props.variant='checkin'] - Loại điểm danh.
 * @param {string} props.campaignName - Tên hoạt động.
 * @param {string} [props.groupLabel] - Nhãn nhóm hoạt động.
 * @param {string} [props.pointsLabel] - Nhãn điểm.
 * @param {string} props.dateTime - Thời gian diễn ra.
 * @param {string} props.location - Địa điểm.
 * @param {boolean} [props.confirmLoading=false] - Trạng thái loading khi gửi.
 * @returns {React.ReactElement} Component AttendanceModal.
 */
function AttendanceModal({
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
}) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [dataUrl, setDataUrl] = useState(null);
  const [captureStage, setCaptureStage] = useState(variant);
  const wasOpenRef = useRef(false);
  const prevUrlRef = useRef(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const webcamRef = useRef(null);
  const activeStreamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const [videoInputs, setVideoInputs] = useState([]);
  const [deviceId, setDeviceId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasVideoInput, setHasVideoInput] = useState(true);

  /**
   * Thu hồi object URL cũ để tránh memory leak.
   */
  const revokePreview = () => {
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    prevUrlRef.current = null;
  };

  /**
   * Tắt hoàn toàn camera bằng cách dừng tất cả media tracks.
   * Xử lý nhiều cách lấy stream khác nhau để đảm bảo tắt được.
   */
  const hardStopCamera = () => {
    try {
      // Thử lấy video element từ nhiều nguồn
      const videoEl =
        webcamRef.current?.video ||
        webcamRef.current?.videoRef?.current ||
        document.querySelector('.check-modal video');

      // Lấy stream từ nhiều nguồn có thể
      const stream = videoEl?.srcObject || webcamRef.current?.stream || activeStreamRef.current;

      // Dừng tất cả tracks
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

  useEffect(() => {
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
      hardStopCamera();
      revokePreview();
      setDataUrl(null);
      setIsReadingFile(false);
    };
  }, []);

  /**
   * Liệt kê các thiết bị video có sẵn.
   * Ưu tiên chọn camera sau (back/rear) nếu có.
   */
  const enumerateVideoInputs = async () => {
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices?.();
      const vids = (devices || []).filter((d) => d.kind === 'videoinput');
      setVideoInputs(vids);
      setHasVideoInput(vids.length > 0);

      if (vids.length) {
        // Tìm camera sau (back/rear), nếu không có thì dùng camera đầu tiên
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
  /**
   * Mở camera với xin quyền truy cập.
   * Xử lý nhiều loại lỗi: quyền bị từ chối, không tìm thấy camera, v.v.
   */
  const openCamera = async () => {
    try {
      // Xin quyền trước và dừng ngay stream tạm
      const tmp = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      tmp.getTracks().forEach((t) => t.stop());
      await enumerateVideoInputs();
      setIsCameraOn(true);
    } catch (err) {
      // Xử lý các loại lỗi camera
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

  /**
   * Chuyển đổi giữa camera trước/sau.
   * Tắt camera hiện tại, chọn camera tiếp theo và bật lại.
   */
  const toggleCamera = async () => {
    if (!videoInputs.length) return;
    hardStopCamera();
    const nextIdx = (currentIndex + 1) % videoInputs.length;
    setCurrentIndex(nextIdx);
    setDeviceId(videoInputs[nextIdx].deviceId);
    setTimeout(() => setIsCameraOn(true), 0); // Delay nhỏ để đảm bảo re-render
  };

  /**
   * Chuyển đổi dataURL sang File object.
   * @param {string} dataUrl - Data URL của ảnh.
   * @param {string} fileName - Tên file.
   * @returns {File} File object.
   */
  const dataURLtoFile = (dataUrl, fileName) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], fileName, { type: mime });
  };

  /**
   * Chụp ảnh từ webcam.
   * Lấy screenshot từ webcam, chuyển sang File, lưu vào state và tắt camera.
   */
  const handleCapture = () => {
    if (!webcamRef.current) return;
    const dataUrl = webcamRef.current.getScreenshot();
    if (!dataUrl) {
      message.error('Không thể chụp ảnh. Hãy thử lại hoặc kiểm tra quyền camera.');
      return;
    }
    // Chuyển dataUrl sang File object
    const f = dataURLtoFile(dataUrl, `attendance_${Date.now()}.jpg`);
    revokePreview();
    const url = URL.createObjectURL(f);
    prevUrlRef.current = url;

    // Lưu vào state
    setFile(f);
    setPreviewUrl(url);
    setDataUrl(dataUrl);
    setCaptureStage('checkout');
    setIsReadingFile(false);

    // Tắt camera sau khi chụp
    hardStopCamera();

    onCapture?.({ file: f, previewUrl: url, dataUrl });
  };

  /**
   * Chụp lại ảnh - reset state và mở lại camera.
   */
  const handleRetake = async () => {
    revokePreview();
    setFile(null);
    setPreviewUrl(null);
    setDataUrl(dataUrl);
    setCaptureStage('checkin');
    setIsReadingFile(false);
    await openCamera();
    onRetake?.();
  };

  /**
   * Gửi ảnh điểm danh lên server.
   * Phân tích khuôn mặt trước khi gửi để đảm bảo ảnh hợp lệ.
   */
  const handleSubmit = async () => {
    if (confirmLoading || !file) return;
    if (!dataUrl) {
      message.warning('Hình ảnh đang được xử lý, vui lòng chờ trong giây lát.');
      return;
    }

    try {
      // Phân tích khuôn mặt để lấy face descriptor
      const descriptor = await computeDescriptorFromDataUrl(dataUrl);
      let faceError = null;

      if (!descriptor || !descriptor.length) {
        console.debug('[AttendanceModal] Không phát hiện khuôn mặt, sẽ gửi với faceError để chờ duyệt.');
        faceError = 'NO_FACE_DETECTED';
      }

      // Gọi callback với dữ liệu đầy đủ
      onSubmit?.({
        file,
        previewUrl,
        dataUrl,
        faceDescriptor: descriptor,
        faceError,
      });
    } catch (error) {
      console.error('Không thể trích xuất descriptor khuôn mặt trong điểm danh', error);
      onSubmit?.({
        file,
        previewUrl,
        dataUrl,
        faceDescriptor: null,
        faceError: 'ANALYSIS_FAILED',
      });
    }
  };

  const fileInputRef = useRef(null);

  // Mở dialog chọn file từ máy
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

  const videoConstraints = useMemo(() => {
    return deviceId
      ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
      : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } };
  }, [deviceId]);

  const webcamKey = deviceId || 'default';

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

        <div className={cx('check-modal__camera-box', !previewUrl && 'camera-box--idle')}>
          {!previewUrl && isCameraOn && hasVideoInput && (
            <div className={cx('check-modal__webcam-wrap')}>
              <Webcam
                key={webcamKey}
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className={cx('check-modal__webcam')}
                mirrored
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

          {/* Idle state (chưa mở camera) */}
          {!previewUrl && (!isCameraOn || !hasVideoInput) && (
            <div className={cx('check-modal__camera-box-empty')}>
              <div className={cx('check-modal__camera-box-icon')}>
                <FontAwesomeIcon icon={faCamera} />
              </div>
              <div className={cx('check-modal__camera-box-title')}>Camera sẵn sàng</div>
              <div className={cx('check-modal__camera-box-hint')}>Đảm bảo bạn hiển thị rõ trong khung hình</div>
            </div>
          )}

          {/* Preview image */}
          {previewUrl && <img className={cx('check-modal__camera-box-preview')} src={previewUrl} alt="preview" />}

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
                  disabled={isReadingFile || !file || !dataUrl || confirmLoading}
                >
                  <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: 8 }} />
                  {confirmLoading ? 'Đang gửi...' : 'Gửi điểm danh'}
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

export default AttendanceModal;
