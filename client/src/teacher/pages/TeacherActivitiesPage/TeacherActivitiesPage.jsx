import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { useQuery } from '@tanstack/react-query';
import { Input, Select, DatePicker, Tag, Tooltip, ConfigProvider } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPenToSquare, faSort, faCircleDot, faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import viVN from 'antd/locale/vi_VN';
import { TeacherPageContext } from '@/teacher/contexts/TeacherPageContext';
import AdminTable from '@/admin/components/AdminTable/AdminTable';
import activitiesApi, { ACTIVITIES_QUERY_KEY } from '@/api/activities.api';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import useDebounce from '@/hooks/useDebounce';
import styles from './TeacherActivitiesPage.module.scss';

const cx = classNames.bind(styles);
const { Option } = Select;

const formatDateTime = (isoString) => {
  if (!isoString) return '--';
  return dayjs(isoString).format('HH:mm DD/MM/YYYY');
};

const STATUS_CATEGORY_MAP = {
  ongoing: 'ongoing',
  check_in: 'ongoing',
  check_out: 'ongoing',
  confirm_out: 'ongoing',
  attendance_review: 'ongoing',
  upcoming: 'upcoming',
  registered: 'upcoming',
  attendance_closed: 'upcoming',
  ended: 'ended',
  feedback_pending: 'ended',
  feedback_reviewing: 'ended',
  completed: 'ended',
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

const getApprovalStatusTag = (approvalStatus) => {
  switch (approvalStatus) {
    case 'CHO_DUYET':
      return (
        <Tag className={cx('activities-page__status-tag', 'activities-page__status-tag--pending')} color="orange">
          <FontAwesomeIcon icon={faCircleDot} className={cx('activities-page__status-dot')} />
          Chờ duyệt
        </Tag>
      );
    case 'DA_DUYET':
      return (
        <Tag className={cx('activities-page__status-tag', 'activities-page__status-tag--approved')} color="green">
          <FontAwesomeIcon icon={faCircleDot} className={cx('activities-page__status-dot')} />
          Đã duyệt
        </Tag>
      );
    case 'BI_TU_CHOI':
      return (
        <Tag className={cx('activities-page__status-tag', 'activities-page__status-tag--rejected')} color="red">
          <FontAwesomeIcon icon={faCircleDot} className={cx('activities-page__status-dot')} />
          Bị từ chối
        </Tag>
      );
    default:
      return null;
  }
};

export default function TeacherActivitiesPage() {
  const navigate = useNavigate();
  const { setPageActions } = useContext(TeacherPageContext);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    setPageActions([
      {
        key: 'add',
        label: 'Thêm mới hoạt động mới',
        icon: <FontAwesomeIcon icon={faPlus} />,
        type: 'primary',
        className: 'admin-navbar__add-button',
        onClick: () => navigate(ROUTE_PATHS.TEACHER.ACTIVITY_CREATE),
      },
    ]);

    return () => setPageActions(null);
  }, [setPageActions, navigate]);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ACTIVITIES_QUERY_KEY,
    queryFn: activitiesApi.list,
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

      const matchesApprovalStatus =
        selectedApprovalStatus === 'all' || activity.approvalStatus === selectedApprovalStatus;

      const matchesDate =
        !selectedDate || (activity.startTime && dayjs(activity.startTime).isSame(selectedDate, 'day'));

      return matchesSearch && matchesGroup && matchesApprovalStatus && matchesDate;
    });
  }, [activities, debouncedSearch, selectedGroup, selectedApprovalStatus, selectedDate]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [debouncedSearch, selectedGroup, selectedApprovalStatus, selectedDate]);

  const columns = useMemo(
    () => [
      {
        title: 'STT',
        dataIndex: 'index',
        key: 'index',
        align: 'center',
        width: 70,
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
        width: 170,
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
        width: 100,
        align: 'center',
        sorter: (a, b) => a.points - b.points,
      },
      {
        title: 'Số lượng',
        dataIndex: 'capacity',
        key: 'capacity',
        width: 120,
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
        const joined = Number.isFinite(Number(record.participantsCount)) ? Number(record.participantsCount) : 0;
        const capacityLabel = record.maxCapacity || 'Không giới hạn';
        return (
          <span>
            {joined}/{capacityLabel}
          </span>
        );
      },
      startTime: ({ value }) => formatDateTime(value),
      endTime: ({ value }) => formatDateTime(value),
      state: ({ record }) => {
        const approvalTag = getApprovalStatusTag(record.approvalStatus);
        return approvalTag || <Tag>Chưa xác định</Tag>;
      },
      actions: ({ record }) => (
        <div className={cx('activities-page__actions')}>
          <Tooltip title="Xem chi tiết">
            <button
              type="button"
              className={cx('activities-page__action-button', 'activities-page__action-button--view')}
              onClick={() => navigate(buildPath.teacherActivityDetail(record.id))}
            >
              <FontAwesomeIcon icon={faEye} />
            </button>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <button
              type="button"
              className={cx('activities-page__action-button', 'activities-page__action-button--edit')}
              onClick={() => navigate(buildPath.teacherActivityEdit(record.id))}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </button>
          </Tooltip>
        </div>
      ),
    }),
    [navigate, pagination],
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
            placeholder="Trạng thái duyệt"
            className={cx('activities-page__filter-select')}
            value={selectedApprovalStatus}
            onChange={setSelectedApprovalStatus}
          >
            <Option value="all">Tất cả trạng thái</Option>
            <Option value="CHO_DUYET">Chờ duyệt</Option>
            <Option value="DA_DUYET">Đã duyệt</Option>
            <Option value="BI_TU_CHOI">Bị từ chối</Option>
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
    </ConfigProvider>
  );
}
