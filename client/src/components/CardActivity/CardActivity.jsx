import React, { useEffect, useMemo, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { useQuery } from '@tanstack/react-query';
import { buildPath } from '@/config/routes.config';
import { Avatar, Skeleton, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faCalendar, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import Button from '../Button/Button';
import RegisterModal from '../RegisterModal/RegisterModal';
import AttendanceModal from '../AttendanceModal/AttendanceModal';
import FeedbackModal from '../FeedbackModal/FeedbackModal';
import useToast from '../Toast/Toast';
import { fileToDataUrl } from '@utils/file';
import { formatDateTime } from '@utils/datetime';
import { computeDescriptorFromDataUrl, ensureModelsLoaded } from '@/services/faceApiService';
import activitiesApi, { MY_ACTIVITIES_QUERY_KEY } from '@api/activities.api';
import useAuthStore from '@/stores/useAuthStore';
import fallbackImage from '@/assets/images/fallback-cover.png';
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

const toTimestamp = (value) => {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? null : ts;
};

/** Thời gian cho phép checkout (10 phút trước) */
// const CHECKOUT_OFFSET_MS = 10 * 60 * 1000;
const CHECKOUT_OFFSET_MS = 0;

/**
 * Kiểm tra xem 2 khoảng thời gian có trùng nhau không.
 * @param {Date|string} start1 - Thời gian bắt đầu khoảng 1.
 * @param {Date|string} end1 - Thời gian kết thúc khoảng 1.
 * @param {Date|string} start2 - Thời gian bắt đầu khoảng 2.
 * @param {Date|string} end2 - Thời gian kết thúc khoảng 2.
 * @returns {boolean} True nếu trùng nhau.
 */
const checkTimeOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  return s1 < e2 && e1 > s2;
};

/**
 * Tạo state khởi tạo cho CardActivity.
 * @param {Object} params - Các tham số khởi tạo.
 * @returns {Object} State khởi tạo.
 */
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

/**
 * Reducer quản lý state của CardActivity.
 * @param {Object} prevState - State hiện tại.
 * @param {Object} action - Action cần thực hiện.
 * @returns {Object} State mới.
 */
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
    // Thông tin cơ bản
    id,
    title,
    points,
    dateTime,
    startTime,
    endTime,
    location,
    coverImage,

    // Hiển thị
    participants = [],
    capacity,
    isFeatured = false,
    badgeText = 'Nổi bật',
    variant = 'vertical',
    className,
    state = 'guest',
    loading = false,

    // Điểm số
    pointGroup,
    pointGroupLabel,
    modalGroupLabel: modalGroupLabelProp,

    // Đăng ký
    disableRegister = false,
    autoSwitchStateOnRegister = true,
    registerModalProps = {},
    registrationDeadline,
    cancellationDeadline,
    showConflictAlert = false,
    registration,

    // Điểm danh
    attendanceMethod,
    attendanceMethodLabel,
    attendanceLoading = false,
    checkinTime: checkinTimeProp,
    checkoutTime: checkoutTimeProp,

    // Callbacks
    onDetails,
    onRegister,
    onRegistered,
    onStateChange,
    onCancelRegister,
    onCheckin,
    onComplete,
    onConfirmPresent,
    onSendFeedback,

    // UI overrides
    actions,
    statusPill,
    buttonLabels = {},
  } = props;

  const userId = useAuthStore((state) => state.user?.id);

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

  useEffect(() => {
    if (attendanceMethod === 'photo') {
      ensureModelsLoaded().catch(() => {});
    }
  }, [attendanceMethod]);

  // Lấy danh sách hoạt động đã đăng ký để kiểm tra xung đột lịch
  const { data: myRegistrations = [] } = useQuery({
    queryKey: MY_ACTIVITIES_QUERY_KEY,
    queryFn: () => activitiesApi.listMine(),
    enabled: !!userId && !showConflictAlert,
    staleTime: 30 * 1000,
    select: (data) => data.filter((r) => r.status === 'DANG_KY'),
  });

  // Kiểm tra xung đột lịch với các hoạt động đã đăng ký
  const hasScheduleConflict = useMemo(() => {
    if (showConflictAlert) return true;

    // Kiểm tra dựa trên danh sách đăng ký
    if (!startTime || !endTime || !myRegistrations.length) return false;

    return myRegistrations.some((registration) => {
      const regActivity = registration.activity;
      if (!regActivity || regActivity.id === id) return false;
      if (!regActivity.startTime || !regActivity.endTime) return false;

      return checkTimeOverlap(startTime, endTime, regActivity.startTime, regActivity.endTime);
    });
  }, [showConflictAlert, startTime, endTime, id, myRegistrations]);

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

  const formattedRegistrationDeadline = useMemo(() => {
    if (!registrationDeadline) return null;
    const formatted = formatDateTime(registrationDeadline);
    return formatted !== '--' ? formatted : null;
  }, [registrationDeadline]);

  const formattedCancellationDeadline = useMemo(() => {
    if (!cancellationDeadline) return null;
    const formatted = formatDateTime(cancellationDeadline);
    return formatted !== '--' ? formatted : null;
  }, [cancellationDeadline]);

  const [feedbackCheckinTime, feedbackCheckoutTime] = useMemo(() => {
    const history = registration?.attendanceHistory || [];
    const findPhase = (phase) => history.find((entry) => entry.phase === phase);
    const formatValue = (value) => {
      if (!value) return null;
      const formatted = formatDateTime(value);
      return formatted !== '--' ? formatted : null;
    };

    const checkinValue =
      formatValue(findPhase('checkin')?.capturedAt) ||
      formatValue(registration?.checkInAt) ||
      (typeof checkinTimeProp === 'string' ? checkinTimeProp : null);

    const checkoutValue =
      formatValue(findPhase('checkout')?.capturedAt) ||
      (typeof checkoutTimeProp === 'string' ? checkoutTimeProp : null);

    return [checkinValue, checkoutValue];
  }, [registration?.attendanceHistory, registration?.checkInAt, checkinTimeProp, checkoutTimeProp]);

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
    dispatch({ type: 'SET', payload: { uiState: state } });
  }, [state]);

  useEffect(() => {
    dispatch({ type: 'SET', payload: { attendanceStep: derivedNextAttendancePhase } });
  }, [derivedNextAttendancePhase]);

  // EFFECT: quản lý timer checkout mở
  useEffect(() => {
    if (checkoutTimerRef.current) {
      clearTimeout(checkoutTimerRef.current);
      checkoutTimerRef.current = null;
    }

    if (attendanceSummary?.hasCheckout) {
      if (!checkoutAvailable) {
        dispatch({ type: 'SET', payload: { checkoutAvailable: true } });
      }
      checkoutReminderShownRef.current = true;
      return undefined;
    }

    if (uiState !== 'check_out') {
      if (!checkoutAvailable) {
        dispatch({ type: 'SET', payload: { checkoutAvailable: true } });
      }
      checkoutReminderShownRef.current = false;
      return undefined;
    }

    if (!checkoutAvailableTimestamp) {
      if (!checkoutAvailable) {
        dispatch({ type: 'SET', payload: { checkoutAvailable: true } });
      }
      return undefined;
    }

    const now = Date.now();
    if (now >= checkoutAvailableTimestamp) {
      if (!checkoutAvailable) {
        dispatch({ type: 'SET', payload: { checkoutAvailable: true } });
      }
      if (!checkoutReminderShownRef.current) {
        openToast({ message: 'Điểm danh cuối giờ đã mở, đừng quên hoàn tất nhé!', variant: 'info' });
        checkoutReminderShownRef.current = true;
      }
      return undefined;
    }

    if (checkoutAvailable) {
      dispatch({ type: 'SET', payload: { checkoutAvailable: false } });
    }
    checkoutTimerRef.current = setTimeout(() => {
      dispatch({ type: 'SET', payload: { checkoutAvailable: true } });
      if (!checkoutReminderShownRef.current) {
        openToast({ message: 'Điểm danh cuối giờ đã mở, đừng quên hoàn tất nhé!', variant: 'info' });
        checkoutReminderShownRef.current = true;
      }
    }, checkoutAvailableTimestamp - now);

    return () => {
      if (checkoutTimerRef.current) {
        clearTimeout(checkoutTimerRef.current);
        checkoutTimerRef.current = null;
      }
    };
  }, [attendanceSummary?.hasCheckout, checkoutAvailableTimestamp, openToast, uiState, checkoutAvailable, dispatch]);

  useEffect(
    () => () => {
      if (checkoutTimerRef.current) {
        clearTimeout(checkoutTimerRef.current);
        checkoutTimerRef.current = null;
      }
    },
    [],
  );

  // === Derived states cho UI ===
  const isAttendanceBusy = isAttendanceSubmitting || attendanceLoading; // Đang xử lý điểm danh
  const hasCheckin = attendanceSummary?.hasCheckin; // Đã điểm danh đầu giờ
  const hasCheckout = attendanceSummary?.hasCheckout; // Đã điểm danh cuối giờ
  const isCheckoutReady = checkoutAvailable || hasCheckout; // Sẵn sàng checkout
  const isCheckoutPending = uiState === 'check_out' && hasCheckin && !isCheckoutReady; // Chờ mở checkout

  // Mở trang chi tiết hoạt động
  const openDetails = () => {
    if (typeof onDetails === 'function') onDetails(activity);

    if (id) {
      navigate(buildPath.activityDetail(id));
    } else {
      console.warn('No acitivities found: ', id);
    }
  };

  // Mở modal đăng ký hoạt động
  const handleOpenRegister = () => {
    onRegister?.(activity);
    dispatch({ type: 'SET', payload: { modalVariant: 'confirm', registerModalOpen: true } });
  };

  // Mở modal hủy đăng ký
  const handleOpenCancel = () => {
    dispatch({ type: 'SET', payload: { modalVariant: 'cancel', registerModalOpen: true } });
  };

  // Đóng modal đăng ký/hủy
  const handleCloseRegister = () => dispatch({ type: 'SET', payload: { registerModalOpen: false } });

  /**
   * Xử lý xác nhận đăng ký hoặc hủy đăng ký.
   * Phân biệt dựa trên modalVariant: 'confirm' = đăng ký, 'cancel' = hủy.
   */
  const handleConfirmRegister = async (payload) => {
    dispatch({ type: 'SET', payload: { isRegisterProcessing: true } });
    try {
      if (modalVariant === 'cancel') {
        // Xử lý hủy đăng ký
        await onCancelRegister?.({ activity, ...payload });
        dispatch({ type: 'SET', payload: { registerModalOpen: false, uiState: 'guest', modalVariant: 'confirm' } });
        onStateChange?.('guest');
        openToast({ message: 'Hủy đăng ký thành công!', variant: 'success' });
      } else {
        // Xử lý đăng ký mới
        await onRegistered?.({ activity, ...payload });
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

  /**
   * Mở modal điểm danh với phase cụ thể (checkin/checkout).
   * Kiểm tra yêu cầu đăng ký khuôn mặt trước khi cho phép.
   */
  const handleOpenAttendance = (phase = attendanceStep ?? 'checkin') => {
    // Kiểm tra yêu cầu face enrollment
    if (props.requiresFaceEnrollment && !props.faceEnrollment?.enrolled) {
      openToast({
        message: 'Bạn cần đăng ký khuôn mặt trong trang Thông tin sinh viên trước khi điểm danh.',
        variant: 'danger',
      });
      return;
    }
    dispatch({
      type: 'SET',
      payload: { capturedEvidence: null, attendanceStep: phase, checkModalOpen: true },
    });
  };

  // Đóng modal điểm danh và reset ảnh đã chụp
  const handleCloseAttendance = () => {
    dispatch({ type: 'SET', payload: { checkModalOpen: false } });
    dispatch({ type: 'RESET_CAPTURED' });
  };

  // Lưu ảnh đã chụp/chọn vào state
  const handleCaptured = ({ file, previewUrl, dataUrl }) =>
    dispatch({ type: 'SET', payload: { capturedEvidence: { file, previewUrl, dataUrl } } });

  /**
   * Xử lý gửi điểm danh.
   * Flow: Validate ảnh -> Chuyển file sang dataUrl -> Phân tích khuôn mặt -> Gọi API -> Cập nhật state.
   */
  const handleSubmitAttendance = async ({ file, previewUrl, dataUrl }) => {
    // Merge dữ liệu từ params và capturedEvidence
    const payload = {
      file: file ?? capturedEvidence?.file ?? null,
      previewUrl: previewUrl ?? capturedEvidence?.previewUrl ?? null,
      dataUrl: dataUrl ?? capturedEvidence?.dataUrl ?? null,
    };

    // Validate: phải có ảnh
    if (!payload.file) {
      openToast({ message: 'Không tìm thấy ảnh điểm danh. Vui lòng thử lại.', variant: 'danger' });
      return;
    }

    // Chuyển file sang dataUrl nếu chưa có
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

    dispatch({ type: 'SET', payload: { isAttendanceSubmitting: true } });
    try {
      // Phân tích khuôn mặt nếu phương thức điểm danh là 'photo'
      let faceDescriptorPayload = null;
      let faceAnalysisError = null;
      if (attendanceMethod === 'photo') {
        try {
          const descriptor = await computeDescriptorFromDataUrl(evidenceDataUrl);
          if (descriptor && descriptor.length) {
            faceDescriptorPayload = descriptor;
          } else {
            faceAnalysisError = 'NO_FACE_DETECTED';
          }
        } catch (error) {
          console.error('Không thể phân tích khuôn mặt', error);
          faceAnalysisError = 'ANALYSIS_FAILED';
        }
      }

      // Gọi API điểm danh
      const result = await onConfirmPresent?.({
        activity,
        file: payload.file,
        previewUrl: payload.previewUrl,
        dataUrl: evidenceDataUrl,
        phase: phaseToSend,
        faceDescriptor: faceDescriptorPayload,
        faceError: !faceDescriptorPayload ? faceAnalysisError : undefined,
      });

      // Đóng modal và reset ảnh
      dispatch({ type: 'SET', payload: { checkModalOpen: false } });
      dispatch({ type: 'RESET_CAPTURED' });

      // Hiển thị toast thành công
      const fallbackMessage =
        phaseToSend === 'checkout' ? 'Gửi điểm danh cuối giờ thành công!' : 'Gửi điểm danh đầu giờ thành công!';
      const responseMessage = result?.message || fallbackMessage;
      const normalizedMessage = responseMessage.toLowerCase();
      const toastVariant = normalizedMessage.includes('vắng') ? 'warning' : 'success';
      openToast({
        message: responseMessage,
        variant: toastVariant,
      });

      // Cập nhật state dựa trên response từ API
      const updatedActivity = result?.activity;
      const nextPhaseFromApi = updatedActivity?.registration?.attendanceSummary?.nextPhase;
      const nextCheckoutAvailableAt = updatedActivity?.registration?.attendanceSummary?.checkoutAvailableAt;
      const nextState = updatedActivity?.state || (phaseToSend === 'checkin' ? 'check_out' : 'ended');
      const nextAttendanceStep = nextPhaseFromApi || (phaseToSend === 'checkin' ? 'checkout' : 'checkin');

      // Tính toán thời điểm checkout khả dụng
      const nextCheckoutAvailable = nextCheckoutAvailableAt
        ? Date.now() >= new Date(nextCheckoutAvailableAt).getTime()
        : phaseToSend === 'checkin'
          ? checkoutAvailableTimestamp
            ? Date.now() >= checkoutAvailableTimestamp
            : true
          : true;

      checkoutReminderShownRef.current = phaseToSend !== 'checkin';

      // Dispatch state mới
      dispatch({
        type: 'SET',
        payload: {
          attendanceStep: nextAttendanceStep,
          checkoutAvailable: nextCheckoutAvailable,
          uiState: nextState,
        },
      });
      onStateChange?.(nextState);
    } catch (error) {
      // Bỏ qua nếu người dùng chủ động hủy
      if (error?.message === 'ATTENDANCE_ABORTED') return;
      openToast({ message: 'Điểm danh thất bại. Thử lại sau nhé.', variant: 'danger' });
    } finally {
      dispatch({ type: 'SET', payload: { isAttendanceSubmitting: false } });
    }
  };

  // ==== Feedback handlers ====

  // Mở modal gửi phản hồi điểm CTXH
  const handleOpenFeedback = () => {
    dispatch({ type: 'SET', payload: { feedbackModalOpen: true } });
  };

  // Đóng modal phản hồi
  const handleCloseFeedback = () => dispatch({ type: 'SET', payload: { feedbackModalOpen: false } });

  /**
   * Xử lý gửi phản hồi điểm CTXH.
   * Gửi nội dung, files minh chứng và flag xác nhận lên server.
   */
  const handleSubmitFeedback = async ({ content, files, confirm }) => {
    dispatch({ type: 'SET', payload: { isFeedbackSubmitting: true } });
    try {
      await onSendFeedback?.({ activity, content, files, confirm });
      dispatch({ type: 'SET', payload: { isFeedbackSubmitting: false, feedbackModalOpen: false } });
      onStateChange?.('feedback_reviewing'); // Chuyển sang trạng thái chờ duyệt
      openToast({ message: 'Đã gửi phản hồi. Vui lòng chờ duyệt!', variant: 'success' });
    } catch {
      openToast({ message: 'Gửi phản hồi thất bại. Thử lại sau nhé.', variant: 'danger' });
      dispatch({ type: 'SET', payload: { isFeedbackSubmitting: false } });
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
    checkIn: 'Tham gia',
    checkOut: 'Tham gia',
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
          status: pill('• Đã đăng ký', 'success'),
          buttons: [btn(L.details, openDetails), btn(L.cancel, handleOpenCancel, { variant: 'danger' })],
        };
      case 'checkin':
        return {
          buttons: [btn(L.details, openDetails), btn(L.checkin, () => onCheckin?.(activity), { variant: 'primary' })],
        };
      case 'completed':
        return {
          buttons: [
            btn(L.details, openDetails),
            btn(L.complete, () => onComplete?.(activity), { variant: 'success', disabled: true }),
          ],
        };
      case 'canceled':
        return {
          buttons: [btn(L.details, openDetails), btn(L.canceled, () => {}, { variant: 'muted', disabled: true })],
        };
      case 'attendance_closed':
        return {
          buttons: [
            btn(L.details, openDetails, { variant: 'outline' }),
            btn(L.closed, () => {}, { variant: 'muted', disabled: true }),
          ],
        };
      case 'check_in':
        if (hasCheckin && !hasCheckout) {
          return {
            status: isCheckoutReady
              ? pill('• Sẵn sàng điểm danh cuối giờ', 'success')
              : pill('• Đã điểm danh đầu giờ', 'warning'),
            buttons: [
              btn(L.details, openDetails, { variant: 'outline' }),
              btn(L.checkin, () => {}, {
                variant: 'muted',
                disabled: true,
              }),
            ],
          };
        }

        return {
          buttons: [
            btn(L.details, openDetails, { variant: 'outline' }),
            btn(L.checkin, () => handleOpenAttendance('checkin'), {
              variant: 'primary',
              disabled: isAttendanceBusy,
            }),
          ],
        };
      case 'check_out':
        return {
          status: !isCheckoutReady ? pill('• Chưa mở điểm danh', 'warning') : undefined,
          buttons: [
            btn(L.details, openDetails, { variant: 'outline' }),
            btn(L.checkin, () => handleOpenAttendance('checkout'), {
              variant: 'primary',
              disabled: isAttendanceBusy || !isCheckoutReady,
            }),
          ],
        };
      case 'ended':
        return {
          buttons: [btn(L.details, openDetails, { variant: 'outline', fullWidth: true })],
        };
      case 'feedback_waiting':
        return {
          status: pill(L.waitingFeedback, 'warning'),
          buttons: [btn(L.details, openDetails), btn(L.processing, () => {}, { variant: 'muted', disabled: true })],
        };
      case 'attendance_review':
        return {
          status: pill('• Chờ mở phản hồi', 'warning'),
          buttons: [btn(L.details, openDetails), btn(L.processing, () => {}, { variant: 'muted', disabled: true })],
        };
      case 'feedback_closed':
        return {
          status: pill('• Hết hạn phản hồi', 'muted'),
          buttons: [btn(L.details, openDetails), btn('Đã hết hạn', () => {}, { variant: 'muted', disabled: true })],
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
        <img src={coverImage || fallbackImage} alt={title} className={cx('activity-card__img')} />{' '}
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

      {/* Modal đăng ký hoạt động */}
      <RegisterModal
        open={registerModalOpen}
        onCancel={handleCloseRegister}
        onConfirm={handleConfirmRegister}
        variant={modalVariant}
        campaignName={title}
        confirmLoading={isRegisterProcessing}
        groupLabel={normalizedGroupLabel}
        pointsLabel={points != null ? `${points} điểm` : undefined}
        dateTime={dateTime}
        location={location}
        registrationDeadline={formattedRegistrationDeadline}
        cancellationDeadline={formattedCancellationDeadline}
        attendanceMethod={attendanceMethod}
        attendanceMethodLabel={attendanceMethodLabel}
        showConflictAlert={hasScheduleConflict}
        {...registerModalProps}
      />

      {/* Modal điểm danh hoạt động (checkin/checkout) */}
      <AttendanceModal
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

      {/* Modal phản hồi (chỉ mở khi hệ thống chưa cộng điểm trong vòng 1-2 ngày) */}
      <FeedbackModal
        open={feedbackModalOpen}
        onSubmit={handleSubmitFeedback}
        onCancel={handleCloseFeedback}
        campaignName={title}
        groupLabel={normalizedGroupLabel}
        pointsLabel="Chưa được cộng điểm"
        checkinTime={feedbackCheckinTime}
        checkoutTime={feedbackCheckoutTime}
        submitLoading={isFeedbackSubmitting}
      />
    </div>
  );
}

export default CardActivity;
