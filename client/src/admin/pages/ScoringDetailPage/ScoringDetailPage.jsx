import React, { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Camera, CheckCircle2, Clock3, ShieldCheck, Undo2, XCircle } from 'lucide-react';
import styles from './ScoringDetailPage.module.scss';
import { getScoringDetailRecord } from './ScoringDetailPageData';
import { ROUTE_PATHS } from '@/config/routes.config';

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
  if (normalized.includes('đúng')) return 'success';
  if (normalized.includes('trễ')) return 'warning';
  if (normalized.includes('vắng') || normalized.includes('không')) return 'danger';
  return 'neutral';
};

function ScoringDetailPage() {
  const { id = 'record-1' } = useParams();
  const navigate = useNavigate();
  const record = useMemo(() => getScoringDetailRecord(id), [id]);

  const activeStageIndex = useMemo(() => {
    const normalizedStage = record?.statusKey === 'rejected' ? 'pending' : record?.statusKey;
    const index = stageOrder.indexOf(normalizedStage || 'submitted');
    if (index === -1) return 0;
    return index;
  }, [record?.statusKey]);

  const handleBack = () => {
    navigate(ROUTE_PATHS.ADMIN.SCORING);
  };

  return (
    <section className={cx('scoring-detail-page')}>
      <nav className={cx('scoring-detail-page__breadcrumb')} aria-label="Breadcrumb">
        <Link to={ROUTE_PATHS.ADMIN.DASHBOARD}>Trang chủ</Link>
        <span>/</span>
        <Link to={ROUTE_PATHS.ADMIN.SCORING}>Điểm &amp; Minh chứng</Link>
        <span>/</span>
        <span>{record.student?.name || 'Chi tiết minh chứng'}</span>
      </nav>

      <header className={cx('scoring-detail-page__header')}>
        <div className={cx('scoring-detail-page__header-left')}>
          <button type="button" className={cx('scoring-detail-page__back-button')} onClick={handleBack}>
            <Undo2 size={18} /> Trở lại danh sách
          </button>
          <h1 className={cx('scoring-detail-page__title')}>{record.activity?.title}</h1>
          <p className={cx('scoring-detail-page__subtitle')}>
            Minh chứng của sinh viên {record.student?.name} - MSSV {record.student?.studentId}. Được gửi lúc{' '}
            {record.submittedAt}.
          </p>
        </div>

        <div className={cx('scoring-detail-page__header-actions')}>
          <button type="button" className={cx('scoring-detail-page__stage-button')}>
            <ShieldCheck size={18} /> In hồ sơ
          </button>
          <button type="button" className={cx('scoring-detail-page__stage-button', 'scoring-detail-page__stage-button--danger')}>
            <XCircle size={18} /> Không đạt
          </button>
          <button type="button" className={cx('scoring-detail-page__stage-button', 'scoring-detail-page__stage-button--primary')}>
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
                Hoạt động thuộc {record.activity?.organization}. Thời gian từ {record.activity?.startTime} đến{' '}
                {record.activity?.endTime}.
              </p>
            </div>
            <span className={cx('scoring-detail-page__points-badge')}>+{record.points} điểm CTXH</span>
          </header>

          <div className={cx('scoring-detail-page__info-grid')}>
            <div className={cx('scoring-detail-page__info-item')}>
              <span className={cx('scoring-detail-page__info-label')}>Loại hoạt động</span>
              <span className={cx('scoring-detail-page__info-value')}>{record.activity?.type}</span>
            </div>
            <div className={cx('scoring-detail-page__info-item')}>
              <span className={cx('scoring-detail-page__info-label')}>Đơn vị phụ trách</span>
              <span className={cx('scoring-detail-page__info-value')}>{record.activity?.organization}</span>
            </div>
            <div className={cx('scoring-detail-page__info-item')}>
              <span className={cx('scoring-detail-page__info-label')}>Địa điểm</span>
              <span className={cx('scoring-detail-page__info-value')}>
                {record.activity?.location}
                {record.activity?.room ? ` · ${record.activity?.room}` : ''}
              </span>
            </div>
            <div className={cx('scoring-detail-page__info-item')}>
              <span className={cx('scoring-detail-page__info-label')}>Người phụ trách</span>
              <span className={cx('scoring-detail-page__info-value')}>{record.activity?.supervisor}</span>
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
            <img src={record.student?.avatar} alt={record.student?.name} className={cx('scoring-detail-page__student-avatar')} />
            <div className={cx('scoring-detail-page__student-meta')}>
              <h3>{record.student?.name}</h3>
              <span>MSSV: {record.student?.studentId}</span>
              <span>Lớp: {record.student?.className}</span>
              <span>Khoa: {record.student?.faculty}</span>
              <span>Khoá: {record.student?.course}</span>
              <span>Email: {record.student?.email}</span>
              <span>Số điện thoại: {record.student?.phone}</span>
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
          {['checkIn', 'checkOut'].map((key) => {
            const attendance = record.attendance?.[key];
            const tone = getAttendanceTone(attendance?.status);
            return (
              <div key={key} className={cx('scoring-detail-page__attendance-item')}>
                <div className={cx('scoring-detail-page__attendance-header')}>
                  <span className={cx('scoring-detail-page__attendance-title')}>
                    {key === 'checkIn' ? 'Check-in' : 'Check-out'}
                  </span>
                  <span className={cx('scoring-detail-page__attendance-status', `scoring-detail-page__attendance-status--${tone}`)}>
                    {attendance?.status || 'Chưa cập nhật'}
                  </span>
                </div>
                <p className={cx('scoring-detail-page__attendance-time')}>{attendance?.time || '—'}</p>
                <p className={cx('scoring-detail-page__attendance-note')}>{attendance?.note || 'Không có ghi chú'}</p>
                {attendance?.image && (
                  <figure className={cx('scoring-detail-page__attendance-media')}>
                    <img src={attendance.image} alt={`Minh chứng ${key}`} />
                    <figcaption>Ảnh minh chứng {key === 'checkIn' ? 'Check-in' : 'Check-out'}</figcaption>
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
              {record.history?.map((item) => {
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
