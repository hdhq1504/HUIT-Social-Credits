import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import routes from '../../config/routes';
import { Avatar, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faCalendar, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import Button from '../Button/Button';
import RegisterModal from '../RegisterModal/RegisterModal';
import CheckModal from '../CheckModal/CheckModal';
import FeedbackModal from '../FeedbackModal/FeedbackModal';
import useToast from '../Toast/Toast';
import { fileToDataUrl } from '@utils/file';
import styles from './CardActivity.module.scss';

const cx = classNames.bind(styles);

const initials = (name = '') =>
  (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join('') || 'U'
  ).toUpperCase();

function CardActivity(props) {
  const {
    id,
    title,
    points,
    dateTime,
    location,
    participants = [],
    capacity,
    coverImage,
    isFeatured = false,
    badgeText = 'Nổi bật',
    variant = 'vertical',
    className,
    state = 'guest',
    actions,
    statusPill,
    onDetails,
    onRegister,
    onRegistered,
    onStateChange,
    disableRegister = false,
    buttonLabels = {},
    registerModalProps = {},
    autoSwitchStateOnRegister = true,
    successMessage = 'Đăng ký hoạt động thành công!',
    errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.',
    cancelSuccessMessage = 'Hủy đăng ký thành công!',
    cancelErrorMessage = 'Hủy đăng ký thất bại. Vui lòng thử lại.',
    onCancelRegister,
    onCheckin,
    onComplete,
    onConfirmPresent,
    onSendFeedback,
    modalGroupLabel: modalGroupLabelProp,
    pointGroup,
    pointGroupLabel,
    showConflictAlert = false,
    checkinTime = '08:00, 15/11/2024',
    checkoutTime = '17:00, 15/11/2024',
  } = props;

  const [openReg, setOpenReg] = useState(false);
  const [uiState, setUiState] = useState(state);
  const navigate = useNavigate();
  const { contextHolder, open: openToast } = useToast();
  const [modalVariant, setModalVariant] = useState('confirm');

  const [openCheck, setOpenCheck] = useState(false);
  const [captured, setCaptured] = useState(null);

  const [openFeedback, setOpenFeedback] = useState(false);

  const activity = {
    id,
    title,
    points,
    dateTime,
    location,
    participants,
    capacity,
    coverImage,
    pointGroup,
    pointGroupLabel,
  };

  const normalizedGroupLabel =
    modalGroupLabelProp ??
    pointGroupLabel ??
    (pointGroup === 'NHOM_1' ? 'Nhóm 1' : pointGroup === 'NHOM_2_3' ? 'Nhóm 2,3' : undefined);

  const openDetails = () => {
    if (typeof onDetails === 'function') onDetails(activity);

    if (id) {
      navigate(routes.activityDetailWithId.replace(':id', id));
    } else {
      console.warn('No acitivities found: ', id);
    }
  };

  const handleOpenRegister = () => {
    onRegister?.(activity);
    setModalVariant('confirm');
    setOpenReg(true);
  };

  const handleOpenCancel = () => {
    setModalVariant('cancel');
    setOpenReg(true);
  };

  const handleCloseRegister = () => setOpenReg(false);

  const handleConfirmRegister = async (payload) => {
    try {
      if (modalVariant === 'cancel') {
        await onCancelRegister?.({ activity, ...payload });
        setOpenReg(false);
        setUiState('guest');
        onStateChange?.('guest');
        openToast({ message: cancelSuccessMessage, variant: 'success' });
      } else {
        await onRegistered?.({ activity, ...payload });
        setOpenReg(false);
        if (autoSwitchStateOnRegister) {
          setUiState('registered');
          onStateChange?.('registered');
        }
        openToast({ message: successMessage, variant: 'success' });
      }
    } catch {
      openToast({
        message: modalVariant === 'cancel' ? cancelErrorMessage : errorMessage,
        variant: 'danger',
      });
    }
  };

  const handleOpenAttendance = () => {
    setCaptured(null);
    setOpenCheck(true);
  };

  const handleCloseAttendance = () => {
    setOpenCheck(false);
    setCaptured(null);
  };

  const handleCaptured = ({ file, previewUrl, dataUrl }) => setCaptured({ file, previewUrl, dataUrl });

  const handleSubmitAttendance = async ({ file, previewUrl, dataUrl }) => {
    const payload = {
      file: file ?? captured?.file ?? null,
      previewUrl: previewUrl ?? captured?.previewUrl ?? null,
      dataUrl: dataUrl ?? captured?.dataUrl ?? null,
    };

    if (!payload.file) {
      openToast({ message: 'Không tìm thấy ảnh điểm danh. Vui lòng thử lại.', variant: 'danger' });
      return;
    }

    let evidenceDataUrl = payload.dataUrl;
    if (!evidenceDataUrl) {
      try {
        evidenceDataUrl = await fileToDataUrl(payload.file);
      } catch {
        openToast({ message: 'Không thể đọc dữ liệu ảnh. Vui lòng thử lại.', variant: 'danger' });
        return;
      }
    }

    try {
      await onConfirmPresent?.({
        activity,
        file: payload.file,
        previewUrl: payload.previewUrl,
        dataUrl: evidenceDataUrl,
      });
      setOpenCheck(false);
      setCaptured(null);
      openToast({ message: 'Gửi điểm danh thành công!', variant: 'success' });
      // Sau khi điểm danh có thể chuyển sang feedback_pending tùy nghiệp vụ
      // setUiState('feedback_pending'); onStateChange?.('feedback_pending');
    } catch {
      openToast({ message: 'Điểm danh thất bại. Thử lại sau nhé.', variant: 'danger' });
    }
  };

  // ==== Feedback handlers ====
  const handleOpenFeedback = () => {
    setOpenFeedback(true);
  };

  const handleCloseFeedback = () => setOpenFeedback(false);

  const handleSubmitFeedback = async ({ content, files, confirm }) => {
    try {
      await onSendFeedback?.({ activity, content, files, confirm });
      setOpenFeedback(false);
      setUiState('feedback_reviewing');
      onStateChange?.('feedback_reviewing');
      openToast({ message: 'Đã gửi phản hồi. Vui lòng chờ duyệt!', variant: 'success' });
    } catch {
      openToast({ message: 'Gửi phản hồi thất bại. Thử lại sau nhé.', variant: 'danger' });
    }
  };

  const pill = (text, tone = 'neutral') => ({ text, tone });
  const btn = (label, onClick, opt = {}) => ({ label, onClick, variant: 'outline', ...opt });

  const L = {
    details: 'Chi tiết',
    register: 'Đăng ký ngay',
    cancel: 'Hủy đăng ký',
    checkin: 'Điểm danh',
    complete: 'Hoàn thành',
    closed: 'Chưa bắt đầu',
    viewDetail: 'Xem chi tiết',
    confirmIn: 'Tham gia',
    confirmOut: 'Hoàn tất',
    sent: 'Đã gửi',
    giveFeedback: 'Gửi phản hồi',
    accepted: 'Hoàn thành',
    denied: 'Đã từ chối',
    canceled: 'Đã hủy',
    ...buttonLabels,
  };

  const preset = useMemo(() => {
    if (actions?.length) return { status: statusPill, buttons: actions };

    switch (uiState) {
      case 'guest':
        return {
          buttons: [
            btn(L.details, openDetails),
            btn(L.register, handleOpenRegister, { variant: 'primary', disabled: disableRegister }),
          ],
        };
      case 'registered':
        return {
          buttons: [btn(L.details, openDetails), btn(L.cancel, handleOpenCancel, { variant: 'danger' })],
        };
      case 'checkin':
        return {
          buttons: [btn(L.details, openDetails), btn(L.checkin, () => onCheckin?.(activity), { variant: 'primary' })],
        };
      case 'completed':
        return {
          buttons: [btn(L.details, openDetails), btn(L.complete, () => onComplete?.(activity), { variant: 'success' })],
        };
      case 'canceled':
        return {
          buttons: [btn(L.details, openDetails), btn(L.canceled, () => {}, { variant: 'muted', disabled: true })],
        };
      case 'attendance_open':
        return {
          buttons: [btn(L.details, openDetails), btn(L.checkin, handleOpenAttendance, { variant: 'primary' })],
        };
      case 'attendance_closed':
        return {
          buttons: [
            btn(L.details, openDetails, { variant: 'outline' }),
            btn(L.closed, () => {}, { variant: 'muted', disabled: true }),
          ],
        };
      case 'ended':
        return {
          buttons: [btn(L.details, openDetails, { variant: 'outline', fullWidth: true })],
        };
      case 'confirm_in':
        return {
          buttons: [
            btn(L.details, openDetails, { variant: 'outline' }),
            btn(L.confirmIn, handleOpenAttendance, { variant: 'primary' }),
          ],
        };
      case 'confirm_out':
        return {
          buttons: [
            btn(L.details, openDetails, { variant: 'outline' }),
            btn(L.confirmOut, handleCloseAttendance, { variant: 'orange' }),
          ],
        };
      case 'details_only':
        return { buttons: [btn(L.viewDetail, openDetails, { variant: 'success', fullWidth: true })] };
      case 'feedback_pending':
        return {
          status: pill('• Chưa được cộng điểm', 'danger'),
          buttons: [
            btn(L.details, openDetails),
            btn(L.giveFeedback, handleOpenFeedback, {
              variant: 'orange',
            }),
          ],
        };
      case 'feedback_reviewing':
        return {
          status: pill('• Chờ duyệt', 'warning'),
          buttons: [
            btn(L.details, openDetails),
            btn(L.sent, () => {}, {
              variant: 'muted',
              disabled: true,
            }),
          ],
        };
      case 'feedback_accepted':
        return {
          status: pill('• Đã cộng điểm', 'success'),
          buttons: [
            btn(L.details, openDetails),
            btn(L.accepted, () => {}, {
              variant: 'muted',
              disabled: true,
            }),
          ],
        };
      case 'feedback_denied':
        return {
          status: pill('• Không được cộng điểm', 'muted'),
          buttons: [
            btn(L.details, openDetails),
            btn(L.denied, () => {}, {
              variant: 'muted',
              disabled: true,
            }),
          ],
        };
      default:
        return {
          buttons: [
            btn(L.details, openDetails),
            btn(L.register, handleOpenRegister, { variant: 'primary', disabled: disableRegister }),
          ],
        };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState, actions, statusPill, id, title, points, dateTime, location, capacity]);

  return (
    <div
      className={cx(
        'activity-card',
        {
          'activity-card--vertical': variant === 'vertical',
          'activity-card--horizontal': variant === 'horizontal',
          'activity-card--featured': isFeatured,
        },
        className,
      )}
    >
      {contextHolder}
      <div className={cx('activity-card__cover')}>
        <img src={coverImage} alt={title} className={cx('activity-card__img')} />{' '}
        {isFeatured && <div className={cx('activity-card__badge')}>{badgeText}</div>}
      </div>

      <div className={cx('activity-card__content')}>
        <div className={cx('activity-card__title')}>{title}</div>

        <div className={cx('activity-card__points')}>
          <FontAwesomeIcon icon={faCoins} />
          <span className={cx('activity-card__points-value')}>{points != null ? `${points} điểm` : '--'}</span>
        </div>

        <div className={cx('activity-card__date')}>
          <FontAwesomeIcon icon={faCalendar} />
          <span className={cx('activity-card__date-value')}>{dateTime || '--'}</span>
        </div>

        <div className={cx('activity-card__location')}>
          <FontAwesomeIcon icon={faLocationDot} />
          <span className={cx('activity-card__location-value')}>{location || '--'}</span>
        </div>

        <div className={cx('activity-card__participants')}>
          <Avatar.Group
            max={{
              count: 3,
              style: { color: '#F56A00', backgroundColor: '#FDE3CF' },
            }}
          >
            {participants.map((p, idx) => {
              if (typeof p === 'string') return <Avatar key={idx} src={p} alt="participant" />;
              const { name, src } = p || {};
              return (
                <Tooltip key={idx} title={name} placement="top">
                  {src ? (
                    <Avatar src={src} alt={name} />
                  ) : name ? (
                    <Avatar>{initials(name)}</Avatar>
                  ) : (
                    <Avatar icon={<UserOutlined />} />
                  )}
                </Tooltip>
              );
            })}
          </Avatar.Group>

          <span className={cx('activity-card__capacity')}>Số lượng: {capacity || '--'}</span>
        </div>

        {/* STATUS PILL */}
        {preset.status?.text && (
          <div
            className={cx('activity-card__status', {
              'is-warning': preset.status.tone === 'warning',
              'is-danger': preset.status.tone === 'danger',
              'is-success': preset.status.tone === 'success',
              'is-muted': preset.status.tone === 'muted',
            })}
          >
            {preset.status.text}
          </div>
        )}

        {/* ACTIONS */}
        <div
          className={cx('activity-card__actions', {
            'actions--row': preset.layout === 'row',
            'actions--column': preset.layout === 'column',
            'actions--single': (preset.buttons?.length || 0) === 1,
          })}
        >
          {preset.buttons?.map((b, idx) => (
            <Button
              key={b.key || idx}
              variant={b.variant || 'outline'}
              onClick={b.onClick}
              disabled={b.disabled}
              fullWidth={b.fullWidth}
              leftIcon={b.leftIcon}
              rightIcon={b.rightIcon}
            >
              {b.label}
            </Button>
          ))}
        </div>
      </div>

      <RegisterModal
        open={openReg}
        onCancel={handleCloseRegister}
        onConfirm={handleConfirmRegister}
        variant={modalVariant}
        campaignName={title}
        groupLabel={normalizedGroupLabel}
        pointsLabel={points != null ? `${points} điểm` : undefined}
        dateTime={dateTime}
        location={location}
        showConflictAlert={showConflictAlert}
        {...registerModalProps}
      />

      <CheckModal
        open={openCheck}
        onCancel={handleCloseAttendance}
        onCapture={handleCaptured}
        onRetake={() => setCaptured(null)}
        onSubmit={handleSubmitAttendance}
        variant="checkin"
        campaignName={title}
        groupLabel={normalizedGroupLabel}
        pointsLabel={points != null ? `${points} điểm` : undefined}
        dateTime={dateTime}
        location={location}
      />

      {/* FeedbackModal chỉ mở khi state là feedback_pending */}
      <FeedbackModal
        open={openFeedback}
        onSubmit={handleSubmitFeedback}
        onCancel={handleCloseFeedback}
        campaignName={title}
        groupLabel={normalizedGroupLabel}
        pointsLabel="Chưa được cộng điểm"
        checkinTime={checkinTime}
        checkoutTime={checkoutTime}
      />
    </div>
  );
}

export default CardActivity;
