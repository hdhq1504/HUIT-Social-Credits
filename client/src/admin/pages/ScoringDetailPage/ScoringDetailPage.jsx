import React, { useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Modal, Spin, Empty } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Camera, CheckCircle2, Clock3, ShieldCheck, Undo2, XCircle } from 'lucide-react';
import styles from './ScoringDetailPage.module.scss';
import registrationsApi, {
  ADMIN_REGISTRATION_DETAIL_QUERY_KEY,
  ADMIN_REGISTRATIONS_QUERY_KEY,
} from '@/api/registrations.api';
import { ROUTE_PATHS } from '@/config/routes.config';
import useToast from '@/components/Toast/Toast';

const cx = classNames.bind(styles);

const stageOrder = ['submitted', 'pending', 'approved'];
const stageDefinitions = [
  { key: 'submitted', label: 'Đã gửi minh chứng', icon: Camera },
  { key: 'pending', label: 'Đang chấm điểm', icon: Clock3 },
  { key: 'approved', label: 'Đã duyệt', icon: CheckCircle2 },
];

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

const resolveStatusKey = (status) => {
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
      status:
        entry.status === 'DA_THAM_GIA'
          ? 'approved'
          : entry.status === 'VANG_MAT'
            ? 'rejected'
            : 'pending',
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
      status:
        record.status === 'DA_THAM_GIA'
          ? 'approved'
          : record.status === 'VANG_MAT'
            ? 'rejected'
            : 'pending',
    });
  }

  return entries.sort((a, b) => a.timestamp - b.timestamp);
};

function ScoringDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { contextHolder, open: openToast } = useToast();

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

  const handleBack = useCallback(() => {
    navigate(ROUTE_PATHS.ADMIN.SCORING);
  }, [navigate]);

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

  const statusKey = resolveStatusKey(record?.status);
  const activeStageIndex = useMemo(() => {
    const normalizedStage = statusKey === 'rejected' ? 'pending' : statusKey;
    const index = stageOrder.indexOf(normalizedStage || 'submitted');
    return index === -1 ? 0 : index;
  }, [statusKey]);

  const attendanceMap = useMemo(() => buildAttendanceMap(record?.attendanceHistory), [record?.attendanceHistory]);
  const historyEntries = useMemo(() => buildHistoryEntries(record), [record]);

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

  return (
    <section className={cx('scoring-detail-page')}>
      {contextHolder}

      <nav className={cx('scoring-detail-page__breadcrumb')} aria-label="Breadcrumb">
        <Link to={ROUTE_PATHS.ADMIN.DASHBOARD}>Trang chủ</Link>
        <span>/</span>
        <Link to={ROUTE_PATHS.ADMIN.SCORING}>Điểm &amp; Minh chứng</Link>
        <span>/</span>
        <span>{student.name || 'Chi tiết minh chứng'}</span>
      </nav>

      <header className={cx('scoring-detail-page__header')}>
        <div className={cx('scoring-detail-page__header-left')}>
          <button type="button" className={cx('scoring-detail-page__back-button')} onClick={handleBack}>
            <Undo2 size={18} /> Trở lại danh sách
          </button>
          <h1 className={cx('scoring-detail-page__title')}>{activity.title || 'Minh chứng điểm danh'}</h1>
          <p className={cx('scoring-detail-page__subtitle')}>
            Minh chứng của sinh viên {student.name || 'Sinh viên'} - MSSV {student.studentCode || '---'}. Đăng ký lúc{' '}
            {formatDateTime(record.registeredAt)}.
          </p>
        </div>

        <div className={cx('scoring-detail-page__header-actions')}>
          <button type="button" className={cx('scoring-detail-page__stage-button')} disabled>
            <ShieldCheck size={18} /> In hồ sơ
          </button>
          <button
            type="button"
            className={cx('scoring-detail-page__stage-button', 'scoring-detail-page__stage-button--danger')}
            onClick={handleReject}
            disabled={decideMutation.isLoading || statusKey === 'approved'}
          >
            <XCircle size={18} /> Không đạt
          </button>
          <button
            type="button"
            className={cx('scoring-detail-page__stage-button', 'scoring-detail-page__stage-button--primary')}
            onClick={handleApprove}
            disabled={decideMutation.isLoading || statusKey === 'approved'}
          >
            <CheckCircle2 size={18} /> Duyệt đạt
          </button>
        </div>
      </header>

      <div className={cx('scoring-detail-page__stages')}>
        {stageDefinitions.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = index <= activeStageIndex;
          return (
            <div
              key={stage.key}
              className={cx('scoring-detail-page__stage', {
                'scoring-detail-page__stage--active': isActive,
              })}
            >
              <span className={cx('scoring-detail-page__stage-icon')}>
                <Icon size={18} />
              </span>
              <span className={cx('scoring-detail-page__stage-label')}>{stage.label}</span>
            </div>
          );
        })}
      </div>

      <div className={cx('scoring-detail-page__grid')}>
        <section className={cx('scoring-detail-page__card', 'scoring-detail-page__card--activity')}>
          <header className={cx('scoring-detail-page__card-header')}>
            <div>
              <h2 className={cx('scoring-detail-page__card-title')}>Thông tin hoạt động</h2>
              <p className={cx('scoring-detail-page__card-subtitle')}>
                Hoạt động diễn ra vào {formatDateTime(activity.startTime)}
                {activity.endTime ? ` và kết thúc ${formatDateTime(activity.endTime)}` : ''}. Phương thức điểm danh:{' '}
                {activity.attendanceMethodLabel || '---'}.
              </p>
            </div>
            <span className={cx('scoring-detail-page__points-badge')}>+{points} điểm CTXH</span>
          </header>

          <div className={cx('scoring-detail-page__info-grid')}>
            <div className={cx('scoring-detail-page__info-item')}>
              <span className={cx('scoring-detail-page__info-label')}>Địa điểm</span>
              <span className={cx('scoring-detail-page__info-value')}>{activity.location || '---'}</span>
            </div>
            <div className={cx('scoring-detail-page__info-item')}>
              <span className={cx('scoring-detail-page__info-label')}>Thời gian bắt đầu</span>
              <span className={cx('scoring-detail-page__info-value')}>{formatDateTime(activity.startTime)}</span>
            </div>
            <div className={cx('scoring-detail-page__info-item')}>
              <span className={cx('scoring-detail-page__info-label')}>Thời gian kết thúc</span>
              <span className={cx('scoring-detail-page__info-value')}>{formatDateTime(activity.endTime)}</span>
            </div>
          </div>
        </section>

        <section className={cx('scoring-detail-page__card', 'scoring-detail-page__card--student')}>
          <header className={cx('scoring-detail-page__card-header')}>
            <div>
              <h2 className={cx('scoring-detail-page__card-title')}>Thông tin sinh viên</h2>
              <p className={cx('scoring-detail-page__card-subtitle')}>
                Hồ sơ điểm rèn luyện và thông tin liên hệ của sinh viên tham gia hoạt động.
              </p>
            </div>
          </header>

          <div className={cx('scoring-detail-page__student')}>
            <img
              src={student.avatarUrl || 'https://placehold.co/120x120/eeee/000?text=SV'}
              alt={student.name || 'Sinh viên'}
              className={cx('scoring-detail-page__student-avatar')}
            />
            <div className={cx('scoring-detail-page__student-meta')}>
              <h3>{student.name || 'Sinh viên'}</h3>
              <span>MSSV: {student.studentCode || '---'}</span>
              <span>Lớp: {student.className || '---'}</span>
              <span>Khoa: {student.faculty || '---'}</span>
              <span>Email: {student.email || '---'}</span>
              <span>Số điện thoại: {student.phone || '---'}</span>
            </div>
          </div>
        </section>
      </div>

      <section className={cx('scoring-detail-page__card')}>
        <header className={cx('scoring-detail-page__card-header')}>
          <div>
            <h2 className={cx('scoring-detail-page__card-title')}>Kết quả điểm danh</h2>
            <p className={cx('scoring-detail-page__card-subtitle')}>
              Minh chứng điểm danh được hệ thống ghi nhận và chờ xác minh bởi admin.
            </p>
          </div>
        </header>

        <div className={cx('scoring-detail-page__attendance-grid')}>
          {[
            { key: 'checkin', label: 'Check-in' },
            { key: 'checkout', label: 'Check-out' },
          ].map((item) => {
            const attendance = attendanceMap[item.key];
            const tone = getAttendanceTone(attendance?.statusLabel || attendance?.status);
            return (
              <div key={item.key} className={cx('scoring-detail-page__attendance-item')}>
                <div className={cx('scoring-detail-page__attendance-header')}>
                  <span className={cx('scoring-detail-page__attendance-title')}>{item.label}</span>
                  <span
                    className={cx(
                      'scoring-detail-page__attendance-status',
                      `scoring-detail-page__attendance-status--${tone}`,
                    )}
                  >
                    {attendance?.statusLabel || attendance?.status || 'Chưa cập nhật'}
                  </span>
                </div>
                <p className={cx('scoring-detail-page__attendance-time')}>{formatDateTime(attendance?.capturedAt)}</p>
                <p className={cx('scoring-detail-page__attendance-note')}>{attendance?.note || 'Không có ghi chú'}</p>
                {attendance?.attachmentUrl && (
                  <figure className={cx('scoring-detail-page__attendance-media')}>
                    <img src={attendance.attachmentUrl} alt={`Minh chứng ${item.label}`} />
                    <figcaption>Ảnh minh chứng {item.label}</figcaption>
                  </figure>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className={cx('scoring-detail-page__card')}>
        <header className={cx('scoring-detail-page__card-header')}>
          <div>
            <h2 className={cx('scoring-detail-page__card-title')}>Lịch sử xử lý minh chứng</h2>
            <p className={cx('scoring-detail-page__card-subtitle')}>
              Theo dõi các bước xử lý minh chứng từ sinh viên và hệ thống.
            </p>
          </div>
        </header>

        <div className={cx('scoring-detail-page__history-wrapper')}>
          <table className={cx('scoring-detail-page__history-table')}>
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
                      <span
                        className={cx(
                          'scoring-detail-page__history-status',
                          `scoring-detail-page__history-status--${tone}`,
                        )}
                      >
                        {label}
                      </span>
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
