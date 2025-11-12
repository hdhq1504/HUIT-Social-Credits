import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Avatar, Button, Pagination, Spin, Table, Tag, Tooltip, Typography, Input, Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faClock,
  faTimesCircle,
  faEye,
  faCalendarAlt,
  faArrowRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import styles from './ScoringPage.module.scss';
import registrationsApi, { ADMIN_REGISTRATIONS_QUERY_KEY } from '@/api/registrations.api.js';
import { buildPath } from '@/config/routes.config.js';
import useToast from '@/components/Toast/Toast.jsx';
import useDebounce from '@/hooks/useDebounce.jsx';

const cx = classNames.bind(styles);
const PAGE_SIZE = 10;

const checkStatusMap = {
  'đúng giờ': {
    color: 'success',
    icon: <FontAwesomeIcon icon={faCheckCircle} />,
    label: 'Đúng giờ',
  },
  'trễ giờ': {
    color: 'warning',
    icon: <FontAwesomeIcon icon={faClock} />,
    label: 'Trễ giờ',
  },
  'vắng mặt': {
    color: 'error',
    icon: <FontAwesomeIcon icon={faTimesCircle} />,
    label: 'Vắng mặt',
  },
};

const renderCheckStatus = (time, status) => {
  const statusKey = status?.toLowerCase() || 'vắng mặt';
  const statusProps = checkStatusMap[statusKey] || checkStatusMap['vắng mặt'];
  const timeStr = time ? dayjs(time).format('HH:mm:ss') : '--:--:--';

  return (
    <div className={cx('check-status')}>
      <Typography.Text className={cx('check-time')}>{timeStr}</Typography.Text>
      <Typography.Text className={cx('check-label', `check-label--${statusKey.replace(' ', '-')}`)}>
        {statusProps.icon}
        {statusProps.label}
      </Typography.Text>
    </div>
  );
};

function ScoringPage() {
  const navigate = useNavigate();
  const { contextHolder, open: openToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all' });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState();
  const [selectedClass, setSelectedClass] = useState();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [selectedActivity, setSelectedActivity] = useState();
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const queryParams = useMemo(() => {
    const params = {
      page: currentPage,
      limit: PAGE_SIZE,
    };
    if (debouncedSearchTerm) {
      params.search = debouncedSearchTerm;
    }
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    return params;
  }, [currentPage, debouncedSearchTerm, filters.status]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [ADMIN_REGISTRATIONS_QUERY_KEY, queryParams],
    queryFn: () => registrationsApi.getAllRegistrations(queryParams),
    placeholderData: (previousData) => previousData,
  });

  const { data: statusCountsData } = useQuery({
    queryKey: [ADMIN_REGISTRATIONS_QUERY_KEY, 'statusCounts'],
    queryFn: registrationsApi.getRegistrationStatusCounts,
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

  const statusCounts = useMemo(() => {
    const counts = statusCountsData || {};
    let total = 0;
    Object.values(counts).forEach((val) => {
      total += val;
    });
    return { ...counts, all: total };
  }, [statusCountsData]);

  const handleStatusFilterChange = useCallback((statusValue) => {
    setFilters((prev) => ({ ...prev, status: statusValue }));
    setCurrentPage(1);
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilters({ status: 'all' });
    setCurrentPage(1);
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleSelectChange = (setter) => (value) => {
    setter(value || undefined);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.page - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Tên sinh viên',
      dataIndex: 'HoTen',
      key: 'hoTen',
      width: 250,
      sorter: (a, b) => (a.HoTen || '').localeCompare(b.HoTen || ''),
      render: (_, record) => (
        <div className={cx('student-info')}>
          <Avatar src={record.AnhDaiDien || '/images/profile.png'} />
          <div className={cx('student-details')}>
            <Typography.Text className={cx('student-name')}>{record.HoTen || 'N/A'}</Typography.Text>
            <Typography.Text type="secondary" className={cx('student-email')}>
              {record.Email || 'N/A'}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: 'MSSV',
      dataIndex: 'MSSV',
      key: 'mssv',
      width: 110,
      sorter: (a, b) => (a.MSSV || '').localeCompare(b.MSSV || ''),
    },
    {
      title: 'Khoa',
      dataIndex: 'Khoa',
      key: 'khoa',
      width: 180,
      sorter: (a, b) => (a.Khoa || '').localeCompare(b.Khoa || ''),
    },
    {
      title: 'Lớp',
      dataIndex: 'Lop',
      key: 'lop',
      width: 100,
      sorter: (a, b) => (a.Lop || '').localeCompare(b.Lop || ''),
    },
    {
      title: 'Hoạt động',
      dataIndex: 'TenHoatDong',
      key: 'hoatDong',
      width: 250,
      sorter: (a, b) => (a.TenHoatDong || '').localeCompare(b.TenHoatDong || ''),
      render: (tenHoatDong, record) => (
        <div className={cx('activity-info')}>
          <Typography.Text className={cx('activity-name')}>{tenHoatDong}</Typography.Text>
          <Typography.Text type="secondary" className={cx('activity-date')}>
            <FontAwesomeIcon icon={faCalendarAlt} />
            {dayjs(record.ThoiGianBatDau).format('DD/MM/YYYY')}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: 'Điểm',
      dataIndex: 'Diem',
      key: 'diem',
      width: 80,
      align: 'center',
      sorter: (a, b) => (a.Diem || 0) - (b.Diem || 0),
      render: (diem) => <Typography.Text className={cx('score')}>{diem > 0 ? `+${diem}` : diem || 0}</Typography.Text>,
    },
    {
      title: 'Check-in',
      dataIndex: 'CheckIn',
      key: 'checkIn',
      width: 130,
      render: (checkIn, record) => renderCheckStatus(checkIn, record.TrangThaiCheckIn),
    },
    {
      title: 'Check out',
      dataIndex: 'CheckOut',
      key: 'checkOut',
      width: 130,
      render: (checkOut, record) => renderCheckStatus(checkOut, record.TrangThaiCheckOut),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'statusLabel',
      key: 'trangThai',
      width: 120,
      align: 'center',
      render: (statusLabel, record) => {
        const statusKey = record.status || 'pending';
        const tagMap = {
          pending: {
            color: 'warning',
            icon: <FontAwesomeIcon icon={faClock} />,
            label: 'Chờ duyệt',
          },
          approved: {
            color: 'success',
            icon: <FontAwesomeIcon icon={faCheckCircle} />,
            label: 'Đạt',
          },
          rejected: {
            color: 'error',
            icon: <FontAwesomeIcon icon={faTimesCircle} />,
            label: 'Không đạt',
          },
        };
        const tagProps = tagMap[statusKey] || tagMap.pending;
        return (
          <Tag icon={tagProps.icon} color={tagProps.color}>
            {statusLabel || tagProps.label}
          </Tag>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            icon={<FontAwesomeIcon icon={faEye} style={{ color: 'var(--primary-color)' }} />}
            onClick={() => navigate(buildPath.adminScoringDetail(record.id))}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <section className={cx('scoring-page')}>
      {contextHolder}

      <div className={cx('filter-bar')}>
        <Input
          placeholder="Tìm kiếm hoạt động, sinh viên..."
          className={cx('filter-bar__search')}
          value={searchTerm}
          onChange={handleSearchChange}
          allowClear
        />
        <Select
          placeholder="Khoa"
          className={cx('filter-bar__select')}
          allowClear
          value={selectedFaculty}
          options={filters.faculties || []}
          optionFilterProp="label"
          onChange={handleSelectChange(setSelectedFaculty)}
        />
        <Select
          placeholder="Lớp"
          className={cx('filter-bar__select')}
          allowClear
          value={selectedClass}
          options={filters.classes || []}
          optionFilterProp="label"
          onChange={handleSelectChange(setSelectedClass)}
        />
        <Select
          placeholder="Hoạt động"
          className={cx('filter-bar__select')}
          allowClear
          showSearch
          value={selectedActivity}
          options={filters.activities || []}
          optionFilterProp="label"
          onChange={handleSelectChange(setSelectedActivity)}
        />
        <Select
          size="large"
          allowClear
          placeholder="Trạng thái"
          className={cx('filter-bar__select')}
          value={filters.status === 'all' ? undefined : filters.status}
          options={[
            { label: `Tất cả (${statusCounts.all ?? 0})`, value: 'all' },
            { label: `Chờ duyệt (${statusCounts.pending ?? 0})`, value: 'pending' },
            { label: `Đạt (${statusCounts.approved ?? 0})`, value: 'approved' },
            { label: `Không đạt (${statusCounts.rejected ?? 0})`, value: 'rejected' },
          ]}
          optionFilterProp="label"
          onChange={(val) => handleStatusFilterChange(val ?? 'all')}
        />

        <Button type="primary" icon={<FontAwesomeIcon icon={faArrowRotateRight} />} onClick={handleResetFilters}>
          Đặt lại
        </Button>
      </div>

      <div className={cx('scoring-page__container')}>
        <div className={cx('scoring-page__container-header')}>
          <h3>Danh sách minh chứng</h3>
        </div>

        <Spin spinning={isLoading || isFetching}>
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={data?.items || []}
            pagination={false}
            rowKey="id"
          />
        </Spin>

        <div className={cx('scoring-page__container-footer')}>
          <Typography.Text className={cx('selection-info')}>
            Đã chọn <Typography.Text strong>{selectedRowKeys.length}</Typography.Text> trong{' '}
            <Typography.Text strong>{pagination.total}</Typography.Text> kết quả
          </Typography.Text>
          <Pagination
            current={pagination.page}
            total={pagination.total}
            pageSize={pagination.pageSize}
            showSizeChanger={false}
            onChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>
    </section>
  );
}

export default ScoringPage;
