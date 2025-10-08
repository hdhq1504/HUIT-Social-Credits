import React, { useEffect, useRef, useState } from 'react';
import { Modal, Tag } from 'antd';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faLocationDot, faCamera } from '@fortawesome/free-solid-svg-icons';
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
  const inputRef = useRef(null);
  const wasOpenRef = useRef(false);
  const prevUrlRef = useRef(null);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setPhase(variant || 'checkin');
      setPreviewUrl(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    }
    wasOpenRef.current = open;
  }, [open, variant]);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    };
  }, []);

  const isCheckoutPhase = phase === 'checkout';

  const handleOpenCamera = () => inputRef.current?.click();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    const url = URL.createObjectURL(f);
    prevUrlRef.current = url;

    setFile(f);
    setPreviewUrl(url);
    setPhase('checkout');
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
    if (inputRef.current) inputRef.current.value = '';
    onRetake?.();
  };

  const handleSubmit = () => {
    if (!file) return;
    onSubmit?.({ file, previewUrl });
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
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
          {!previewUrl ? (
            <div className={cx('check-modal__camera-box-empty')}>
              <div className={cx('check-modal__camera-box-icon')}>
                <FontAwesomeIcon icon={faCamera} />
              </div>
              <div className={cx('check-modal__camera-box-title')}>Camera sẵn sàng</div>
              <div className={cx('check-modal__camera-box-hint')}>Đảm bảo khuôn mặt hiển thị rõ trong khung hình</div>
            </div>
          ) : (
            <img className={cx('check-modal__camera-box-preview')} src={previewUrl} alt="preview" />
          )}

          {/* Nút hành động theo phase */}
          <div className={cx('check-modal__actions')}>
            {!isCheckoutPhase ? (
              <button className={cx('check-modal__confirm-button')} onClick={handleOpenCamera}>
                <FontAwesomeIcon icon={faCamera} style={{ marginRight: 8 }} />
                Chụp ảnh
              </button>
            ) : (
              <>
                <button className={cx('check-modal__cancel-button')} onClick={handleRetake}>
                  <FontAwesomeIcon icon={faCamera} style={{ marginRight: 8 }} />
                  Chụp lại
                </button>
                <button className={cx('check-modal__confirm-button')} onClick={handleSubmit}>
                  Gửi điểm danh
                </button>
              </>
            )}
          </div>

          {/* input file để mở camera (mobile) hoặc chọn ảnh (desktop) */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="user"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>
    </Modal>
  );
}

export default CheckModal;
