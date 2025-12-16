import React, { useState, useMemo } from 'react';
import classNames from 'classnames/bind';
import { Modal, Tag, Select, Input, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import Alert from '../Alert/Alert';
import styles from './RegisterModal.module.scss';

const { TextArea } = Input;
const cx = classNames.bind(styles);

/** Map style cho phương thức điểm danh */
const ATTENDANCE_METHOD_STYLES = {
  qr: { className: 'register-confirm__chip--qr', fallbackLabel: 'QR Code' },
  photo: { className: 'register-confirm__chip--photo', fallbackLabel: 'Chụp Ảnh' },
};

/**
 * Modal xác nhận đăng ký hoặc hủy đăng ký hoạt động CTXH.
 * Hiển thị thông tin hoạt động và cho phép người dùng xác nhận/hủy.
 *
 * @param {Object} props - Props của component.
 * @param {boolean} props.open - Trạng thái hiển thị modal.
 * @param {Function} props.onConfirm - Callback khi xác nhận (nhận { variant, reason, note }).
 * @param {Function} props.onCancel - Callback khi đóng modal.
 * @param {'confirm'|'cancel'} [props.variant='confirm'] - Loại modal (đăng ký hoặc hủy).
 * @param {string} props.campaignName - Tên hoạt động.
 * @param {string} [props.groupLabel] - Nhãn nhóm hoạt động.
 * @param {string} [props.pointsLabel] - Nhãn điểm.
 * @param {string} props.dateTime - Thời gian diễn ra.
 * @param {string} props.location - Địa điểm.
 * @param {string} [props.registrationDeadline] - Hạn đăng ký.
 * @param {string} [props.cancellationDeadline] - Hạn hủy đăng ký.
 * @param {string} [props.attendanceMethod] - Phương thức điểm danh (qr/photo).
 * @param {string} [props.attendanceMethodLabel] - Nhãn phương thức điểm danh.
 * @param {string[]} [props.reasons] - Danh sách lý do hủy mặc định.
 * @param {boolean} [props.showConflictAlert=false] - Hiển thị cảnh báo xung đột lịch.
 * @param {Date|string} [props.activityStartTime] - Thời gian bắt đầu hoạt động.
 * @param {boolean} [props.confirmLoading=false] - Trạng thái loading của nút xác nhận.
 * @returns {React.ReactElement} Component RegisterModal.
 */
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
  activityStartTime = null,
  confirmLoading = false,
}) {
  const isCancel = variant === 'cancel'; // Đang ở chế độ hủy đăng ký
  const modalTitle = isCancel ? 'Xác nhận hủy hoạt động' : 'Xác nhận đăng ký hoạt động';
  const [reason, setReason] = useState();
  const [note, setNote] = useState('');

  /**
   * Kiểm tra xem đang đăng ký muộn (sau khi hoạt động đã bắt đầu) hay không.
   */
  const isLateRegistration = useMemo(() => {
    if (isCancel || !activityStartTime) return false;
    const now = new Date();
    const startTime = new Date(activityStartTime);
    return now > startTime;
  }, [activityStartTime, isCancel]);

  // Normalize các deadline để hiển thị
  const normalizedRegistrationDeadline =
    registrationDeadline && registrationDeadline !== '--' ? registrationDeadline : null;
  const normalizedCancellationDeadline =
    cancellationDeadline && cancellationDeadline !== '--' ? cancellationDeadline : null;

  /**
   * Tạo chip hiển thị phương thức điểm danh.
   */
  const attendanceChip = (() => {
    if (!attendanceMethod && !attendanceMethodLabel) return null;
    const methodKey = attendanceMethod?.toLowerCase?.();
    const map = (methodKey && ATTENDANCE_METHOD_STYLES[methodKey]) || null;
    return {
      label: attendanceMethodLabel || map?.fallbackLabel || attendanceMethod || 'Đang cập nhật',
      className: map?.className || 'register-confirm__chip--default',
    };
  })();

  /**
   * Xử lý khi người dùng xác nhận đăng ký/hủy.
   */
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
                normalizedCancellationDeadline ? 'register-confirm__notice-danger' : 'register-confirm__notice-muted',
              )}
            >
              {normalizedCancellationDeadline || 'Đang cập nhật'}
            </span>
          </div>
          <div className={cx('register-confirm__notice-row')}>
            <span className={cx('register-confirm__notice-label')}>Check-in:</span>
            {attendanceChip ? (
              <span className={cx('register-confirm__chip', attendanceChip.className)}>{attendanceChip.label}</span>
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

        {isLateRegistration && (
          <Alert
            title="Không thể đăng ký"
            message="Không thể đăng ký hoạt động sau khi đã bắt đầu."
            type="danger"
            showIcon={true}
            onClose={() => {}}
          />
        )}

        {showConflictAlert && !isLateRegistration && (
          <Alert
            title="Xung đột lịch trình"
            message="Hoạt động này trùng thời gian với hoạt động khác bạn đã đăng ký."
            type="warning"
            showIcon={true}
            onClose={() => {}}
          />
        )}
      </div>

      <div className={cx('register-confirm__footer')}>
        <Button
          className={cx('register-confirm__confirm-button', isCancel && 'register-confirm__confirm-button--danger')}
          onClick={handleConfirm}
          disabled={(isCancel && !reason) || isLateRegistration}
          loading={confirmLoading}
          type="primary"
        >
          {isCancel ? 'Xác nhận hủy' : 'Xác nhận đăng ký'}
        </Button>
        <Button className={cx('register-confirm__cancel-button')} onClick={onCancel}>
          Hủy bỏ
        </Button>
      </div>
    </Modal>
  );
}

export default RegisterModal;
