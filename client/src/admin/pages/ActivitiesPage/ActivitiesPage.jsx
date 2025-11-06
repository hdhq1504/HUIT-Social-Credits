import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { useQuery } from '@tanstack/react-query';
import { Table, Input, Select, DatePicker, Tag, Tooltip, Pagination, ConfigProvider } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPenToSquare, faTrashAlt, faSort, faCircleDot, faSearch } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import viVN from 'antd/locale/vi_VN';
import activitiesApi, { ACTIVITIES_QUERY_KEY } from '@/api/activities.api';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import styles from './ActivitiesPage.module.scss';

const cx = classNames.bind(styles);
const { Option } = Select;

// Hàm helper để định dạng ngày giờ
const formatDateTime = (isoString) => {
  if (!isoString) return '--';
  return dayjs(isoString).format('HH:mm DD/MM/YYYY');
};

// Hàm helper cho tag trạng thái
const getStatusTag = (status) => {
  switch (status) {
    case 'ongoing':
    case 'attendance_open':
    case 'confirm_in':
    case 'confirm_out':
      return (
        <Tag className={cx('activities-list__status-tag', '--ongoing')}>
          <FontAwesomeIcon icon={faCircleDot} className={cx('dot-icon')} />
          Đang diễn ra
        </Tag>
      );
    case 'upcoming':
    case 'registered':
    case 'attendance_closed':
      return (
        <Tag className={cx('activities-list__status-tag', '--upcoming')}>
          <FontAwesomeIcon icon={faCircleDot} className={cx('dot-icon')} />
          Sắp diễn ra
        </Tag>
      );
    case 'ended':
    case 'feedback_pending':
    case 'feedback_reviewing':
    case 'feedback_accepted':
      return (
        <Tag className={cx('activities-list__status-tag', '--ended')}>
          <FontAwesomeIcon icon={faCircleDot} className={cx('dot-icon')} />
          Đã kết thúc
        </Tag>
      );
    default:
      return <Tag>{status}</Tag>;
  }
};

// Hàm helper cho tag nhóm
const getGroupTag = (groupName) => {
  if (groupName?.includes('1')) {
    return <Tag className={cx('activities-list__group-tag', '--nhom-1')}>{groupName}</Tag>;
  }
  return <Tag className={cx('activities-list__group-tag', '--nhom-23')}>{groupName}</Tag>;
};

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ACTIVITIES_QUERY_KEY,
    queryFn: activitiesApi.list,
  });

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const columns = useMemo(
    () => [
      {
        title: 'STT',
        dataIndex: 'stt',
        key: 'stt',
        width: 60,
        render: (_, record, index) => {
          return (pagination.current - 1) * pagination.pageSize + index + 1;
        },
      },
      {
        title: 'Tên hoạt động',
        dataIndex: 'title',
        key: 'title',
        width: 350,
        sorter: (a, b) => a.title.localeCompare(b.title),
        render: (text, record) => (
          <div className={cx('activities-list__activity-name')}>
            <strong>{text}</strong>
            <p>{record.location || 'Chưa cập nhật địa điểm'}</p>
          </div>
        ),
      },
      {
        title: 'Nhóm hoạt động',
        dataIndex: 'pointGroupLabel',
        key: 'pointGroupLabel',
        width: 150,
        sorter: (a, b) => a.pointGroupLabel.localeCompare(b.pointGroupLabel),
        render: (groupName) => getGroupTag(groupName),
      },
      {
        title: 'Điểm',
        dataIndex: 'points',
        key: 'points',
        width: 80,
        align: 'center',
        sorter: (a, b) => a.points - b.points,
        render: (points) => <strong className={cx('activities-list__points')}>+{points}</strong>,
      },
      {
        title: 'Số lượng',
        dataIndex: 'capacity',
        key: 'capacity',
        width: 100,
        align: 'center',
        sorter: (a, b) => a.participantsCount - b.participantsCount,
        render: (_, record) => (
          <span>
            {record.participantsCount}/{record.maxCapacity || 'Không giới hạn'}
          </span>
        ),
      },
      {
        title: 'Thời gian bắt đầu',
        dataIndex: 'startTime',
        key: 'startTime',
        width: 180,
        render: (isoString) => formatDateTime(isoString),
        sorter: (a, b) => new Date(a.startTime) - new Date(b.startTime),
      },
      {
        title: 'Thời gian kết thúc',
        dataIndex: 'endTime',
        key: 'endTime',
        width: 180,
        render: (isoString) => formatDateTime(isoString),
        sorter: (a, b) => new Date(a.endTime) - new Date(b.endTime),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'state',
        key: 'state',
        width: 150,
        sorter: (a, b) => a.state.localeCompare(b.state),
        render: (status) => getStatusTag(status),
      },
      {
        title: 'Hành động',
        key: 'actions',
        width: 120,
        align: 'center',
        render: (_, record) => (
          <div className={cx('activities-list__actions')}>
            <Tooltip title="Xem chi tiết">
              <button
                className={cx('activities-list__action-btn', '--view')}
                onClick={() => navigate(buildPath.adminActivityDetail(record.id))}
              >
                <FontAwesomeIcon icon={faEye} />
              </button>
            </Tooltip>
            <Tooltip title="Chỉnh sửa">
              <button
                className={cx('activities-list__action-btn', '--edit')}
                onClick={() => navigate(buildPath.adminActivityEdit(record.id))}
              >
                <FontAwesomeIcon icon={faPenToSquare} />
              </button>
            </Tooltip>
            <Tooltip title="Xóa">
              <button className={cx('activities-list__action-btn', '--delete')}>
                <FontAwesomeIcon icon={faTrashAlt} />
              </button>
            </Tooltip>
          </div>
        ),
      },
    ],
    [pagination, navigate],
  );

  return (
    <ConfigProvider locale={viVN}>
      <div className={cx('activities-page__wrapper')}>
        {/* Filter Bar (Giữ nguyên) */}
        <div className={cx('activities-list__filter-bar')}>
          <Input
            placeholder="Tìm kiếm hoạt động..."
            className={cx('activities-list__search-input')}
            prefix={<FontAwesomeIcon icon={faSearch} />}
          />
          <Select placeholder="Nhóm hoạt động" className={cx('activities-list__select')}>
            <Option value="all">Tất cả nhóm</Option>
            <Option value="NHOM_1">Nhóm 1</Option>
            <Option value="NHOM_2">Nhóm 2</Option>
            <Option value="NHOM_3">Nhóm 3</Option>
          </Select>
          <Select placeholder="Trạng thái" className={cx('activities-list__select')}>
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="ongoing">Đang diễn ra</Option>
            <Option value="upcoming">Sắp diễn ra</Option>
            <Option value="ended">Đã kết thúc</Option>
          </Select>
          <DatePicker placeholder="Lọc theo ngày" className={cx('activities-list__date-input')} locale={viVN} />
        </div>

        {/* Table Content */}
        <div className={cx('activities-list__content-box')}>
          <div className={cx('activities-list__header')}>
            <h3>Danh sách hoạt động</h3>
          </div>
          <Table
            rowKey="id"
            loading={isLoading}
            columns={columns.map((col) => ({
              ...col,
              sortIcon: ({ sortOrder }) => (
                <FontAwesomeIcon
                  icon={faSort}
                  className={cx('activities-list__sort-icon', {
                    '--active': sortOrder,
                  })}
                />
              ),
            }))}
            dataSource={activities}
            rowSelection={rowSelection}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: activities.length,
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize });
              },
              showSizeChanger: false,
            }}
            className={cx('activities-list__table')}
          />
        </div>
      </div>
    </ConfigProvider>
  );
}
