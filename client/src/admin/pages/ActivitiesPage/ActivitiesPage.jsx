import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input, Select, DatePicker, Tag, Tooltip, Modal, ConfigProvider } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPenToSquare, faTrashAlt, faSort, faCircleDot, faSearch } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import viVN from 'antd/locale/vi_VN';
import AdminTable from '@/admin/components/AdminTable/AdminTable';
import activitiesApi, { ACTIVITIES_QUERY_KEY } from '@/api/activities.api';
import { buildPath } from '@/config/routes.config';
import useToast from '@/components/Toast/Toast';
import useDebounce from '@/hooks/useDebounce';
import styles from './ActivitiesPage.module.scss';

const cx = classNames.bind(styles);
const { Option } = Select;

const formatDateTime = (isoString) => {
  if (!isoString) return '--';
  return dayjs(isoString).format('HH:mm DD/MM/YYYY');
};

const STATUS_CATEGORY_MAP = {
  ongoing: 'ongoing',
  attendance_open: 'ongoing',
  confirm_in: 'ongoing',
  confirm_out: 'ongoing',
  upcoming: 'upcoming',
  registered: 'upcoming',
  attendance_closed: 'upcoming',
  ended: 'ended',
  feedback_pending: 'ended',
  feedback_reviewing: 'ended',
  feedback_accepted: 'ended',
  feedback_waiting: 'ended',
  feedback_denied: 'ended',
  canceled: 'ended',
  absent: 'ended',
};

const deriveStatusCategory = (activity) => {
  if (!activity) return 'upcoming';
  const mapped = STATUS_CATEGORY_MAP[activity.state];
  if (mapped) return mapped;

  const now = dayjs();
  const start = activity.startTime ? dayjs(activity.startTime) : null;
  const end = activity.endTime ? dayjs(activity.endTime) : null;

  if (start && now.isBefore(start)) return 'upcoming';
  if (end && now.isAfter(end)) return 'ended';
  if (start && (!end || now.isBefore(end))) return 'ongoing';
  return 'upcoming';
};

const GROUP_TAG_CLASS = {
  NHOM_1: 'activities-page__group-tag--nhom-1',
  NHOM_2: 'activities-page__group-tag--nhom-2',
  NHOM_3: 'activities-page__group-tag--nhom-3',
};

const getGroupTag = (groupId, groupLabel) => {
  const label = groupLabel || groupId || '--';
  const tagClass = GROUP_TAG_CLASS[groupId] || GROUP_TAG_CLASS.NHOM_2;
  return <Tag className={cx('activities-page__group-tag', tagClass)}>{label}</Tag>;
};

const getStatusTag = (status) => {
  switch (status) {
    case 'ongoing':
      return (
        <Tag className={cx('activities-page__status-tag', 'activities-page__status-tag--ongoing')}>
          <FontAwesomeIcon icon={faCircleDot} className={cx('activities-page__status-dot')} />
          Đang diễn ra
        </Tag>
      );
    case 'upcoming':
      return (
        <Tag className={cx('activities-page__status-tag', 'activities-page__status-tag--upcoming')}>
          <FontAwesomeIcon icon={faCircleDot} className={cx('activities-page__status-dot')} />
          Sắp diễn ra
        </Tag>
      );
    case 'ended':
      return (
        <Tag className={cx('activities-page__status-tag', 'activities-page__status-tag--ended')}>
          <FontAwesomeIcon icon={faCircleDot} className={cx('activities-page__status-dot')} />
          Đã kết thúc
        </Tag>
      );
    default:
      return <Tag>{status}</Tag>;
  }
};

export default function ActivitiesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { contextHolder, open: openToast } = useToast();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const debouncedSearch = useDebounce(searchTerm, 400);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ACTIVITIES_QUERY_KEY,
    queryFn: activitiesApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => activitiesApi.remove(id),
    onSuccess: () => {
      openToast({ message: 'Xóa hoạt động thành công!', variant: 'success' });
      queryClient.invalidateQueries(ACTIVITIES_QUERY_KEY);
    },
    onError: (error) => {
      openToast({
        message: error.response?.data?.error || 'Xóa thất bại, vui lòng thử lại.',
        variant: 'danger',
      });
    },
  });

  const filteredActivities = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesSearch =
        !normalizedSearch ||
        [activity.title, activity.location, activity.code]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchesGroup = selectedGroup === 'all' || activity.pointGroup === selectedGroup;

      const statusCategory = deriveStatusCategory(activity);
      const matchesStatus = selectedStatus === 'all' || statusCategory === selectedStatus;

      const matchesDate =
        !selectedDate || (activity.startTime && dayjs(activity.startTime).isSame(selectedDate, 'day'));

      return matchesSearch && matchesGroup && matchesStatus && matchesDate;
    });
  }, [activities, debouncedSearch, selectedGroup, selectedStatus, selectedDate]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [debouncedSearch, selectedGroup, selectedStatus, selectedDate]);

  const handleOpenDeleteModal = useCallback((activity) => {
    setActivityToDelete(activity);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setActivityToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!activityToDelete) return;
    try {
      await deleteMutation.mutateAsync(activityToDelete.id);
    } finally {
      setActivityToDelete(null);
    }
  }, [activityToDelete, deleteMutation]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys),
  };

  const columns = useMemo(
    () => [
      {
        title: 'STT',
        dataIndex: 'index',
        key: 'index',
        width: 60,
      },
      {
        title: 'Tên hoạt động',
        dataIndex: 'title',
        key: 'title',
        width: 350,
        sorter: (a, b) => a.title.localeCompare(b.title),
      },
      {
        title: 'Nhóm hoạt động',
        dataIndex: 'pointGroup',
        key: 'pointGroup',
        width: 150,
        sorter: (a, b) => a.pointGroupLabel.localeCompare(b.pointGroupLabel),
      },
      {
        title: 'Học kỳ',
        dataIndex: 'semester',
        key: 'semester',
        width: 110,
        sorter: (a, b) => (a.semester || '').localeCompare(b.semester || ''),
      },
      {
        title: 'Năm học',
        dataIndex: 'academicYear',
        key: 'academicYear',
        width: 130,
        sorter: (a, b) => (a.academicYear || '').localeCompare(b.academicYear || ''),
      },
      {
        title: 'Điểm',
        dataIndex: 'points',
        key: 'points',
        width: 80,
        align: 'center',
        sorter: (a, b) => a.points - b.points,
      },
      {
        title: 'Số lượng',
        dataIndex: 'capacity',
        key: 'capacity',
        width: 100,
        align: 'center',
        sorter: (a, b) => a.participantsCount - b.participantsCount,
      },
      {
        title: 'Thời gian bắt đầu',
        dataIndex: 'startTime',
        key: 'startTime',
        width: 180,
        sorter: (a, b) => new Date(a.startTime) - new Date(b.startTime),
      },
      {
        title: 'Thời gian kết thúc',
        dataIndex: 'endTime',
        key: 'endTime',
        width: 180,
        sorter: (a, b) => new Date(a.endTime) - new Date(b.endTime),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'state',
        key: 'state',
        width: 150,
        sorter: (a, b) => deriveStatusCategory(a).localeCompare(deriveStatusCategory(b)),
      },
      {
        title: 'Hành động',
        key: 'actions',
        width: 120,
        align: 'center',
      },
    ],
    [],
  );

  const columnRenderers = useMemo(
    () => ({
      index: ({ index }) => (pagination.current - 1) * pagination.pageSize + index + 1,
      title: ({ value, record }) => (
        <div className={cx('activities-page__activity')}>
          <strong className={cx('activities-page__activity-title')}>{value || 'Chưa đặt tên'}</strong>
          <p className={cx('activities-page__activity-location')}>{record.location || 'Chưa cập nhật địa điểm'}</p>
        </div>
      ),
      pointGroup: ({ record }) => getGroupTag(record.pointGroup, record.pointGroupLabel),
      semester: ({ value }) => value || '--',
      academicYear: ({ value }) => value || '--',
      points: ({ value }) => {
        const resolvedValue = Number.isFinite(Number(value)) ? Number(value) : 0;
        return <strong className={cx('activities-page__points')}>+{resolvedValue}</strong>;
      },
      capacity: ({ record }) => {
        const joined = Number.isFinite(Number(record.participantsCount))
          ? Number(record.participantsCount)
          : 0;
        const capacityLabel = record.maxCapacity || 'Không giới hạn';
        return (
          <span>
            {joined}/{capacityLabel}
          </span>
        );
      },
      startTime: ({ value }) => formatDateTime(value),
      endTime: ({ value }) => formatDateTime(value),
      state: ({ record }) => getStatusTag(deriveStatusCategory(record)),
      actions: ({ record }) => (
        <div className={cx('activities-page__actions')}>
          <Tooltip title="Xem chi tiết">
            <button
              type="button"
              className={cx('activities-page__action-button', 'activities-page__action-button--view')}
              onClick={() => navigate(buildPath.adminActivityDetail(record.id))}
            >
              <FontAwesomeIcon icon={faEye} />
            </button>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <button
              type="button"
              className={cx('activities-page__action-button', 'activities-page__action-button--edit')}
              onClick={() => navigate(buildPath.adminActivityEdit(record.id))}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </button>
          </Tooltip>
          <Tooltip title="Xóa">
            <button
              type="button"
              className={cx('activities-page__action-button', 'activities-page__action-button--delete')}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleOpenDeleteModal(record);
              }}
              disabled={deleteMutation.isLoading}
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </Tooltip>
        </div>
      ),
    }),
    [deleteMutation.isLoading, handleOpenDeleteModal, navigate, pagination],
  );

  const renderSortIcon = useCallback(
    ({ sortOrder }) => (
      <FontAwesomeIcon
        icon={faSort}
        className={cx('activities-page__sort-icon', { 'activities-page__sort-icon--active': sortOrder })}
      />
    ),
    [],
  );

  return (
    <ConfigProvider locale={viVN}>
      {contextHolder}
      <div className={cx('activities-page')}>
        <div className={cx('activities-page__filter-bar')}>
          <Input
            placeholder="Tìm kiếm hoạt động..."
            className={cx('activities-page__filter-search')}
            prefix={<FontAwesomeIcon icon={faSearch} />}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Select
            placeholder="Nhóm hoạt động"
            className={cx('activities-page__filter-select')}
            value={selectedGroup}
            onChange={setSelectedGroup}
          >
            <Option value="all">Tất cả nhóm</Option>
            <Option value="NHOM_1">Nhóm 1</Option>
            <Option value="NHOM_2">Nhóm 2</Option>
            <Option value="NHOM_3">Nhóm 3</Option>
          </Select>
          <Select
            placeholder="Trạng thái"
            className={cx('activities-page__filter-select')}
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="ongoing">Đang diễn ra</Option>
            <Option value="upcoming">Sắp diễn ra</Option>
            <Option value="ended">Đã kết thúc</Option>
          </Select>
          <DatePicker
            placeholder="Lọc theo ngày"
            className={cx('activities-page__filter-date')}
            locale={viVN}
            value={selectedDate}
            onChange={setSelectedDate}
            allowClear
          />
        </div>

        <div className={cx('activities-page__content')}>
          <div className={cx('activities-page__content-header')}>
            <h3>Danh sách hoạt động</h3>
          </div>
          <AdminTable
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={filteredActivities}
            columnRenderers={columnRenderers}
            rowSelection={rowSelection}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filteredActivities.length,
              onChange: (page, pageSize) => {
                setPagination({ current: page, pageSize });
              },
              showSizeChanger: false,
            }}
            sortIcon={renderSortIcon}
            className={cx('activities-page__table')}
          />
        </div>
      </div>
      <Modal
        open={!!activityToDelete}
        title="Bạn có chắc chắn muốn xóa?"
        okText="Xóa"
        okType="danger"
        cancelText="Hủy"
        confirmLoading={deleteMutation.isLoading}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        destroyOnClose
        centered
      >
        <p>Hoạt động "{activityToDelete?.title}" sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
      </Modal>
    </ConfigProvider>
  );
}
