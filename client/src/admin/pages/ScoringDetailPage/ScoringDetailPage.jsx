import React, { useCallback, useMemo, useContext, useEffect } from 'react';
import classNames from 'classnames/bind';
import { Modal, Spin, Empty } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faTimesCircle,
  faUserGraduate,
  faCalendarCheck,
  faClipboardCheck,
  faSignInAlt,
  faSignOutAlt,
  faArrowsRotate,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import styles from './ScoringDetailPage.module.scss';
import registrationsApi, {
  ADMIN_REGISTRATION_DETAIL_QUERY_KEY,
  ADMIN_REGISTRATIONS_QUERY_KEY,
} from '@/api/registrations.api';
import { ROUTE_PATHS } from '@/config/routes.config';
import useToast from '@/components/Toast/Toast';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { useParams } from 'react-router-dom';

const cx = classNames.bind(styles);

const historyStatusMap = {
  submitted: { label: 'Đã gửi', tone: 'info' },
  processing: { label: 'Hệ thống xử lý', tone: 'info' },
  pending: { label: 'Đang chờ duyệt', tone: 'warning' },
  approved: { label: 'Đã duyệt', tone: 'success' },
  rejected: { label: 'Từ chối', tone: 'danger' },
};

const getAttendanceTone = (status) => {
  if (!status) return 'neutral';
  const normalized = status.toLowerCase();
  if (normalized.includes('đúng') || normalized.includes('hoàn')) return 'success';
  if (normalized.includes('trễ')) return 'warning';
  if (normalized.includes('vắng') || normalized.includes('không')) return 'danger';
  return 'neutral';
};

const formatDateTime = (value) => {
  if (!value) return '---';
  return dayjs(value).format('HH:mm DD/MM/YYYY');
};

const resolveStatusKey = (status, feedbackStatus) => {
  if (feedbackStatus === 'BI_TU_CHOI') return 'rejected';
  switch (status) {
    case 'DA_THAM_GIA':
      return 'approved';
    case 'VANG_MAT':
      return 'rejected';
    case 'DA_HUY':
      return 'canceled';
    case 'DANG_KY':
    default:
      return 'pending';
  }
};

const buildAttendanceMap = (attendanceHistory = []) =>
  attendanceHistory.reduce(
    (acc, entry) => {
      if (!acc[entry.phase]) {
        acc[entry.phase] = entry;
      }
      return acc;
    },
    { checkin: null, checkout: null },
  );

const buildHistoryEntries = (record) => {
  if (!record) return [];
  const entries = [];

  if (record.registeredAt) {
    entries.push({
      id: `${record.id}-registered`,
      timestamp: dayjs(record.registeredAt).valueOf(),
      time: formatDateTime(record.registeredAt),
      actor: record.student?.name || 'Sinh viên',
      action: 'Đăng ký tham gia hoạt động',
      status: 'submitted',
    });
  }

  (record.attendanceHistory || []).forEach((entry) => {
    entries.push({
      id: entry.id,
      timestamp: entry.capturedAt ? dayjs(entry.capturedAt).valueOf() : 0,
      time: formatDateTime(entry.capturedAt),
      actor: record.student?.name || 'Sinh viên',
      action: entry.phase === 'checkout' ? 'Điểm danh cuối giờ' : 'Điểm danh đầu giờ',
      status: entry.status === 'DA_THAM_GIA' ? 'approved' : entry.status === 'VANG_MAT' ? 'rejected' : 'pending',
    });
  });

  if (record.updatedAt && record.status) {
    entries.push({
      id: `${record.id}-status`,
      timestamp: dayjs(record.updatedAt).valueOf(),
      time: formatDateTime(record.updatedAt),
      actor: 'Quản trị viên',
      action:
        record.status === 'DA_THAM_GIA'
          ? 'Duyệt minh chứng điểm danh'
          : record.status === 'VANG_MAT'
            ? 'Từ chối minh chứng điểm danh'
            : 'Cập nhật minh chứng',
      status: record.status === 'DA_THAM_GIA' ? 'approved' : record.status === 'VANG_MAT' ? 'rejected' : 'pending',
    });
  }

  if (record.feedback?.status === 'BI_TU_CHOI' && record.feedback.updatedAt) {
    entries.push({
      id: `${record.feedback.id}-rejected`,
      timestamp: dayjs(record.feedback.updatedAt).valueOf(),
      time: formatDateTime(record.feedback.updatedAt),
      actor: 'Quản trị viên',
      action: 'Từ chối phản hồi',
      status: 'rejected',
    });
  }

  return entries.sort((a, b) => a.timestamp - b.timestamp);
};

function ScoringDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { contextHolder, open: openToast } = useToast();
  const adminPage = useContext(AdminPageContext);
  const { setPageActions, setBreadcrumbs, setPageTitle } = adminPage || {};

  const registrationId = id;

  const { data, isLoading, isError } = useQuery({
    queryKey: [ADMIN_REGISTRATION_DETAIL_QUERY_KEY, registrationId],
    queryFn: () => registrationsApi.detail(registrationId),
    enabled: !!registrationId,
  });

  const record = data?.registration;

  const decideMutation = useMutation({
    mutationFn: (payload) => registrationsApi.decide(registrationId, payload),
    onSuccess: (response) => {
      openToast({ message: response.message || 'Đã cập nhật minh chứng', variant: 'success' });
      queryClient.invalidateQueries([ADMIN_REGISTRATIONS_QUERY_KEY]);
      queryClient.invalidateQueries([ADMIN_REGISTRATION_DETAIL_QUERY_KEY, registrationId]);
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể cập nhật minh chứng', variant: 'danger' });
    },
  });

  const handleApprove = useCallback(() => {
    decideMutation.mutate({ decision: 'APPROVE' });
  }, [decideMutation]);

  const handleReject = useCallback(() => {
    Modal.confirm({
      title: 'Từ chối minh chứng điểm danh?',
      content: 'Hành động này sẽ ghi nhận sinh viên vắng mặt cho hoạt động này.',
      okText: 'Từ chối',
      okType: 'danger',
      cancelText: 'Huỷ',
      onOk: () => decideMutation.mutate({ decision: 'REJECT' }),
    });
  }, [decideMutation]);

  const statusKey = resolveStatusKey(record?.status, record?.feedback?.status);

  const attendanceMap = useMemo(() => buildAttendanceMap(record?.attendanceHistory), [record?.attendanceHistory]);
  const historyEntries = useMemo(() => buildHistoryEntries(record), [record]);

  useEffect(() => {
    if (!record || !setPageActions || !setBreadcrumbs) return;

    const student = record.student || {};
    const activity = record.activity || {};

    setPageTitle?.('Danh sách chấm điểm CTXH');

    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Điểm & Minh chứng', path: ROUTE_PATHS.ADMIN.SCORING },
      { label: activity.title || 'Hoạt động', path: ROUTE_PATHS.ADMIN.SCORING },
      { label: student.name || 'Sinh viên' },
    ]);

    setPageActions([
      {
        key: 'approve',
        label: 'Duyệt đạt',
        type: 'primary',
        className: 'admin-navbar__btn--success',
        icon: <FontAwesomeIcon icon={faCheckCircle} />,
        onClick: handleApprove,
        loading: decideMutation.isLoading && statusKey === 'approved',
        disabled: decideMutation.isLoading || statusKey === 'approved',
      },
      {
        key: 'reject',
        label: 'Không đạt',
        type: 'danger',
        className: 'admin-navbar__btn--danger',
        icon: <FontAwesomeIcon icon={faTimesCircle} />,
        onClick: handleReject,
        loading: decideMutation.isLoading && statusKey === 'rejected',
        disabled: decideMutation.isLoading || statusKey === 'approved',
      },
    ]);

    return () => {
      setPageActions?.([]);
      setBreadcrumbs?.([]);
      setPageTitle?.('');
    };
  }, [
    record,
    setPageActions,
    setBreadcrumbs,
    setPageTitle,
    handleApprove,
    handleReject,
    decideMutation.isLoading,
    statusKey,
  ]);

  if (isLoading) {
    return (
      <section className={cx('scoring-detail-page')}>
        {contextHolder}
        <div className={cx('scoring-detail-page__loading')}>
          <Spin size="large" />
        </div>
      </section>
    );
  }

  if (isError || !record) {
    return (
      <section className={cx('scoring-detail-page')}>
        {contextHolder}
        <Empty description="Không tìm thấy dữ liệu minh chứng" className={cx('scoring-detail-page__empty')} />
      </section>
    );
  }

  const student = record.student || {};
  const activity = record.activity || {};
  const points = activity.points ?? 0;

  const checkItems = [
    { key: 'checkin', label: 'Check-in' },
    { key: 'checkout', label: 'Check-out' },
  ];

  return (
    <section className={cx('scoring-detail-page')}>
      {contextHolder}

      <div className={cx('scoring-detail-page__layout')}>
        <div className={cx('scoring-detail-page__main')}>
          <section className={cx('card', 'card--activity')}>
            <header className={cx('card__header')}>
              <div className={cx('card__header-text')}>
                <FontAwesomeIcon icon={faCalendarCheck} />
                <h2 className={cx('card__title')}>Thông tin hoạt động</h2>
              </div>
            </header>

            <div className={cx('card__activity-header')}>
              <h3 className={cx('card__activity-title')}>
                {activity.title || 'Hoạt động từ thiện cộng đồng - Trao tặng học bổng'}
              </h3>

              <div className={cx('card__meta-row')}>
                {activity.pointGroupLabel && <span className={cx('card__chip')}>{activity.pointGroupLabel}</span>}

                <span className={cx('card__points-inline')}>
                  <FontAwesomeIcon icon={faStar} />
                  <span>{points} điểm</span>
                </span>
              </div>
            </div>

            <div className={cx('card__body')}>
              <div className={cx('card__info-grid')}>
                <div className={cx('info-block')}>
                  <div className={cx('info-block__label')}>Thời gian</div>
                  <div className={cx('info-block__value')}>
                    {formatDateTime(activity.startTime).slice(0, 5)}
                    {activity.endTime
                      ? ` - ${formatDateTime(activity.endTime).slice(0, 5)}, ${formatDateTime(activity.endTime).slice(6)}`
                      : ''}
                  </div>
                </div>
                <div className={cx('info-block')}>
                  <div className={cx('info-block__label')}>Địa điểm</div>
                  <div className={cx('info-block__value')}>{activity.location || 'Đang cập nhật'}</div>
                </div>
                <div className={cx('info-block')}>
                  <div className={cx('info-block__label')}>Số lượng tham gia</div>
                  <div className={cx('info-block__value')}>
                    {activity.participantCount ?? '--'}/{activity.maxParticipants ?? '--'} sinh viên
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={cx('card', 'card--attendance')}>
            <header className={cx('card__header', 'card__header--attendance')}>
              <div className={cx('card__header-left')}>
                <div className={cx('card__icon-pill', 'card__icon-pill--green')}>
                  <FontAwesomeIcon icon={faClipboardCheck} />
                </div>
                <h2 className={cx('card__title')}>Kết quả điểm danh</h2>
              </div>
              <div className={cx('card__auto-update')}>
                <span className={cx('card__auto-update-label')}>Cập nhật tự động</span>
                <FontAwesomeIcon icon={faArrowsRotate} />
              </div>
            </header>

            <div className={cx('attendance-grid')}>
              {checkItems.map((item) => {
                const attendance = attendanceMap[item.key];
                const tone = getAttendanceTone(attendance?.statusLabel || attendance?.status);
                const statusLabel = attendance?.statusLabel || attendance?.status || 'Chưa cập nhật';

                return (
                  <div key={item.key} className={cx('attendance-card')}>
                    <div className={cx('attendance-card__header')}>
                      <div className={cx('attendance-card__title-wrap')}>
                        <div className={cx('attendance-card__icon')}>
                          <FontAwesomeIcon icon={item.key === 'checkin' ? faSignInAlt : faSignOutAlt} />
                        </div>
                        <span className={cx('attendance-card__title')}>{item.label}</span>
                      </div>
                      <span className={cx('attendance-card__status', `attendance-card__status--${tone}`)}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className={cx('attendance-card__rows')}>
                      <div className={cx('attendance-card__row')}>
                        <span className={cx('attendance-card__row-label')}>Thời gian:</span>
                        <span className={cx('attendance-card__row-value')}>
                          {formatDateTime(attendance?.capturedAt)}
                        </span>
                      </div>
                      <div className={cx('attendance-card__row')}>
                        <span className={cx('attendance-card__row-label')}>Phương thức:</span>
                        <span className={cx('attendance-card__row-value')}>
                          {activity.attendanceMethodLabel || '---'}
                        </span>
                      </div>
                    </div>

                    <div className={cx('attendance-card__evidence')}>
                      <div className={cx('attendance-card__evidence-label')}>Ảnh minh chứng</div>
                      {attendance?.attachmentUrl ? (
                        <figure className={cx('attendance-card__media')}>
                          <img src={attendance.attachmentUrl} alt={`Minh chứng ${item.label}`} />
                        </figure>
                      ) : (
                        <div className={cx('attendance-card__media', 'attendance-card__media--placeholder')}>
                          <span>Chưa có minh chứng</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className={cx('scoring-detail-page__sidebar')}>
          <section className={cx('card', 'card--student')}>
            <header className={cx('card__header')}>
              <div className={cx('card__header-left')}>
                <div className={cx('card__icon-pill', 'card__icon-pill--primary')}>
                  <FontAwesomeIcon icon={faUserGraduate} />
                </div>
                <h2 className={cx('card__title')}>Thông tin sinh viên</h2>
              </div>
            </header>

            <div className={cx('student-summary')}>
              <div className={cx('student-summary__avatar-wrap')}>
                <img
                  src={student.avatarUrl || 'https://placehold.co/200x200?text=SV'}
                  alt={student.name || 'Sinh viên'}
                  className={cx('student-summary__avatar')}
                />
              </div>
            </div>

            <div className={cx('student-grid')}>
              <div className={cx('field')}>
                <span className={cx('field__label')}>Họ và tên</span>
                <span className={cx('field__value')}>{student.name || '--'}</span>
              </div>
              <div className={cx('field')}>
                <span className={cx('field__label')}>Mã sinh viên</span>
                <span className={cx('field__value')}>{student.studentCode || '--'}</span>
              </div>
              <div className={cx('field')}>
                <span className={cx('field__label')}>Khoa</span>
                <span className={cx('field__value')}>{student.faculty || '--'}</span>
              </div>
              <div className={cx('field')}>
                <span className={cx('field__label')}>Lớp</span>
                <span className={cx('field__value')}>{student.className || '--'}</span>
              </div>
              <div className={cx('field')}>
                <span className={cx('field__label')}>Số điện thoại</span>
                <span className={cx('field__value')}>{student.phone || '--'}</span>
              </div>
              <div className={cx('field', 'field--full')}>
                <span className={cx('field__label')}>Email</span>
                <span className={cx('field__value')}>{student.email || '--'}</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section className={cx('card', 'card--history')}>
        <header className={cx('card__header')}>
          <h2 className={cx('card__title')}>Lịch sử xử lý minh chứng</h2>
        </header>

        <div className={cx('history-wrapper')}>
          <table className={cx('history-table')}>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người thực hiện</th>
                <th>Hành động</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {historyEntries.map((item) => {
                const tone = historyStatusMap[item.status]?.tone || 'info';
                const label = historyStatusMap[item.status]?.label || 'Đang xử lý';
                return (
                  <tr key={item.id}>
                    <td>{item.time}</td>
                    <td>{item.actor}</td>
                    <td>{item.action}</td>
                    <td>
                      <span className={cx('history-status', `history-status--${tone}`)}>{label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default ScoringDetailPage;
