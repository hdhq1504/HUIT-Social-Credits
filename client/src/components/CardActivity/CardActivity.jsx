import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { buildPath } from '@/config/routes.config';
import { Avatar, Skeleton, Tooltip } from 'antd';
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

// Helper: tạo initials từ tên (dùng cho Avatar khi không có src)
const initials = (name = '') =>
  (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join('') || 'U'
  ).toUpperCase();

const toTimestamp = (value) => {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? null : ts;
};

// Thời gian offset trước checkout để bật nút checkout (mặc định 10 phút)
const CHECKOUT_OFFSET_MS = 10 * 60 * 1000;

const buildInitialCardState = ({ initialUiState, attendanceStep, checkoutAvailable }) => ({
  registerModalOpen: false,
  uiState: initialUiState,
  modalVariant: 'confirm',
  checkModalOpen: false,
  capturedEvidence: null,
  feedbackModalOpen: false,
  isRegisterProcessing: false,
  isAttendanceSubmitting: false,
  isFeedbackSubmitting: false,
  attendanceStep,
  checkoutAvailable,
});

const cardActivityReducer = (prevState, action) => {
  switch (action.type) {
    case 'SET':
      return { ...prevState, ...action.payload };
    case 'RESET_CAPTURED':
      return { ...prevState, capturedEvidence: null };
    default:
      return prevState;
  }
};

function CardActivity(props) {
  const {
    id,
    title,
    points,
    dateTime,
    endTime,
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
    attendanceLoading = false,
    registration,
    loading = false,
  } = props;

  const attendanceSummary = registration?.attendanceSummary;
  const derivedNextAttendancePhase = attendanceSummary?.nextPhase ?? 'checkin';

  const checkoutAvailableTimestamp = useMemo(() => {
    if (attendanceSummary?.checkoutAvailableAt) {
      const ts = toTimestamp(attendanceSummary.checkoutAvailableAt);
      if (ts) return ts;
    }
    const endTimestamp = toTimestamp(endTime);
    if (endTimestamp) {
      return endTimestamp - CHECKOUT_OFFSET_MS;
    }
    return null;
  }, [attendanceSummary?.checkoutAvailableAt, endTime]);

  // Nếu attendanceSummary.hasCheckout true => đã checkout
  const initialCheckoutAvailability = useMemo(() => {
    if (attendanceSummary?.hasCheckout) return true;
    if (!checkoutAvailableTimestamp) return true;
    return Date.now() >= checkoutAvailableTimestamp;
  }, [attendanceSummary?.hasCheckout, checkoutAvailableTimestamp]);

  const [localState, dispatch] = useReducer(
    cardActivityReducer,
    buildInitialCardState({
      initialUiState: state,
      attendanceStep: derivedNextAttendancePhase,
      checkoutAvailable: initialCheckoutAvailability,
    }),
  );
  const {
    registerModalOpen,
    uiState,
    modalVariant,
    checkModalOpen,
    capturedEvidence,
    feedbackModalOpen,
    isRegisterProcessing,
    isAttendanceSubmitting,
    isFeedbackSubmitting,
    attendanceStep,
    checkoutAvailable,
  } = localState;
  const navigate = useNavigate();
  const { contextHolder, open: openToast } = useToast();
  const checkoutTimerRef = useRef(null);
  const checkoutReminderShownRef = useRef(false);

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

  const groupLabelMap = useMemo(
    () => ({
      NHOM_1: 'Nhóm 1',
      NHOM_2: 'Nhóm 2',
      NHOM_3: 'Nhóm 3',
    }),
    [],
  );

  const normalizedGroupLabel = modalGroupLabelProp ?? pointGroupLabel ?? groupLabelMap[pointGroup];

  const skeletonContent = (
    <div
      className={cx(
        'activity-card',
        {
          'activity-card--vertical': variant === 'vertical',
          'activity-card--horizontal': variant === 'horizontal',
        },
        className,
      )}
    >
      <div className={cx('activity-card__cover', 'activity-card__cover--skeleton')}>
        <Skeleton.Image active className={cx('activity-card__skeleton-image')} />
      </div>
      <div className={cx('activity-card__content', 'activity-card__content--skeleton')}>
        <Skeleton active title paragraph={{ rows: 4 }} />
        <div className={cx('activity-card__skeleton-actions')}>
          <Skeleton.Button active size="default" />
          <Skeleton.Button active size="default" />
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    // ===== CẬP NHẬT (FIX 1/2) =====
    // Lỗi gốc: dispatch({ type: 'SET', payload: { uiState: false } });
    // Gán `uiState` bằng `false` (boolean) đã làm hỏng logic
    // và gây ra vòng lặp vô tận.
    //
    // Sửa lại: Đồng bộ `uiState` nội bộ với `state` prop.
    dispatch({ type: 'SET', payload: { uiState: state } });
  }, [state]);

  useEffect(() => {
    dispatch({ type: 'SET', payload: { attendanceStep: derivedNextAttendancePhase } });
  }, [derivedNextAttendancePhase]);

  // EFFECT: quản lý timer checkout mở
  // ===== CẬP NHẬT (FIX 2/2) =====
  // Thêm các điều kiện `if (!checkoutAvailable)` và `if (checkoutAvailable)`
  // trước khi dispatch để đảm bảo state chỉ được set khi nó thực sự thay đổi.
  // Thêm `checkoutAvailable` và `dispatch` vào mảng phụ thuộc.
  useEffect(() => {
    // Clear existing timer
    if (checkoutTimerRef.current) {
      clearTimeout(checkoutTimerRef.current);
      checkoutTimerRef.current = null;
    }

    // Nếu đã checkout thì mở luôn
    if (attendanceSummary?.hasCheckout) {
      if (!checkoutAvailable) {
        // <--- CHỈ DISPATCH NẾU STATE KHÁC
        dispatch({ type: 'SET', payload: { checkoutAvailable: true } });
      }
      checkoutReminderShownRef.current = true;
      return undefined;
    }

    // Nếu người dùng chưa ở trạng thái chờ checkout -> không cần timer
    if (uiState !== 'confirm_out') {
      if (!checkoutAvailable) {
        // <--- CHỈ DISPATCH NẾU STATE KHÁC
        dispatch({ type: 'SET', payload: { checkoutAvailable: true } });
      }
      checkoutReminderShownRef.current = false;
      return undefined;
    }

    if (!checkoutAvailableTimestamp) {
      if (!checkoutAvailable) {
        // <--- CHỈ DISPATCH NẾU STATE KHÁC
        dispatch({ type: 'SET', payload: { checkoutAvailable: true } });
      }
      return undefined;
    }

    const now = Date.now();
    // Nếu đã vượt timestamp -> mở và show reminder 1 lần
    if (now >= checkoutAvailableTimestamp) {
      if (!checkoutAvailable) {
        // <--- CHỈ DISPATCH NẾU STATE KHÁC
        dispatch({ type: 'SET', payload: { checkoutAvailable: true } });
      }
      if (!checkoutReminderShownRef.current) {
        openToast({ message: 'Điểm danh cuối giờ đã mở, đừng quên hoàn tất nhé!', variant: 'info' });
        checkoutReminderShownRef.current = true;
      }
      return undefined;
    }

    // Chưa tới thời điểm -> set timeout
    if (checkoutAvailable) {
      // <--- CHỈ DISPATCH NẾU STATE KHÁC
      dispatch({ type: 'SET', payload: { checkoutAvailable: false } });
    }
    checkoutTimerRef.current = setTimeout(() => {
      dispatch({ type: 'SET', payload: { checkoutAvailable: true } });
      if (!checkoutReminderShownRef.current) {
        openToast({ message: 'Điểm danh cuối giờ đã mở, đừng quên hoàn tất nhé!', variant: 'info' });
        checkoutReminderShownRef.current = true;
      }
    }, checkoutAvailableTimestamp - now);

    // Cleanup timer khi effect rerun
    return () => {
      if (checkoutTimerRef.current) {
        clearTimeout(checkoutTimerRef.current);
        checkoutTimerRef.current = null;
      }
    };
    // Thêm `checkoutAvailable` và `dispatch` vào dependencies
  }, [attendanceSummary?.hasCheckout, checkoutAvailableTimestamp, openToast, uiState, checkoutAvailable, dispatch]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (checkoutTimerRef.current) {
        clearTimeout(checkoutTimerRef.current);
        checkoutTimerRef.current = null;
      }
    },
    [],
  );

  const isAttendanceBusy = isAttendanceSubmitting || attendanceLoading;
  const hasCheckin = attendanceSummary?.hasCheckin;
  const hasCheckout = attendanceSummary?.hasCheckout;
  const isCheckoutReady = checkoutAvailable || hasCheckout;
  const isCheckoutPending = uiState === 'confirm_out' && hasCheckin && !isCheckoutReady;

  // Khi click vào details: gọi callback trước rồi điều hướng
  const openDetails = () => {
    if (typeof onDetails === 'function') onDetails(activity);

    if (id) {
      navigate(buildPath.activityDetail(id));
    } else {
      console.warn('No acitivities found: ', id);
    }
  };

  // Register modal handling
  const handleOpenRegister = () => {
    onRegister?.(activity);
    dispatch({ type: 'SET', payload: { modalVariant: 'confirm', registerModalOpen: true } });
  };

  const handleOpenCancel = () => {
    dispatch({ type: 'SET', payload: { modalVariant: 'cancel', registerModalOpen: true } });
  };

  // ===== CẬP NHẬT (FIX LOGIC) =====
  // Sửa lại: set registerModalOpen: false để đóng modal
  const handleCloseRegister = () => dispatch({ type: 'SET', payload: { registerModalOpen: false } });

  // Xử lý xác nhận register / cancel register
  const handleConfirmRegister = async (payload) => {
    dispatch({ type: 'SET', payload: { isRegisterProcessing: true } });
    try {
      if (modalVariant === 'cancel') {
        await onCancelRegister?.({ activity, ...payload });
        dispatch({ type: 'SET', payload: { registerModalOpen: false, uiState: 'guest', modalVariant: 'confirm' } });
        // notify parent
        // onStateChange optional
        onStateChange?.('guest');
        openToast({ message: 'Hủy đăng ký thành công!', variant: 'success' });
      } else {
        await onRegistered?.({ activity, ...payload });
        // ===== CẬP NHẬT (FIX LOGIC) =====
        // Thêm: đóng modal sau khi đăng ký thành công
        dispatch({ type: 'SET', payload: { registerModalOpen: false } });
        if (autoSwitchStateOnRegister) {
          dispatch({ type: 'SET', payload: { uiState: 'registered' } });
          onStateChange?.('registered');
        }
        openToast({ message: 'Đăng ký hoạt động thành công!', variant: 'success' });
      }
    } catch {
      openToast({
        message:
          modalVariant === 'cancel' ? 'Hủy đăng ký thất bại. Vui lòng thử lại.' : 'Đăng ký thất bại. Vui lòng thử lại.',
        variant: 'danger',
      });
    } finally {
      dispatch({ type: 'SET', payload: { isRegisterProcessing: false } });
    }
  };

  // Attendance handling (mở modal chụp/submit)
  const handleOpenAttendance = (phase = attendanceStep ?? 'checkin') => {
    dispatch({
      type: 'SET',
      payload: { capturedEvidence: null, attendanceStep: phase, checkModalOpen: true },
    });
  };

  const handleCloseAttendance = () => {
    dispatch({ type: 'SET', payload: { checkModalOpen: false } });
    dispatch({ type: 'RESET_CAPTURED' });
  };

  const handleCaptured = ({ file, previewUrl, dataUrl }) =>
    dispatch({ type: 'SET', payload: { capturedEvidence: { file, previewUrl, dataUrl } } });

  // Submit attendance: chuyển file sang dataUrl nếu cần, gọi onConfirmPresent
  const handleSubmitAttendance = async ({ file, previewUrl, dataUrl }) => {
    const payload = {
      file: file ?? capturedEvidence?.file ?? null,
      previewUrl: previewUrl ?? capturedEvidence?.previewUrl ?? null,
      dataUrl: dataUrl ?? capturedEvidence?.dataUrl ?? null,
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

    const phaseToSend = attendanceStep || 'checkin';

    // ===== CẬP NHẬT (FIX LOGIC) =====
    // Chuyển set isAttendanceSubmitting: true lên trước
    dispatch({ type: 'SET', payload: { isAttendanceSubmitting: true } });
    try {
      // Bỏ dispatch({ type: 'SET', payload: { checkModalOpen: false } }); ở đây
      const result = await onConfirmPresent?.({
        activity,
        file: payload.file,
        previewUrl: payload.previewUrl,
        dataUrl: evidenceDataUrl,
        phase: phaseToSend,
      });
      dispatch({ type: 'SET', payload: { checkModalOpen: false } }); // Đóng modal khi thành công
      dispatch({ type: 'RESET_CAPTURED' });
      const faceStatus = result?.face?.status || null;
      const toastVariant = faceStatus === 'REVIEW' ? 'warning' : 'success';
      const fallbackMessage =
        phaseToSend === 'checkout' ? 'Gửi điểm danh cuối giờ thành công!' : 'Gửi điểm danh đầu giờ thành công!';
      openToast({
        message: result?.message || fallbackMessage,
        variant: toastVariant,
      });
      dispatch({
        type: 'SET',
        payload: { attendanceStep: phaseToSend === 'checkin' ? 'checkout' : 'checkin' },
      });
      if (phaseToSend === 'checkin') {
        checkoutReminderShownRef.current = false;
        const nextAvailability = checkoutAvailableTimestamp ? Date.now() >= checkoutAvailableTimestamp : true;
        dispatch({
          type: 'SET',
          payload: { checkoutAvailable: nextAvailability, uiState: 'confirm_out' },
        });
        onStateChange?.('confirm_out');
      } else {
        checkoutReminderShownRef.current = true;
        // ===== CẬP NHẬT (FIX LOGIC) =====
        // Thêm: Chuyển state sau khi checkout thành công
        dispatch({ type: 'SET', payload: { uiState: 'details_only' } });
        onStateChange?.('details_only');
      }
    } catch (error) {
      if (error?.message === 'ATTENDANCE_ABORTED') return;
      openToast({ message: 'Điểm danh thất bại. Thử lại sau nhé.', variant: 'danger' });
    } finally {
      dispatch({ type: 'SET', payload: { isAttendanceSubmitting: false } });
    }
  };

  // ==== Feedback handlers ====
  const handleOpenFeedback = () => {
    dispatch({ type: 'SET', payload: { feedbackModalOpen: true } });
  };

  const handleCloseFeedback = () => dispatch({ type: 'SET', payload: { feedbackModalOpen: false } });

  const handleSubmitFeedback = async ({ content, files, confirm }) => {
    dispatch({ type: 'SET', payload: { isFeedbackSubmitting: true } });
    try {
      await onSendFeedback?.({ activity, content, files, confirm });
      // ===== CẬP NHẬT (FIX LOGIC) =====
      // Sửa: Gán isFeedbackSubmitting: false và đóng modal
      dispatch({ type: 'SET', payload: { isFeedbackSubmitting: false, feedbackModalOpen: false } });
      onStateChange?.('feedback_reviewing');
      openToast({ message: 'Đã gửi phản hồi. Vui lòng chờ duyệt!', variant: 'success' });
    } catch {
      openToast({ message: 'Gửi phản hồi thất bại. Thử lại sau nhé.', variant: 'danger' });
      // ===== CẬP NHẬT (FIX LOGIC) =====
      // Thêm: set isFeedbackSubmitting: false khi có lỗi
      dispatch({ type: 'SET', payload: { isFeedbackSubmitting: false } });
    } finally {
      // Bỏ dispatch(isFeedbackSubmitting: false) ở đây vì đã xử lý ở trên
    }
  };

  // Helper nhỏ để tạo pill/status button
  const pill = (text, tone = 'neutral') => ({ text, tone });
  const btn = (label, onClick, opt = {}) => ({ label, onClick, variant: 'outline', ...opt });

  // Localization / label overrides
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
    checkoutLocked: '• Điểm danh cuối giờ chưa mở',
    processing: 'Đang xử lý',
    waitingFeedback: '• Đang chờ cộng điểm',
    absent: '• Vắng mặt',
    ...buttonLabels,
  };

  // Preset buttons và status dựa trên uiState
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
          buttons: [
            btn(L.details, openDetails),
            btn(L.checkin, () => handleOpenAttendance(attendanceStep ?? 'checkin'), {
              variant: 'primary',
              disabled: isAttendanceBusy,
            }),
          ],
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
            btn(L.confirmIn, () => handleOpenAttendance('checkin'), {
              variant: 'primary',
              disabled: isAttendanceBusy,
            }),
          ],
        };
      case 'confirm_out':
        return {
          status: isCheckoutPending ? pill(L.checkoutLocked, 'warning') : undefined,
          buttons: [
            btn(L.details, openDetails, { variant: 'outline' }),
            btn(L.confirmOut, () => handleOpenAttendance('checkout'), {
              variant: 'orange',
              disabled: isAttendanceBusy || !isCheckoutReady,
            }),
          ],
        };
      case 'details_only':
        return { buttons: [btn(L.viewDetail, openDetails, { variant: 'success', fullWidth: true })] };
      case 'feedback_waiting':
        return {
          status: pill(L.waitingFeedback, 'warning'),
          buttons: [btn(L.details, openDetails), btn(L.processing, () => {}, { variant: 'muted', disabled: true })],
        };
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
      case 'absent':
        return {
          status: pill(L.absent, 'danger'),
          buttons: [btn(L.details, openDetails, { variant: 'outline', fullWidth: true })],
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
  }, [
    uiState,
    actions,
    statusPill,
    id,
    title,
    points,
    dateTime,
    location,
    capacity,
    attendanceStep,
    isAttendanceBusy,
    isCheckoutPending,
    isCheckoutReady,
  ]);

  if (loading) {
    return skeletonContent;
  }

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
      {/* toast context holder */}
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

        {/* STATUS PILL (hiển thị trạng thái nhỏ) */}
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

        {/* ACTIONS: dùng Button component */}
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

      {/* Register modal: truyền props cần thiết, confirmLoading từ state */}
      <RegisterModal
        // ===== CẬP NHẬT (FIX LOGIC) =====
        // Lỗi gõ phím: `open={checkModalOpen}` -> `open={registerModalOpen}`
        open={registerModalOpen}
        onCancel={handleCloseRegister}
        onConfirm={handleConfirmRegister}
        variant={modalVariant}
        campaignName={title}
        groupLabel={normalizedGroupLabel}
        pointsLabel={points != null ? `${points} điểm` : undefined}
        dateTime={dateTime}
        location={location}
        showConflictAlert={showConflictAlert}
        confirmLoading={isRegisterProcessing}
        {...registerModalProps}
      />

      {/* CheckModal: điểm danh (camera / upload) */}
      <CheckModal
        open={checkModalOpen}
        onCancel={handleCloseAttendance}
        onCapture={handleCaptured}
        onRetake={() => dispatch({ type: 'RESET_CAPTURED' })}
        onSubmit={handleSubmitAttendance}
        variant="checkin"
        campaignName={title}
        groupLabel={normalizedGroupLabel}
        pointsLabel={points != null ? `${points} điểm` : undefined}
        dateTime={dateTime}
        location={location}
        confirmLoading={isAttendanceBusy}
        phase={attendanceStep}
      />

      {/* FeedbackModal chỉ mở khi user muốn gửi phản hồi */}
      <FeedbackModal
        open={feedbackModalOpen}
        onSubmit={handleSubmitFeedback}
        onCancel={handleCloseFeedback}
        campaignName={title}
        groupLabel={normalizedGroupLabel}
        pointsLabel="Chưa được cộng điểm"
        checkinTime={checkinTime}
        checkoutTime={checkoutTime}
        submitLoading={isFeedbackSubmitting}
      />
    </div>
  );
}

export default CardActivity;
