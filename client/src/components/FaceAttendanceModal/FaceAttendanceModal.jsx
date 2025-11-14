import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Alert, Tag, Spin, message } from 'antd';
import classNames from 'classnames/bind';
import Webcam from 'react-webcam';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faRotate, faImage, faCalendar, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { computeDescriptorFromDataUrl, ensureModelsLoaded } from '@/services/faceApiService';
import { fileToDataUrl } from '@utils/file';
import styles from './FaceAttendanceModal.module.scss';

const cx = classNames.bind(styles);

const PHASE_LABELS = {
  checkin: 'Điểm danh đầu giờ',
  checkout: 'Điểm danh cuối giờ',
};

const FACE_ERROR_MESSAGES = {
  NO_FACE_DETECTED: 'Không phát hiện khuôn mặt rõ ràng trong ảnh. Vui lòng thử lại.',
  ANALYSIS_FAILED: 'Không thể phân tích khuôn mặt. Bạn có thể thử lại hoặc gửi ảnh để ban tổ chức duyệt thủ công.',
};

const normalizeDescriptor = (descriptor) => {
  if (!descriptor) return null;
  if (Array.isArray(descriptor)) return descriptor;
  if (typeof descriptor === 'object' && typeof descriptor.length === 'number') {
    try {
      return Array.from(descriptor);
    } catch {
      return null;
    }
  }
  return null;
};

const createFileFromDataUrl = (dataUrl, fileName) => {
  const arr = dataUrl.split(',');
  if (arr.length < 2) return null;
  const mime = arr[0].match(/:(.*?);/i)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  const len = bstr.length;
  const u8arr = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  try {
    return new File([u8arr], fileName, { type: mime });
  } catch (error) {
    console.error('Không thể tạo file từ dữ liệu ảnh điểm danh', error);
    return null;
  }
};

function FaceAttendanceModal({
  open,
  onCancel,
  onSubmit,
  confirmLoading = false,
  campaignName,
  groupLabel,
  pointsLabel,
  dateTime,
  location,
  phase = 'checkin',
  attendanceMethod,
  attendanceMethodLabel,
}) {
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [captureError, setCaptureError] = useState(null);
  const [sample, setSample] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (open) {
      setSample(null);
      setFilePreview(null);
      setCaptureError(null);
      setModelError(null);
      setModelsReady(false);
      setIsModelsLoading(true);
      ensureModelsLoaded()
        .then(() => {
          if (!cancelled) {
            setModelsReady(true);
          }
        })
        .catch((error) => {
          console.error('Không thể tải mô hình nhận diện khuôn mặt', error);
          if (!cancelled) {
            setModelsReady(false);
            setModelError('Không thể tải mô hình nhận diện khuôn mặt. Kiểm tra kết nối mạng và thử lại.');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsModelsLoading(false);
          }
        });
    } else {
      setSample(null);
      setFilePreview(null);
      setCaptureError(null);
      setModelError(null);
      setModelsReady(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    return () => {
      cancelled = true;
    };
  }, [open]);

  const phaseLabel = PHASE_LABELS[phase] || PHASE_LABELS.checkin;

  const disableConfirm = useMemo(
    () =>
      confirmLoading ||
      isAnalyzing ||
      isModelsLoading ||
      !sample ||
      (attendanceMethod === 'photo' && !modelsReady && !sample?.faceError),
    [
      attendanceMethod,
      confirmLoading,
      isAnalyzing,
      isModelsLoading,
      modelsReady,
      sample,
    ],
  );

  const analyzeDescriptor = async (dataUrl, origin) => {
    console.debug('[FaceAttendanceModal] Bắt đầu phân tích khuôn mặt cho ảnh điểm danh', {
      hasDataUrl: Boolean(dataUrl),
      origin,
    });
    let descriptor = null;
    let errorCode = null;
    try {
      const result = await computeDescriptorFromDataUrl(dataUrl);
      if (result && result.length) {
        descriptor = normalizeDescriptor(result);
        console.debug('[FaceAttendanceModal] Phân tích khuôn mặt thành công', {
          origin,
          descriptorLength: descriptor?.length ?? 0,
        });
      } else {
        errorCode = 'NO_FACE_DETECTED';
        console.debug('[FaceAttendanceModal] Không phát hiện khuôn mặt', { origin });
      }
    } catch (error) {
      console.error('Không thể phân tích khuôn mặt khi điểm danh', error);
      errorCode = 'ANALYSIS_FAILED';
    }
    return { descriptor, errorCode };
  };

  const buildSample = async ({ dataUrl, file, origin }) => {
    setIsAnalyzing(true);
    setCaptureError(null);

    const fileToUse = file ?? createFileFromDataUrl(dataUrl, `attendance_${Date.now()}.jpg`);
    if (!fileToUse) {
      setIsAnalyzing(false);
      setCaptureError('Không thể xử lý ảnh điểm danh. Vui lòng thử lại.');
      return;
    }

    let descriptor = null;
    let errorCode = null;

    if (attendanceMethod === 'photo') {
      ({ descriptor, errorCode } = await analyzeDescriptor(dataUrl, origin));
    }

    setSample({
      id: Date.now(),
      dataUrl,
      file: fileToUse,
      origin,
      faceDescriptor: descriptor,
      faceError: errorCode,
    });
    console.debug('[FaceAttendanceModal] Hoàn tất chuẩn bị ảnh điểm danh', {
      origin,
      hasDescriptor: Boolean(descriptor),
      descriptorLength: descriptor?.length ?? 0,
      faceError: errorCode,
    });
    setFilePreview(dataUrl);

    if (errorCode && FACE_ERROR_MESSAGES[errorCode]) {
      setCaptureError(FACE_ERROR_MESSAGES[errorCode]);
      message.warning(FACE_ERROR_MESSAGES[errorCode]);
    } else {
      setCaptureError(null);
    }

    setIsAnalyzing(false);
  };

  const handleCapture = async () => {
    if (isAnalyzing || isModelsLoading) return;
    if (!modelsReady && attendanceMethod === 'photo') {
      setCaptureError('Mô hình nhận diện đang tải. Vui lòng thử lại sau giây lát.');
      return;
    }
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) {
      message.error('Không thể chụp ảnh. Hãy kiểm tra camera và thử lại.');
      return;
    }
    await buildSample({ dataUrl: screenshot, file: null, origin: 'camera' });
  };

  const handleSelectFile = async (event) => {
    const [file] = Array.from(event.target.files || []);
    if (!file || isAnalyzing) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      await buildSample({ dataUrl, file, origin: 'upload' });
    } catch (error) {
      console.error('Không thể đọc ảnh điểm danh đã chọn', error);
      setCaptureError('Không thể đọc ảnh được chọn. Vui lòng thử lại với ảnh khác.');
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRetake = () => {
    setSample(null);
    setFilePreview(null);
    setCaptureError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!sample) {
      setCaptureError('Vui lòng chụp hoặc tải lên ảnh điểm danh trước khi gửi.');
      return;
    }

    try {
      await onSubmit?.({
        file: sample.file,
        dataUrl: sample.dataUrl,
        faceDescriptor: sample.faceDescriptor,
        faceError: sample.faceError,
        phase,
      });
      console.debug('[FaceAttendanceModal] Đã gửi ảnh điểm danh', {
        origin: sample.origin,
        hasDescriptor: Boolean(sample.faceDescriptor),
        descriptorLength: sample.faceDescriptor?.length ?? 0,
        faceError: sample.faceError,
      });
    } catch (error) {
      const messageText = error?.message || 'Không thể gửi điểm danh. Vui lòng thử lại.';
      setCaptureError(messageText);
    }
  };

  const handleClose = () => {
    if (!confirmLoading && !isAnalyzing) {
      onCancel?.();
    }
  };

  return (
    <Modal
      open={open}
      title={phaseLabel}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="Gửi điểm danh"
      cancelText="Đóng"
      okButtonProps={{ disabled: disableConfirm, loading: confirmLoading }}
      cancelButtonProps={{ disabled: confirmLoading || isAnalyzing }}
      destroyOnClose
      centered
      className={cx('face-attendance-modal')}
      maskClosable={!(confirmLoading || isAnalyzing)}
    >
      <div className={cx('face-attendance-modal__body')}>
        <Alert
          type="info"
          message={
            attendanceMethod === 'photo'
              ? 'Chụp hoặc tải lên ảnh khuôn mặt rõ ràng để hệ thống xác nhận điểm danh.'
              : 'Chụp hoặc tải ảnh để gửi bằng chứng tham gia hoạt động.'
          }
          showIcon
        />

        {modelError && (
          <Alert type="warning" message={modelError} showIcon className={cx('face-attendance-modal__alert')} />
        )}

        <div className={cx('face-attendance-modal__meta')}>
          {campaignName && <h3 className={cx('face-attendance-modal__title')}>{campaignName}</h3>}
          <div className={cx('face-attendance-modal__tags')}>
            {groupLabel && (
              <Tag color="red" bordered={false} className={cx('face-attendance-modal__tag')}>
                {groupLabel}
              </Tag>
            )}
            {pointsLabel && (
              <Tag color="blue" bordered={false} className={cx('face-attendance-modal__tag')}>
                {pointsLabel}
              </Tag>
            )}
            {attendanceMethodLabel && (
              <Tag color="geekblue" bordered={false} className={cx('face-attendance-modal__tag')}>
                {attendanceMethodLabel}
              </Tag>
            )}
          </div>

          <div className={cx('face-attendance-modal__info')}>
            {dateTime && (
              <div className={cx('face-attendance-modal__info-row')}>
                <FontAwesomeIcon icon={faCalendar} />
                <span>{dateTime}</span>
              </div>
            )}
            {location && (
              <div className={cx('face-attendance-modal__info-row')}>
                <FontAwesomeIcon icon={faLocationDot} />
                <span>{location}</span>
              </div>
            )}
          </div>
        </div>

        <div className={cx('face-attendance-modal__capture')}>
          <div className={cx('face-attendance-modal__preview')}>
            {filePreview ? (
              <img src={filePreview} alt="Ảnh điểm danh" />
            ) : (
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored
                screenshotFormat="image/jpeg"
                imageSmoothing
                className={cx('face-attendance-modal__webcam')}
                videoConstraints={{ facingMode: 'user' }}
              />
            )}
            {(isModelsLoading || isAnalyzing) && (
              <div className={cx('face-attendance-modal__overlay')}>
                <Spin tip={isModelsLoading ? 'Đang tải mô hình...' : 'Đang xử lý ảnh...'} />
              </div>
            )}
          </div>

          <div className={cx('face-attendance-modal__actions')}>
            <button
              type="button"
              className={cx('face-attendance-modal__button')}
              onClick={filePreview ? handleRetake : handleCapture}
              disabled={isModelsLoading || isAnalyzing}
            >
              <FontAwesomeIcon icon={filePreview ? faRotate : faCamera} />
              <span>{filePreview ? 'Chụp lại' : 'Chụp ảnh'}</span>
            </button>
            <button
              type="button"
              className={cx('face-attendance-modal__button', 'is-secondary')}
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
            >
              <FontAwesomeIcon icon={faImage} />
              <span>Chọn ảnh</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={cx('face-attendance-modal__file-input')}
              onChange={handleSelectFile}
            />
          </div>
        </div>

        {captureError && (
          <Alert
            type="warning"
            message={captureError}
            showIcon
            className={cx('face-attendance-modal__alert')}
          />
        )}
      </div>
    </Modal>
  );
}

export default FaceAttendanceModal;
