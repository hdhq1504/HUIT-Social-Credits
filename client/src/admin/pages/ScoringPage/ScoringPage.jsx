import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Avatar, Button, Input, Pagination, Select, Tag, Tooltip, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRotateRight,
  faCalendarAlt,
  faCheckCircle,
  faClock,
  faEye,
  faSort,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import AdminTable from '@/admin/components/AdminTable/AdminTable';
import registrationsApi, { ADMIN_REGISTRATIONS_QUERY_KEY } from '@/api/registrations.api.js';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config.js';
import useToast from '@/components/Toast/Toast.jsx';
import useDebounce from '@/hooks/useDebounce.jsx';
import styles from './ScoringPage.module.scss';

const cx = classNames.bind(styles);
const PAGE_SIZE = 10;

const ATTENDANCE_TONES = {
  DANG_KY: { tone: 'warning', icon: faClock, label: 'Đang xử lý' },
  DA_THAM_GIA: { tone: 'success', icon: faCheckCircle, label: 'Hoàn thành' },
  VANG_MAT: { tone: 'danger', icon: faTimesCircle, label: 'Vắng mặt' },
  DA_HUY: { tone: 'neutral', icon: faTimesCircle, label: 'Đã hủy' },
};

const REGISTRATION_STATUS_META = {
  DANG_KY: { color: 'warning', icon: faClock, label: 'Chờ duyệt' },
  DA_THAM_GIA: { color: 'success', icon: faCheckCircle, label: 'Đạt' },
  VANG_MAT: { color: 'error', icon: faTimesCircle, label: 'Không đạt' },
  DA_HUY: { color: 'default', icon: faTimesCircle, label: 'Đã hủy' },
};

const getAttendanceEntry = (history, phase) => history?.find((item) => item.phase === phase) || null;

const renderAttendanceStatus = (entry) => {
  const meta = entry ? ATTENDANCE_TONES[entry.status] || ATTENDANCE_TONES.VANG_MAT : null;
  const timeStr = entry?.capturedAt ? dayjs(entry.capturedAt).format('HH:mm:ss') : '--:--:--';
  const tone = meta?.tone || 'neutral';
  return (
    <div className={cx('scoring-page__check-status')}>
      <Typography.Text className={cx('scoring-page__check-time')}>{timeStr}</Typography.Text>
      <Typography.Text className={cx('scoring-page__check-label', `scoring-page__check-label--${tone}`)}>
        {meta ? <FontAwesomeIcon icon={meta.icon} /> : null}
        {entry?.statusLabel || meta?.label || 'Chưa cập nhật'}
      </Typography.Text>
    </div>
  );
};

function ScoringPage() {
  const navigate = useNavigate();
  const { contextHolder, open: openToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', faculty: undefined, className: undefined, activityId: undefined });
  const [filterOptions, setFilterOptions] = useState({ faculties: [], classes: [], activities: [] });
  const [statusCounts, setStatusCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [pagination, setPagination] = useState({ current: 1, pageSize: PAGE_SIZE, total: 0 });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const { setBreadcrumbs, setPageActions } = useContext(AdminPageContext);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Điểm & Minh chứng', path: ROUTE_PATHS.ADMIN.FEEDBACK },
    ]);
    setPageActions([]);
    return () => {
      setBreadcrumbs(null);
      setPageActions(null);
    };
  }, [setBreadcrumbs, setPageActions]);

  const queryParams = useMemo(() => {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      search: debouncedSearchTerm || undefined,
    };

    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.faculty) params.faculty = filters.faculty;
    if (filters.className) params.className = filters.className;
    if (filters.activityId) params.activityId = filters.activityId;

    return params;
  }, [pagination.current, pagination.pageSize, debouncedSearchTerm, filters]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [ADMIN_REGISTRATIONS_QUERY_KEY, queryParams],
    queryFn: () => registrationsApi.list(queryParams),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (error) {
      openToast({
        message: 'Không thể tải danh sách minh chứng',
        variant: 'danger',
      });
      console.error(error);
    }
  }, [error, openToast]);

  useEffect(() => {
    const pageInfo = data?.pagination;
    if (pageInfo) {
      setPagination((prev) => ({
        current: pageInfo.page ?? prev.current,
        pageSize: pageInfo.pageSize ?? prev.pageSize,
        total: pageInfo.total ?? prev.total,
      }));
    }

    const stats = data?.stats ?? {};
    const faculties = (data?.filterOptions?.faculties ?? []).map((value) => ({ label: value, value }));
    const classes = (data?.filterOptions?.classes ?? []).map((value) => ({ label: value, value }));
    const activities = (data?.filterOptions?.activities ?? []).map((item) => ({ label: item.title, value: item.id }));
    setFilterOptions({ faculties, classes, activities });

    const totalCount =
      stats.total ?? (stats.pending ?? 0) + (stats.approved ?? 0) + (stats.rejected ?? 0);
    setStatusCounts({
      all: totalCount,
      pending: stats.pending ?? 0,
      approved: stats.approved ?? 0,
      rejected: stats.rejected ?? 0,
    });
  }, [data]);


  const registrations = data?.registrations ?? [];

  useEffect(() => {
    if (!registrations.length) {
      setSelectedRowKeys([]);
      return;
    }
    setSelectedRowKeys((prev) => prev.filter((key) => registrations.some((item) => item.id === key)));
  }, [registrations]);

  const handleStatusFilterChange = useCallback((statusValue) => {
    setFilters((prev) => ({ ...prev, status: statusValue ?? 'all' }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilters({ status: 'all', faculty: undefined, className: undefined, activityId: undefined });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleSelectChange = (key) => (value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const renderSortIcon = useCallback(
    ({ sortOrder }) => (
      <FontAwesomeIcon
        icon={faSort}
        className={cx('scoring-page__sort-icon', { 'scoring-page__sort-icon--active': Boolean(sortOrder) })}
      />
    ),
    [],
  );

  const columns = useMemo(
    () => [
      { title: 'STT', dataIndex: 'index', key: 'index', width: 60, align: 'center' },
      { title: 'Tên sinh viên', dataIndex: ['student', 'name'], key: 'student', width: 250 },
      { title: 'MSSV', dataIndex: ['student', 'studentCode'], key: 'studentCode', width: 110, sorter: (a, b) => (a.student?.studentCode || '').localeCompare(b.student?.studentCode || '') },
      { title: 'Khoa', dataIndex: ['student', 'faculty'], key: 'faculty', width: 180, sorter: (a, b) => (a.student?.faculty || '').localeCompare(b.student?.faculty || '') },
      { title: 'Lớp', dataIndex: ['student', 'className'], key: 'className', width: 100, sorter: (a, b) => (a.student?.className || '').localeCompare(b.student?.className || '') },
      { title: 'Hoạt động', dataIndex: ['activity', 'title'], key: 'activity', width: 250, sorter: (a, b) => (a.activity?.title || '').localeCompare(b.activity?.title || '') },
      { title: 'Điểm', dataIndex: ['activity', 'points'], key: 'points', width: 80, align: 'center', sorter: (a, b) => (a.activity?.points || 0) - (b.activity?.points || 0) },
      { title: 'Check-in', dataIndex: 'checkIn', key: 'checkIn', width: 130 },
      { title: 'Check out', dataIndex: 'checkOut', key: 'checkOut', width: 130 },
      { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 120, align: 'center', sorter: (a, b) => (a.status || '').localeCompare(b.status || '') },
      { title: 'Hành động', key: 'action', width: 100, align: 'center' },
    ],
    [],
  );

  const columnRenderers = useMemo(
    () => ({
      index: ({ index }) => (pagination.current - 1) * pagination.pageSize + index + 1,
      student: ({ record }) => (
        <div className={cx('scoring-page__student')}>
          <Avatar src={record.student?.avatarUrl || '/images/profile.png'} />
          <div className={cx('scoring-page__student-details')}>
            <Typography.Text className={cx('scoring-page__student-name')}>{record.student?.name || 'N/A'}</Typography.Text>
            <Typography.Text type="secondary" className={cx('scoring-page__student-email')}>
              {record.student?.email || 'N/A'}
            </Typography.Text>
          </div>
        </div>
      ),
      studentCode: ({ record }) => record.student?.studentCode || '--',
      faculty: ({ record }) => record.student?.faculty || '--',
      className: ({ record }) => record.student?.className || '--',
      activity: ({ record }) => (
        <div className={cx('scoring-page__activity')}>
          <Typography.Text className={cx('scoring-page__activity-name')}>{record.activity?.title || '--'}</Typography.Text>
          <Typography.Text type="secondary" className={cx('scoring-page__activity-date')}>
            <FontAwesomeIcon icon={faCalendarAlt} />
            {record.activity?.startTime ? dayjs(record.activity.startTime).format('DD/MM/YYYY') : '--/--/----'}
          </Typography.Text>
        </div>
      ),
      points: ({ record }) => {
        const points = Number.isFinite(Number(record.activity?.points)) ? Number(record.activity.points) : 0;
        return <Typography.Text className={cx('scoring-page__score')}>{points > 0 ? `+${points}` : points}</Typography.Text>;
      },
      checkIn: ({ record }) => renderAttendanceStatus(getAttendanceEntry(record.attendanceHistory, 'checkin')),
      checkOut: ({ record }) => renderAttendanceStatus(getAttendanceEntry(record.attendanceHistory, 'checkout')),
      status: ({ record }) => {
        const meta = REGISTRATION_STATUS_META[record.status] || REGISTRATION_STATUS_META.DANG_KY;
        return (
          <Tag icon={<FontAwesomeIcon icon={meta.icon} />} color={meta.color} className={cx('scoring-page__status-tag')}>
            {record.statusLabel || meta.label}
          </Tag>
        );
      },
      action: ({ record }) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            icon={<FontAwesomeIcon icon={faEye} style={{ color: 'var(--primary-color)' }} />}
            onClick={() => navigate(buildPath.adminScoringDetail(record.id))}
          />
        </Tooltip>
      ),
    }),
    [navigate, pagination],
  );

  const statusOptions = useMemo(
    () => [
      { label: `Tất cả (${statusCounts.all ?? 0})`, value: 'all' },
      { label: `Chờ duyệt (${statusCounts.pending ?? 0})`, value: 'pending' },
      { label: `Đạt (${statusCounts.approved ?? 0})`, value: 'approved' },
      { label: `Không đạt (${statusCounts.rejected ?? 0})`, value: 'rejected' },
    ],
    [statusCounts],
  );

  return (
    <section className={cx('scoring-page')}>
      {contextHolder}

      <div className={cx('scoring-page__filter-bar')}>
        <Input
          placeholder="Tìm kiếm hoạt động, sinh viên..."
          className={cx('scoring-page__filter-search')}
          value={searchTerm}
          onChange={handleSearchChange}
          allowClear
        />
        <Select
          placeholder="Khoa"
          className={cx('scoring-page__filter-select')}
          allowClear
          value={filters.faculty}
          options={filterOptions.faculties}
          optionFilterProp="label"
          onChange={handleSelectChange('faculty')}
        />
        <Select
          placeholder="Lớp"
          className={cx('scoring-page__filter-select')}
          allowClear
          value={filters.className}
          options={filterOptions.classes}
          optionFilterProp="label"
          onChange={handleSelectChange('className')}
        />
        <Select
          placeholder="Hoạt động"
          className={cx('scoring-page__filter-select')}
          allowClear
          showSearch
          value={filters.activityId}
          options={filterOptions.activities}
          optionFilterProp="label"
          onChange={handleSelectChange('activityId')}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          className={cx('scoring-page__filter-select')}
          value={filters.status === 'all' ? undefined : filters.status}
          options={statusOptions}
          optionFilterProp="label"
          onChange={handleStatusFilterChange}
        />

        <Button type="primary" icon={<FontAwesomeIcon icon={faArrowRotateRight} />} onClick={handleResetFilters}>
          Đặt lại
        </Button>
      </div>

      <div className={cx('scoring-page__container')}>
        <div className={cx('scoring-page__header')}>
          <h3>Danh sách minh chứng</h3>
        </div>

        <AdminTable
          rowSelection={rowSelection}
          columns={columns}
          dataSource={registrations}
          loading={isLoading || isFetching}
          pagination={false}
          rowKey="id"
          columnRenderers={columnRenderers}
          sortIcon={renderSortIcon}
          className={cx('scoring-page__table')}
        />

        <div className={cx('scoring-page__footer')}>
          <Typography.Text className={cx('scoring-page__selection-info')}>
            Đã chọn <Typography.Text strong>{selectedRowKeys.length}</Typography.Text> trong{' '}
            <Typography.Text strong>{pagination.total}</Typography.Text> kết quả
          </Typography.Text>
          <Pagination
            current={pagination.current}
            total={pagination.total}
            pageSize={pagination.pageSize}
            showSizeChanger={false}
            onChange={(page) => setPagination((prev) => ({ ...prev, current: page }))}
          />
        </div>
      </div>
    </section>
  );
}

export default ScoringPage;
