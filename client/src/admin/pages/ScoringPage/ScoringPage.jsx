import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Pagination } from 'antd';
import { CheckCircle2, Clock3, Filter, Search, Users, XCircle } from 'lucide-react';
import styles from './ScoringPage.module.scss';
import { scoringListData } from './ScoringPageData';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';

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
  if (normalized.includes('vắng')) return 'scoring-page__check-status scoring-page__check-status--danger';
  return 'scoring-page__check-status';
};

function ScoringPage() {
  const navigate = useNavigate();
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

  const faculties = useMemo(() => ['all', ...new Set(scoringListData.map((item) => item.faculty))], []);
  const classes = useMemo(() => ['all', ...new Set(scoringListData.map((item) => item.className))], []);
  const activities = useMemo(() => ['all', ...new Set(scoringListData.map((item) => item.activityTitle))], []);

  const statusCounts = useMemo(() => {
    return scoringListData.reduce(
      (acc, item) => {
        acc.all += 1;
        acc[item.statusKey] = (acc[item.statusKey] || 0) + 1;
        return acc;
      },
      { all: 0 },
    );
  }, []);

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
  }, []);

  const filteredData = useMemo(() => {
    return scoringListData.filter((item) => {
      if (filters.status !== 'all' && item.statusKey !== filters.status) return false;
      if (filters.faculty !== 'all' && item.faculty !== filters.faculty) return false;
      if (filters.className !== 'all' && item.className !== filters.className) return false;
      if (filters.activity !== 'all' && item.activityTitle !== filters.activity) return false;
      if (searchTerm) {
        const normalizedTerm = searchTerm.toLowerCase();
        const haystack = `${item.studentName} ${item.studentId} ${item.activityTitle}`.toLowerCase();
        if (!haystack.includes(normalizedTerm)) return false;
      }
      return true;
    });
  }, [filters, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filteredData.some((item) => item.id === id)));
  }, [filteredData]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, safePage]);

  const handleSelectRow = useCallback((id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]));
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = filteredData.map((item) => item.id);
    setSelectedIds((prev) => (prev.length === allIds.length ? [] : allIds));
  }, [filteredData]);

  const handleClearSelection = useCallback(() => setSelectedIds([]), []);

  const allSelected = filteredData.length > 0 && selectedIds.length === filteredData.length;

  return (
    <section className={cx('scoring-page')}>
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
            {activities.map((activity) => (
              <option key={activity} value={activity}>
                {activity === 'all' ? 'Tất cả hoạt động' : activity}
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
              {paginatedData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => handleSelectRow(item.id)}
                      aria-label={`Chọn hồ sơ của ${item.studentName}`}
                    />
                  </td>
                  <td>{item.stt}</td>
                  <td>
                    <div className={cx('scoring-page__student')}>
                      <img src={item.avatar} alt={item.studentName} className={cx('scoring-page__student-avatar')} />
                      <div className={cx('scoring-page__student-meta')}>
                        <span className={cx('scoring-page__student-name')}>{item.studentName}</span>
                        <span className={cx('scoring-page__student-email')}>{item.studentEmail}</span>
                      </div>
                    </div>
                  </td>
                  <td>{item.studentId}</td>
                  <td>{item.faculty}</td>
                  <td>{item.className}</td>
                  <td>
                    <div className={cx('scoring-page__activity')}>
                      <span className={cx('scoring-page__activity-title')}>{item.activityTitle}</span>
                      <span className={cx('scoring-page__activity-date')}>{item.activityDate}</span>
                    </div>
                  </td>
                  <td className={cx('scoring-page__score')}>+{item.score}</td>
                  <td>
                    <div className={cx('scoring-page__check-cell')}>
                      <span className={cx('scoring-page__check-time')}>{item.checkIn.time}</span>
                      <span className={cx(getCheckStatusClass(item.checkIn.status))}>{item.checkIn.status}</span>
                    </div>
                  </td>
                  <td>
                    <div className={cx('scoring-page__check-cell')}>
                      <span className={cx('scoring-page__check-time')}>{item.checkOut.time}</span>
                      <span className={cx(getCheckStatusClass(item.checkOut.status))}>{item.checkOut.status}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={cx('scoring-page__status-badge', `scoring-page__status-badge--${item.statusKey}`)}
                    >
                      {item.statusLabel}
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
              ))}
            </tbody>
          </table>
        </div>

        <div className={cx('scoring-page__footer')}>
          <div className={cx('scoring-page__footer-meta')}>
            Đã chọn {selectedIds.length} / {totalItems} hồ sơ
          </div>
          <Pagination
            current={safePage}
            pageSize={PAGE_SIZE}
            total={totalItems}
            onChange={setCurrentPage}
            showSizeChanger={false}
            hideOnSinglePage
            className={cx('scoring-page__pagination')}
          />
        </div>
      </div>
    </section>
  );
}

export default ScoringPage;
