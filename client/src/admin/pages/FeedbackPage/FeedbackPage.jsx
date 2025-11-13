import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, ConfigProvider, Empty, Input, Modal, Pagination, Select, Tag, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRotateRight,
  faCalendarDay,
  faCircleCheck,
  faCircleDot,
  faCircleXmark,
  faEye,
  faFileLines,
  faHourglassHalf,
  faSort,
} from '@fortawesome/free-solid-svg-icons';
import viVN from 'antd/locale/vi_VN';
import AdminTable from '@/admin/components/AdminTable/AdminTable';
import feedbackApi, { FEEDBACK_LIST_QUERY_KEY } from '@/api/feedback.api';
import { ADMIN_DASHBOARD_QUERY_KEY } from '@/api/stats.api';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import useToast from '@/components/Toast/Toast';
import useDebounce from '@/hooks/useDebounce';
import { formatDate, formatDateTime } from '@/utils/datetime';
import styles from './FeedbackPage.module.scss';

const cx = classNames.bind(styles);
const STATUS_META = {
  CHO_DUYET: { label: 'Chờ duyệt', className: 'feedback-page__status-tag--pending' },
  DA_DUYET: { label: 'Đã duyệt', className: 'feedback-page__status-tag--approved' },
  BI_TU_CHOI: { label: 'Từ chối', className: 'feedback-page__status-tag--rejected' },
};

const buildStatusTag = (status, label = '') => {
  const meta = STATUS_META[status] || STATUS_META.CHO_DUYET;
  return (
    <Tag className={cx('feedback-page__status-tag', meta.className)}>
      <FontAwesomeIcon icon={faCircleDot} className={cx('feedback-page__status-dot')} />
      {label || meta.label}
    </Tag>
  );
};

const formatNumber = (value, placeholder = '--') => {
  if (value === undefined || value === null) return placeholder;
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString('vi-VN') : value;
};

function FeedbackPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs, setPageActions } = useContext(AdminPageContext);
  const { contextHolder, open: openToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState();
  const [selectedClass, setSelectedClass] = useState();
  const [selectedActivity, setSelectedActivity] = useState();
  const [selectedStatus, setSelectedStatus] = useState();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [decisionModal, setDecisionModal] = useState({ open: false, status: null });
  const [rejectReason, setRejectReason] = useState('');

  const debouncedSearch = useDebounce(searchTerm, 400);
  const selectedCount = selectedRowKeys.length;
  const isDecisionReject = decisionModal.status === 'BI_TU_CHOI';

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Phản hồi sinh viên', path: ROUTE_PATHS.ADMIN.FEEDBACK },
    ]);
    setPageActions([]);
    return () => {
      setBreadcrumbs(null);
      setPageActions(null);
    };
  }, [setBreadcrumbs, setPageActions]);

  const queryKey = useMemo(
    () => [
      FEEDBACK_LIST_QUERY_KEY,
      {
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: debouncedSearch,
        faculty: selectedFaculty,
        class: selectedClass,
        activityId: selectedActivity,
        status: selectedStatus,
      },
    ],
    [pagination, debouncedSearch, selectedFaculty, selectedClass, selectedActivity, selectedStatus],
  );

  const { data, isFetching, isLoading } = useQuery({
    queryKey,
    queryFn: ({ queryKey: [, params] }) => feedbackApi.list(params),
    keepPreviousData: true,
  });

  const stats = data?.stats ?? {};
  const filters = data?.filters ?? {};
  const feedbacks = data?.feedbacks ?? [];
  const totalItems = data?.pagination?.total ?? 0;

  useEffect(() => {
    if (!feedbacks.length) {
      setSelectedRowKeys([]);
      return;
    }
    setSelectedRowKeys((prev) => prev.filter((key) => feedbacks.some((item) => item.id === key)));
  }, [feedbacks]);

  const decideMutation = useMutation({
    mutationFn: feedbackApi.decide,
    onSuccess: (response) => {
      openToast({
        message: response?.message || 'Cập nhật phản hồi thành công.',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: FEEDBACK_LIST_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_DASHBOARD_QUERY_KEY });
      setSelectedRowKeys([]);
    },
    onError: (error) => {
      openToast({
        message: error.response?.data?.error || 'Không thể cập nhật trạng thái phản hồi.',
        variant: 'danger',
      });
    },
    onSettled: () => {
      setDecisionModal({ open: false, status: null });
      setRejectReason('');
    },
  });

  const handlePageChange = (page, pageSize) => {
    setPagination({ current: page, pageSize });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleSelectChange = (setter) => (value) => {
    setter(value || undefined);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedFaculty(undefined);
    setSelectedClass(undefined);
    setSelectedActivity(undefined);
    setSelectedStatus(undefined);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const openDecisionModal = useCallback(
    (status) => {
      if (!selectedRowKeys.length) return;
      setDecisionModal({ open: true, status });
      setRejectReason('');
    },
    [selectedRowKeys.length],
  );

  const handleConfirmDecision = async () => {
    if (!decisionModal.status || !selectedRowKeys.length) return;

    const payload = {
      ids: selectedRowKeys,
      status: decisionModal.status,
      ...(decisionModal.status === 'BI_TU_CHOI' ? { reason: rejectReason } : {}),
    };

    await decideMutation.mutateAsync(payload);
  };

  const columns = useMemo(
    () => [
      {
        title: 'STT',
        dataIndex: 'index',
        key: 'index',
        width: 70,
        align: 'center',
      },
      {
        title: 'Họ tên',
        dataIndex: ['student', 'name'],
        key: 'student',
        width: 260,
      },
      {
        title: 'MSSV',
        dataIndex: ['student', 'studentCode'],
        key: 'studentCode',
        width: 120,
        sorter: (a, b) => (a.student?.studentCode || '').localeCompare(b.student?.studentCode || ''),
      },
      {
        title: 'Khoa',
        dataIndex: ['student', 'faculty'],
        key: 'faculty',
        width: 180,
        sorter: (a, b) => (a.student?.faculty || '').localeCompare(b.student?.faculty || ''),
      },
      {
        title: 'Lớp',
        dataIndex: ['student', 'className'],
        key: 'className',
        width: 130,
        sorter: (a, b) => (a.student?.className || '').localeCompare(b.student?.className || ''),
      },
      {
        title: 'Hoạt động',
        dataIndex: ['activity', 'title'],
        key: 'activity',
        width: 320,
        sorter: (a, b) => (a.activity?.title || '').localeCompare(b.activity?.title || ''),
      },
      {
        title: 'Ngày gửi',
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        width: 170,
        sorter: (a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 150,
        align: 'center',
        sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
      },
      {
        title: 'Hành động',
        key: 'actions',
        width: 110,
        align: 'center',
      },
    ],
    [],
  );

  const columnRenderers = useMemo(
    () => ({
      index: ({ index }) => (pagination.current - 1) * pagination.pageSize + index + 1,
      student: ({ record }) => {
        const student = record.student || {};
        return (
          <div className={cx('feedback-page__student')}>
            <Avatar src={student.avatarUrl} alt={student.name} className={cx('feedback-page__student-avatar')}>
              {student.name?.[0] ?? '?'}
            </Avatar>
            <div className={cx('feedback-page__student-details')}>
              <strong>{student.name || '--'}</strong>
              <p>{student.email || '—'}</p>
            </div>
          </div>
        );
      },
      studentCode: ({ record }) => record.student?.studentCode || '--',
      faculty: ({ record }) => record.student?.faculty || '--',
      className: ({ record }) => record.student?.className || '--',
      activity: ({ record }) => {
        const activity = record.activity || {};
        return (
          <div className={cx('feedback-page__activity')}>
            <strong>{activity.title || '--'}</strong>
            <p>
              <FontAwesomeIcon icon={faCalendarDay} /> {formatDate(activity.startTime)}
            </p>
          </div>
        );
      },
      submittedAt: ({ value }) => formatDateTime(value),
      status: ({ record }) => buildStatusTag(record.status, record.statusLabel),
      actions: ({ record }) => (
        <Tooltip title="Xem chi tiết">
          <button
            type="button"
            className={cx('feedback-page__action-button')}
            onClick={(event) => {
              event.stopPropagation();
              navigate(buildPath.adminFeedbackDetail(record.id));
            }}
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
        </Tooltip>
      ),
    }),
    [navigate, pagination],
  );

  const statsCards = useMemo(
    () => [
      {
        key: 'total',
        label: 'Tổng minh chứng',
        value: formatNumber(stats.total, isLoading ? '--' : 0),
        color: '#00008B',
        icon: faFileLines,
        bg: '#e8edff',
      },
      {
        key: 'pending',
        label: 'Chờ duyệt',
        value: formatNumber(stats.pending, isLoading ? '--' : 0),
        color: '#DB7B00',
        icon: faHourglassHalf,
        bg: '#fff3e0',
      },
      {
        key: 'approved',
        label: 'Đã duyệt',
        value: formatNumber(stats.approved, isLoading ? '--' : 0),
        color: '#198754',
        icon: faCircleCheck,
        bg: '#e6f8ee',
      },
      {
        key: 'rejected',
        label: 'Từ chối',
        value: formatNumber(stats.rejected, isLoading ? '--' : 0),
        color: '#DC3545',
        icon: faCircleXmark,
        bg: '#fdeaea',
      },
    ],
    [stats, isLoading],
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      disabled: record.status !== 'CHO_DUYET',
    }),
  };

  const canConfirm = isDecisionReject ? rejectReason.trim().length > 0 : true;

  const renderSortIcon = useCallback(
    ({ sortOrder }) => (
      <FontAwesomeIcon
        icon={faSort}
        className={cx('feedback-page__sort-icon', { 'feedback-page__sort-icon--active': sortOrder })}
      />
    ),
    [],
  );

  return (
    <ConfigProvider locale={viVN}>
      {contextHolder}

      <div className={cx('feedback-page')}>
        <section className={cx('feedback-page__stats')}>
          {statsCards.map((item) => (
            <div key={item.key} className={cx('feedback-page__stats-card')}>
              <div className={cx('feedback-page__stats-info')}>
                <p className={cx('feedback-page__stats-label')}>{item.label}</p>
                <h2 className={cx('feedback-page__stats-value')} style={{ color: item.color }}>
                  {item.value}
                </h2>
              </div>
              <div className={cx('feedback-page__stats-icon')} style={{ backgroundColor: item.bg }}>
                <FontAwesomeIcon icon={item.icon} size="lg" color={item.color} />
              </div>
            </div>
          ))}
        </section>

        <div className={cx('feedback-page__filter-bar')}>
          <Input
            placeholder="Tìm kiếm hoạt động, sinh viên..."
            className={cx('feedback-page__filter-search')}
            value={searchTerm}
            onChange={handleSearchChange}
            allowClear
          />
          <Select
            placeholder="Khoa"
            className={cx('feedback-page__filter-select')}
            allowClear
            value={selectedFaculty}
            options={filters.faculties || []}
            optionFilterProp="label"
            onChange={handleSelectChange(setSelectedFaculty)}
          />
          <Select
            placeholder="Lớp"
            className={cx('feedback-page__filter-select')}
            allowClear
            value={selectedClass}
            options={filters.classes || []}
            optionFilterProp="label"
            onChange={handleSelectChange(setSelectedClass)}
          />
          <Select
            placeholder="Hoạt động"
            className={cx('feedback-page__filter-select')}
            allowClear
            showSearch
            value={selectedActivity}
            options={filters.activities || []}
            optionFilterProp="label"
            onChange={handleSelectChange(setSelectedActivity)}
          />
          <Select
            placeholder="Trạng thái"
            className={cx('feedback-page__filter-select')}
            allowClear
            value={selectedStatus}
            options={filters.statuses || []}
            optionFilterProp="label"
            onChange={handleSelectChange(setSelectedStatus)}
          />
          <Button type="primary" icon={<FontAwesomeIcon icon={faArrowRotateRight} />} onClick={handleResetFilters}>
            Đặt lại
          </Button>
        </div>

        <div className={cx('feedback-page__content')}>
          <div className={cx('feedback-page__content-header')}>
            <h3>Danh sách phản hồi</h3>
          </div>
          <AdminTable
            rowKey="id"
            columns={columns}
            dataSource={feedbacks}
            loading={isFetching || decideMutation.isPending}
            rowSelection={rowSelection}
            pagination={false}
            columnRenderers={columnRenderers}
            sortIcon={renderSortIcon}
            className={cx('feedback-page__table')}
            locale={{
              emptyText: <Empty description="Không có phản hồi" />,
            }}
            onRow={(record) => ({
              onClick: (event) => {
                if (event.target.closest('button')) return;
                navigate(buildPath.adminFeedbackDetail(record.id));
              },
            })}
          />
          <div className={cx('feedback-page__pagination')}>
            <div className={cx('feedback-page__selection-info')}>
              Đã chọn <strong>{selectedCount}</strong> trong <strong>{formatNumber(totalItems, 0)}</strong> phản hồi
            </div>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={totalItems}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </div>

        {selectedCount > 0 && (
          <div className={cx('feedback-page__bulk-actions')}>
            <div className={cx('feedback-page__bulk-summary')}>
              <strong>{selectedCount}</strong> sinh viên đã chọn
            </div>
            <div className={cx('feedback-page__bulk-buttons')}>
              <Button onClick={() => setSelectedRowKeys([])}>Bỏ chọn tất cả</Button>
              <Button type="primary" onClick={() => openDecisionModal('DA_DUYET')} loading={decideMutation.isPending}>
                Duyệt đạt
              </Button>
              <Button danger onClick={() => openDecisionModal('BI_TU_CHOI')} loading={decideMutation.isPending}>
                Không đạt
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={decisionModal.open}
        title={decisionModal.status === 'DA_DUYET' ? 'Xác nhận duyệt phản hồi' : 'Từ chối phản hồi'}
        okText={decisionModal.status === 'DA_DUYET' ? 'Duyệt đạt' : 'Từ chối'}
        cancelText="Hủy"
        onCancel={() => {
          setDecisionModal({ open: false, status: null });
          setRejectReason('');
        }}
        onOk={handleConfirmDecision}
        okButtonProps={{ disabled: !canConfirm, loading: decideMutation.isPending }}
        cancelButtonProps={{ disabled: decideMutation.isPending }}
        destroyOnClose
      >
        {isDecisionReject ? (
          <div className={cx('feedback-page__decision-body')}>
            <p>
              Vui lòng nhập lý do từ chối cho <strong>{selectedCount}</strong> phản hồi đã chọn.
            </p>
            <Input.TextArea
              rows={4}
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Nhập lý do từ chối..."
              maxLength={500}
            />
          </div>
        ) : (
          <p>
            Bạn có chắc muốn duyệt <strong>{selectedCount}</strong> phản hồi đã chọn?
          </p>
        )}
      </Modal>
    </ConfigProvider>
  );
}

export default FeedbackPage;
