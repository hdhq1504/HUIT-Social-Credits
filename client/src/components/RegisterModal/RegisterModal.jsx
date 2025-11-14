import React, { useState } from 'react';
import classNames from 'classnames/bind';
import { Modal, Tag, Select, Input } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import Alert from '../Alert/Alert';
import styles from './RegisterModal.module.scss';

const { TextArea } = Input;
const cx = classNames.bind(styles);

const ATTENDANCE_METHOD_STYLES = {
  qr: { className: 'register-confirm__chip--qr', fallbackLabel: 'QR Code' },
  photo: { className: 'register-confirm__chip--photo', fallbackLabel: 'Chụp Ảnh' },
};

function RegisterModal({
  open,
  onConfirm,
  onCancel,
  variant = 'confirm',
  campaignName,
  groupLabel,
  pointsLabel,
  dateTime,
  location,
  registrationDeadline,
  cancellationDeadline,
  attendanceMethod,
  attendanceMethodLabel,
  reasons = ['Bận lịch đột xuất', 'Trùng lịch thi/học', 'Lý do sức khỏe', 'Khác'],
  showConflictAlert = false,
  confirmLoading = false,
}) {
  const isCancel = variant === 'cancel';
  const modalTitle = isCancel ? 'Xác nhận hủy hoạt động' : 'Xác nhận đăng ký hoạt động';
  const [reason, setReason] = useState();
  const [note, setNote] = useState('');

  const normalizedRegistrationDeadline =
    registrationDeadline && registrationDeadline !== '--' ? registrationDeadline : null;
  const normalizedCancellationDeadline =
    cancellationDeadline && cancellationDeadline !== '--' ? cancellationDeadline : null;

  const attendanceChip = (() => {
    if (!attendanceMethod && !attendanceMethodLabel) return null;
    const methodKey = attendanceMethod?.toLowerCase?.();
    const map = (methodKey && ATTENDANCE_METHOD_STYLES[methodKey]) || null;
    return {
      label: attendanceMethodLabel || map?.fallbackLabel || attendanceMethod || 'Đang cập nhật',
      className: map?.className || 'register-confirm__chip--default',
    };
  })();

  const handleConfirm = () => {
    onConfirm?.({ variant, reason, note });
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      className={cx('register-confirm', isCancel && 'register-confirm--cancel')}
      title={
        <div className={cx('register-confirm__header')}>
          <h3 className={cx('register-confirm__title')}>{modalTitle}</h3>
        </div>
      }
    >
      <div className={cx('register-confirm__body')}>
        <div className={cx('register-confirm__campaign')}>
          <h4 className={cx('register-confirm__campaign-title')}>{campaignName}</h4>
        </div>

        <div className={cx('register-confirm__meta')}>
          {groupLabel && <Tag className={cx('register-confirm__tag', 'register-confirm__tag-group')}>{groupLabel}</Tag>}
          {pointsLabel && (
            <Tag className={cx('register-confirm__tag', 'register-confirm__tag-points')}>{pointsLabel}</Tag>
          )}
        </div>

        <div className={cx('register-confirm__info')}>
          <div className={cx('register-confirm__info-row')}>
            <FontAwesomeIcon className={cx('register-confirm__info-icon')} icon={faCalendar} />
            <span className={cx('register-confirm__info-text')}>{dateTime}</span>
          </div>
          <div className={cx('register-confirm__info-row')}>
            <FontAwesomeIcon className={cx('register-confirm__info-icon')} icon={faLocationDot} />
            <span className={cx('register-confirm__info-text')}>{location}</span>
          </div>
        </div>

        <div className={cx('register-confirm__notice')}>
          <div className={cx('register-confirm__notice-row')}>
            <span className={cx('register-confirm__notice-label')}>Hạn đăng ký:</span>
            <span
              className={cx(
                'register-confirm__notice-value',
                !normalizedRegistrationDeadline && 'register-confirm__notice-muted',
              )}
            >
              {normalizedRegistrationDeadline || 'Đang cập nhật'}
            </span>
          </div>
          <div className={cx('register-confirm__notice-row')}>
            <span className={cx('register-confirm__notice-label')}>Hạn hủy:</span>
            <span
              className={cx(
                'register-confirm__notice-value',
                normalizedCancellationDeadline
                  ? 'register-confirm__notice-danger'
                  : 'register-confirm__notice-muted',
              )}
            >
              {normalizedCancellationDeadline || 'Đang cập nhật'}
            </span>
          </div>
          <div className={cx('register-confirm__notice-row')}>
            <span className={cx('register-confirm__notice-label')}>Check-in:</span>
            {attendanceChip ? (
              <span className={cx('register-confirm__chip', attendanceChip.className)}>
                {attendanceChip.label}
              </span>
            ) : (
              <span className={cx('register-confirm__notice-muted')}>Đang cập nhật</span>
            )}
          </div>
        </div>

        {isCancel && (
          <div className={cx('register-confirm__cancel-form')}>
            <div className={cx('register-confirm__form-group')}>
              <label className={cx('register-confirm__label')}>Chọn lý do hủy đăng ký</label>
              <Select
                placeholder="-- Chọn lý do --"
                className={cx('register-confirm__select')}
                options={reasons.map((r) => ({ label: r, value: r }))}
                onChange={setReason}
                value={reason}
                allowClear
              />
            </div>

            <div className={cx('register-confirm__form-group')}>
              <label className={cx('register-confirm__label')}>Ghi chú thêm (tùy chọn)</label>
              <TextArea
                className={cx('register-confirm__textarea')}
                placeholder="Nhập ghi chú thêm nếu có..."
                autoSize={{ minRows: 3, maxRows: 4 }}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        )}

        {showConflictAlert && (
          <Alert
            title="Xung đột lịch trình"
            message="Hoạt động này trùng thời gian với hoạt động khác bạn đã đăng ký"
            type="warning"
            showIcon={true}
            onClose={() => {}}
          />
        )}
      </div>

      <div className={cx('register-confirm__footer')}>
        <button
          className={cx('register-confirm__confirm-button', isCancel && 'register-confirm__confirm-button--danger')}
          onClick={handleConfirm}
          disabled={confirmLoading || (isCancel && !reason)}
        >
          {confirmLoading ? 'Đang xử lý...' : isCancel ? 'Xác nhận hủy' : 'Xác nhận đăng ký'}
        </button>
        <button className={cx('register-confirm__cancel-button')} onClick={onCancel}>
          Hủy bỏ
        </button>
      </div>
    </Modal>
  );
}

export default RegisterModal;
