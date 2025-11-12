import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Pagination, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CheckCircle2, Clock3, Filter, Search, Users, XCircle } from 'lucide-react';
import styles from './ScoringPage.module.scss';
import registrationsApi, { ADMIN_REGISTRATIONS_QUERY_KEY } from '@/api/registrations.api';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import useToast from '@/components/Toast/Toast';

const cx = classNames.bind(styles);
const PAGE_SIZE = 10;

const statusDefinitions = [
  { value: 'all', label: 'Tất cả hồ sơ', description: 'Tổng', icon: Users },
  { value: 'pending', label: 'Chờ duyệt', description: 'Đã gửi minh chứng', icon: Clock3 },
  { value: 'approved', label: 'Đạt', description: 'Đã duyệt điểm', icon: CheckCircle2 },
  { value: 'rejected', label: 'Không đạt', description: 'Bị từ chối', icon: XCircle },
];

const getCheckStatusClass = (status) => {
  if (!status) return 'scoring-page__check-status';
  const normalized = status.toLowerCase();
  if (normalized.includes('đúng')) return 'scoring-page__check-status scoring-page__check-status--success';
  if (normalized.includes('trễ')) return 'scoring-page__check-status scoring-page__check-status--warning';
  if (normalized.includes('vắng') || normalized.includes('không')) {
    return 'scoring-page__check-status scoring-page__check-status--danger';
  }
  if (normalized.includes('hoàn')) {
    return 'scoring-page__check-status scoring-page__check-status--success';
  }
  return 'scoring-page__check-status';
};

const formatDateTime = (value) => {
  if (!value) return '---';
  return dayjs(value).format('HH:mm DD/MM/YYYY');
};

const formatActivityRange = (activity) => {
  if (!activity) return '---';
  const start = activity.startTime ? dayjs(activity.startTime) : null;
  const end = activity.endTime ? dayjs(activity.endTime) : null;
  if (start && end) {
    const sameDay = start.isSame(end, 'day');
    if (sameDay) {
      return `${start.format('DD/MM/YYYY')} · ${start.format('HH:mm')} - ${end.format('HH:mm')}`;
    }
    return `${start.format('DD/MM/YYYY HH:mm')} - ${end.format('DD/MM/YYYY HH:mm')}`;
  }
  if (start) return start.format('DD/MM/YYYY HH:mm');
  if (end) return end.format('DD/MM/YYYY HH:mm');
  return '---';
};

const resolveStatusKey = (status) => {
  switch (status) {
    case 'DA_THAM_GIA':
      return 'approved';
    case 'VANG_MAT':
      return 'rejected';
    case 'DA_HUY':
      return 'canceled';
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

function ScoringPage() {
  const navigate = useNavigate();
  const { contextHolder, open: openToast } = useToast();
  const [filters, setFilters] = useState({
    status: 'all',
    faculty: 'all',
    className: 'all',
    activity: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      pageSize: PAGE_SIZE,
      status: filters.status !== 'all' ? filters.status : undefined,
      faculty: filters.faculty !== 'all' ? filters.faculty : undefined,
      className: filters.className !== 'all' ? filters.className : undefined,
      activityId: filters.activity !== 'all' ? filters.activity : undefined,
      search: searchTerm || undefined,
    }),
    [currentPage, filters, searchTerm],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [ADMIN_REGISTRATIONS_QUERY_KEY, queryParams],
    queryFn: () => registrationsApi.list(queryParams),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (isError && error) {
      openToast({
        message: error.response?.data?.error || 'Không thể tải dữ liệu minh chứng',
        variant: 'danger',
      });
    }
  }, [isError, error, openToast]);

  const filterOptions = data?.filterOptions ?? {};
  const faculties = useMemo(
    () => ['all', ...(filterOptions.faculties ?? [])],
    [filterOptions.faculties],
  );
  const classes = useMemo(
    () => ['all', ...(filterOptions.classes ?? [])],
    [filterOptions.classes],
  );
  const activities = useMemo(() => filterOptions.activities ?? [], [filterOptions.activities]);

  const stats = useMemo(
    () => ({
      total: data?.stats?.total ?? 0,
      pending: data?.stats?.pending ?? 0,
      approved: data?.stats?.approved ?? 0,
      rejected: data?.stats?.rejected ?? 0,
    }),
    [data?.stats?.total, data?.stats?.pending, data?.stats?.approved, data?.stats?.rejected],
  );

  const statusCounts = useMemo(
    () => ({
      all: stats.total,
      pending: stats.pending,
      approved: stats.approved,
      rejected: stats.rejected,
    }),
    [stats],
  );

  const registrations = useMemo(() => data?.registrations ?? [], [data?.registrations]);
  const pagination = data?.pagination ?? { page: currentPage, pageSize: PAGE_SIZE, total: 0 };
  const totalItems = pagination.total ?? 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.faculty, filters.className, filters.activity, searchTerm]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => registrations.some((item) => item.id === id)));
  }, [registrations]);

  const handleStatusChange = useCallback((value) => {
    setFilters((prev) => ({ ...prev, status: value }));
  }, []);

  const handleFilterChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setSearchTerm(keywordInput.trim());
  }, [keywordInput]);

  const handleResetFilters = useCallback(() => {
    setFilters({ status: 'all', faculty: 'all', className: 'all', activity: 'all' });
    setKeywordInput('');
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handleSelectRow = useCallback((id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = registrations.map((item) => item.id);
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  }, [registrations]);

  const handleClearSelection = useCallback(() => setSelectedIds([]), []);

  const allSelected = registrations.length > 0 && selectedIds.length === registrations.length;
  const startIndex = (pagination.page - 1) * pagination.pageSize;

  return (
    <section className={cx('scoring-page')}>
      {contextHolder}

      <nav className={cx('scoring-page__breadcrumb')} aria-label="Breadcrumb">
        <Link to={ROUTE_PATHS.ADMIN.DASHBOARD}>Trang chủ</Link>
        <span>/</span>
        <Link to={ROUTE_PATHS.ADMIN.SCORING}>Điểm &amp; Minh chứng</Link>
        <span>/</span>
        <span>Danh sách minh chứng</span>
      </nav>

      <header className={cx('scoring-page__header')}>
        <div>
          <h1 className={cx('scoring-page__title')}>Danh sách điểm minh chứng CTXH</h1>
          <p className={cx('scoring-page__subtitle')}>
            Theo dõi trạng thái xét duyệt điểm rèn luyện và quản lý minh chứng của sinh viên.
          </p>
        </div>
        <div className={cx('scoring-page__status-summary')}>
          {statusDefinitions.map((status) => {
            const Icon = status.icon;
            const count = status.value === 'all' ? statusCounts.all : statusCounts[status.value] || 0;
            const isActive = filters.status === status.value;
            return (
              <button
                key={status.value}
                type="button"
                className={cx('scoring-page__status-pill', {
                  'scoring-page__status-pill--active': isActive,
                  [`scoring-page__status-pill--${status.value}`]: true,
                })}
                onClick={() => handleStatusChange(status.value)}
              >
                <span className={cx('scoring-page__status-icon')}>
                  <Icon size={18} />
                </span>
                <span className={cx('scoring-page__status-meta')}>
                  <span className={cx('scoring-page__status-label')}>{status.label}</span>
                  <span className={cx('scoring-page__status-description')}>
                    {count} {status.value === 'all' ? 'hồ sơ' : 'hồ sơ'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <div className={cx('scoring-page__filters')}>
        <div className={cx('scoring-page__filter-group')}>
          <label className={cx('scoring-page__filter-label')} htmlFor="scoring-filter-faculty">
            Khoa
          </label>
          <select
            id="scoring-filter-faculty"
            className={cx('scoring-page__filter-control')}
            value={filters.faculty}
            onChange={(event) => handleFilterChange('faculty', event.target.value)}
          >
            {faculties.map((faculty) => (
              <option key={faculty} value={faculty}>
                {faculty === 'all' ? 'Tất cả khoa' : faculty}
              </option>
            ))}
          </select>
        </div>

        <div className={cx('scoring-page__filter-group')}>
          <label className={cx('scoring-page__filter-label')} htmlFor="scoring-filter-class">
            Lớp
          </label>
          <select
            id="scoring-filter-class"
            className={cx('scoring-page__filter-control')}
            value={filters.className}
            onChange={(event) => handleFilterChange('className', event.target.value)}
          >
            {classes.map((className) => (
              <option key={className} value={className}>
                {className === 'all' ? 'Tất cả lớp' : className}
              </option>
            ))}
          </select>
        </div>

        <div className={cx('scoring-page__filter-group')}>
          <label className={cx('scoring-page__filter-label')} htmlFor="scoring-filter-activity">
            Hoạt động
          </label>
          <select
            id="scoring-filter-activity"
            className={cx('scoring-page__filter-control')}
            value={filters.activity}
            onChange={(event) => handleFilterChange('activity', event.target.value)}
          >
            <option key="all" value="all">
              Tất cả hoạt động
            </option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.title}
              </option>
            ))}
          </select>
        </div>

        <div className={cx('scoring-page__filter-group', 'scoring-page__filter-group--search')}>
          <label className={cx('scoring-page__filter-label')} htmlFor="scoring-filter-search">
            Từ khóa
          </label>
          <div className={cx('scoring-page__filter-search')}>
            <span className={cx('scoring-page__filter-search-icon')}>
              <Search size={18} />
            </span>
            <input
              id="scoring-filter-search"
              className={cx('scoring-page__filter-input')}
              placeholder="Nhập tên sinh viên, MSSV hoặc hoạt động"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleApplyFilters();
                }
              }}
            />
          </div>
        </div>

        <div className={cx('scoring-page__filter-actions')}>
          <button type="button" className={cx('scoring-page__filter-button', 'scoring-page__filter-button--ghost')} onClick={handleResetFilters}>
            Đặt lại
          </button>
          <button type="button" className={cx('scoring-page__filter-button')} onClick={handleApplyFilters}>
            <Filter size={16} /> Lọc
          </button>
        </div>
      </div>

      <div className={cx('scoring-page__table-card')}>
        <div className={cx('scoring-page__table-header')}>
          <div>
            <h2 className={cx('scoring-page__table-title')}>Danh sách minh chứng</h2>
            <p className={cx('scoring-page__table-subtitle')}>
              {totalItems} hồ sơ được tìm thấy theo điều kiện lọc hiện tại.
            </p>
          </div>
          <div className={cx('scoring-page__table-actions')}>
            <button type="button" className={cx('scoring-page__action-button')} onClick={handleClearSelection} disabled={!selectedIds.length}>
              Bỏ chọn
            </button>
            <button type="button" className={cx('scoring-page__action-button', 'scoring-page__action-button--primary')} disabled={!selectedIds.length}>
              Duyệt đạt
            </button>
            <button type="button" className={cx('scoring-page__action-button', 'scoring-page__action-button--danger')} disabled={!selectedIds.length}>
              Không đạt
            </button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className={cx('scoring-page__selection-bar')}>
            <span className={cx('scoring-page__selection-count')}>
              {selectedIds.length} sinh viên đã chọn
            </span>
            <button type="button" className={cx('scoring-page__selection-clear')} onClick={handleClearSelection}>
              Bỏ chọn tất cả
            </button>
          </div>
        )}

        <div className={cx('scoring-page__table-wrapper')}>
          <table className={cx('scoring-page__table')}>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={allSelected} onChange={handleSelectAll} aria-label="Chọn tất cả" />
                </th>
                <th>STT</th>
                <th>Sinh viên</th>
                <th>MSSV</th>
                <th>Khoa</th>
                <th>Lớp</th>
                <th>Hoạt động</th>
                <th>Điểm</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={12}>
                    <div className={cx('scoring-page__table-loading')}>
                      <Spin />
                    </div>
                  </td>
                </tr>
              ) : registrations.length ? (
                registrations.map((item, index) => {
                  const attendance = buildAttendanceMap(item.attendanceHistory);
                  const checkInEntry = attendance.checkin;
                  const checkOutEntry = attendance.checkout;
                  const student = item.student || {};
                  const activity = item.activity || {};
                  const statusKey = resolveStatusKey(item.status);

                  return (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleSelectRow(item.id)}
                          aria-label={`Chọn hồ sơ của ${student.name || 'sinh viên'}`}
                        />
                      </td>
                      <td>{startIndex + index + 1}</td>
                      <td>
                        <div className={cx('scoring-page__student')}>
                          <img
                            src={student.avatarUrl || 'https://placehold.co/40x40/eeee/000?text=SV'}
                            alt={student.name || 'Sinh viên'}
                            className={cx('scoring-page__student-avatar')}
                          />
                          <div className={cx('scoring-page__student-meta')}>
                            <span className={cx('scoring-page__student-name')}>{student.name || 'Sinh viên'}</span>
                            <span className={cx('scoring-page__student-email')}>{student.email || '---'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{student.studentCode || '---'}</td>
                      <td>{student.faculty || '---'}</td>
                      <td>{student.className || '---'}</td>
                      <td>
                        <div className={cx('scoring-page__activity')}>
                          <span className={cx('scoring-page__activity-title')}>{activity.title || 'Hoạt động'}</span>
                          <span className={cx('scoring-page__activity-date')}>{formatActivityRange(activity)}</span>
                        </div>
                      </td>
                      <td className={cx('scoring-page__score')}>+{activity.points ?? 0}</td>
                      <td>
                        <div className={cx('scoring-page__check-cell')}>
                          <span className={cx('scoring-page__check-time')}>{formatDateTime(checkInEntry?.capturedAt)}</span>
                          <span className={cx(getCheckStatusClass(checkInEntry?.statusLabel || checkInEntry?.status))}>
                            {checkInEntry?.statusLabel || checkInEntry?.status || 'Chưa cập nhật'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={cx('scoring-page__check-cell')}>
                          <span className={cx('scoring-page__check-time')}>{formatDateTime(checkOutEntry?.capturedAt)}</span>
                          <span className={cx(getCheckStatusClass(checkOutEntry?.statusLabel || checkOutEntry?.status))}>
                            {checkOutEntry?.statusLabel || checkOutEntry?.status || 'Chưa cập nhật'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={cx('scoring-page__status-badge', `scoring-page__status-badge--${statusKey}`)}>
                          {item.statusLabel || item.status || '---'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={cx('scoring-page__link-button')}
                          onClick={() => navigate(buildPath.adminScoringDetail(item.id))}
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={12}>
                    <div className={cx('scoring-page__empty')}>Không có hồ sơ phù hợp.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          current={pagination.page}
          total={pagination.total}
          pageSize={pagination.pageSize}
          showSizeChanger={false}
          onChange={(page) => setCurrentPage(page)}
          className={cx('scoring-page__pagination')}
        />
      </div>
    </section>
  );
}

export default ScoringPage;
