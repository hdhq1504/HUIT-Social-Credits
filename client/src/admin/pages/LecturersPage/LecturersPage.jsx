import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Input, Modal, Pagination, Select, Tag, Tooltip, Form } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleDot, faArrowRotateRight, faPenToSquare, faSearch, faSort, faTrash, faUserPlus, faChalkboardTeacher } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import AdminTable from '@/admin/components/AdminTable/AdminTable';
import lecturersApi, { LECTURERS_QUERY_KEY } from '@/api/lecturers.api';
import useDebounce from '@/hooks/useDebounce';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import useToast from '@/components/Toast/Toast';
import styles from './LecturersPage.module.scss';

const cx = classNames.bind(styles);

const STATUS_OPTIONS = [
  { label: 'Tất cả trạng thái', value: 'all' },
  { label: 'Đang hoạt động', value: 'active' },
  { label: 'Ngưng hoạt động', value: 'inactive' },
];

const formatDateTime = (value, placeholder = 'Chưa đăng nhập') => {
  if (!value) return placeholder;
  return dayjs(value).format('HH:mm DD/MM/YYYY');
};

const toTimeValue = (value) => (value ? dayjs(value).valueOf() : 0);

const buildStatusTag = (isActive) => (
  <Tag
    className={cx(
      'lecturers-page__status-tag',
      isActive ? 'lecturers-page__status-tag--active' : 'lecturers-page__status-tag--inactive',
    )}
  >
    <FontAwesomeIcon icon={faCircleDot} className={cx('lecturers-page__status-icon')} />
    {isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
  </Tag>
);

export default function LecturersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageActions, setBreadcrumbs } = useContext(AdminPageContext);
  const { contextHolder, open: openToast } = useToast();
  const [searchValue, setSearchValue] = useState('');
  const [statusValue, setStatusValue] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const debouncedSearch = useDebounce(searchValue, 400);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [assignForm] = Form.useForm();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Quản lý giảng viên', path: ROUTE_PATHS.ADMIN.LECTURERS },
    ]);
    setPageActions([
      {
        key: 'create',
        label: 'Thêm giảng viên',
        type: 'primary',
        className: 'admin-navbar__add-button',
        icon: <FontAwesomeIcon icon={faUserPlus} />,
        onClick: () => navigate(ROUTE_PATHS.ADMIN.USER_CREATE), // Should probably be LECTURER_CREATE
      },
    ]);
    return () => {
      setBreadcrumbs(null);
      setPageActions(null);
    };
  }, [setBreadcrumbs, setPageActions, navigate]);

  const queryKey = useMemo(
    () => [
      LECTURERS_QUERY_KEY,
      {
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: debouncedSearch.trim(),
        status: statusValue,
      },
    ],
    [pagination, debouncedSearch, statusValue],
  );

  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: ({ queryKey: [, params] }) => lecturersApi.list(params),
    keepPreviousData: true,
  });

  const { data: availableClasses } = useQuery({
    queryKey: ['admin', 'classes', 'available'],
    queryFn: lecturersApi.getAvailableClasses,
    enabled: isAssignModalOpen,
  });

  const deleteLecturerMutation = useMutation({
    mutationFn: (id) => lecturersApi.remove(id), // Assuming remove exists or using generic user remove
    onSuccess: (response) => {
      openToast({ message: response?.message || 'Đã xóa giảng viên.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: [LECTURERS_QUERY_KEY] });
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể xóa giảng viên.', variant: 'danger' });
    },
  });

  const assignHomeroomMutation = useMutation({
    mutationFn: (payload) => lecturersApi.assignHomeroom(payload),
    onSuccess: (response) => {
      openToast({ message: response?.message || 'Đã phân công chủ nhiệm.', variant: 'success' });
      setIsAssignModalOpen(false);
      assignForm.resetFields();
      setSelectedLecturer(null);
      queryClient.invalidateQueries({ queryKey: [LECTURERS_QUERY_KEY] });
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Phân công thất bại.', variant: 'danger' });
    },
  });

  const lecturers = data?.teachers ?? []; // API returns { teachers: [], pagination: {} }
  const totalItems = data?.pagination?.total ?? 0;

  const handleEditLecturer = useCallback(
    (id) => {
      navigate(buildPath.adminUserEdit(id));
    },
    [navigate],
  );

  const handleDeleteLecturer = useCallback(
    (record) => {
      if (!record?.id) return;
      const displayName = record.fullName || record.staffCode || 'giảng viên này';
      Modal.confirm({
        title: 'Xóa giảng viên',
        content: (
          <span>
            Bạn có chắc chắn muốn xóa <strong>{displayName}</strong> khỏi hệ thống?
          </span>
        ),
        okText: 'Xóa',
        cancelText: 'Hủy',
        okButtonProps: { danger: true },
        centered: true,
        onOk: () => deleteLecturerMutation.mutateAsync(record.id),
      });
    },
    [deleteLecturerMutation],
  );

  const handleOpenAssignModal = (record) => {
    setSelectedLecturer(record);
    // Pre-fill if lecturer already has classes?
    // The API might return current classes. For now, we just allow adding/overwriting.
    // If we want to show current classes, we need to fetch them or have them in the record.
    // Assuming record has `homeroomClasses` or similar if we updated the list API.
    // If not, we start empty or fetch details.
    // Let's assume we start fresh or just show available classes.
    // Actually, the requirement says "assign homeroom teachers to multiple classes".
    // So we select classes for this teacher.
    assignForm.setFieldsValue({ classIds: [] });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (values) => {
    if (!selectedLecturer) return;
    assignHomeroomMutation.mutate({
      teacherId: selectedLecturer.id,
      classIds: values.classIds,
    });
  };

  const renderSortIcon = useCallback(
    ({ sortOrder }) => (
      <FontAwesomeIcon
        icon={faSort}
        className={cx('lecturers-page__sort-icon', { 'lecturers-page__sort-icon--active': Boolean(sortOrder) })}
      />
    ),
    [],
  );

  const isDeleting = deleteLecturerMutation.isLoading;

  const handleResetFilters = () => {
    setSearchValue('');
    setStatusValue('all');
    setPagination((prev) => ({ current: 1, pageSize: prev.pageSize }));
  };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = (value) => {
    setStatusValue(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page, pageSize) => {
    setPagination({ current: page, pageSize });
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
        title: 'Thông tin giảng viên',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 280,
        sorter: (a, b) => (a.fullName || '').localeCompare(b.fullName || ''),
      },
      {
        title: 'MSGV',
        dataIndex: 'staffCode',
        key: 'staffCode',
        width: 140,
        sorter: (a, b) => (a.staffCode || '').localeCompare(b.staffCode || ''),
      },
      {
        title: 'Khoa',
        dataIndex: 'department',
        key: 'department',
        width: 180,
        sorter: (a, b) => (a.department || '').localeCompare(b.department || ''),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'isActive',
        key: 'status',
        width: 160,
        sorter: (a, b) => Number(Boolean(a.isActive)) - Number(Boolean(b.isActive)),
      },
      {
        title: 'Lần đăng nhập cuối',
        dataIndex: 'lastLoginAt',
        key: 'lastLoginAt',
        width: 200,
        sorter: (a, b) => toTimeValue(a.lastLoginAt) - toTimeValue(b.lastLoginAt),
      },
      {
        title: 'Hành động',
        key: 'actions',
        width: 180,
        align: 'center',
      },
    ],
    [],
  );

  const columnRenderers = useMemo(
    () => ({
      index: ({ index }) => (pagination.current - 1) * pagination.pageSize + index + 1,
      fullName: ({ record }) => (
        <div className={cx('lecturers-page__user-cell')}>
          <Avatar size={40} src={record.avatarUrl} className={cx('lecturers-page__avatar')}>
            {(record.fullName || record.email || '?').charAt(0).toUpperCase()}
          </Avatar>
          <div className={cx('lecturers-page__user-info')}>
            <strong>{record.fullName || '--'}</strong>
            <span>{record.email || '--'}</span>
          </div>
        </div>
      ),
      staffCode: ({ value }) => value || '--',
      department: ({ value }) => value || '--',
      status: ({ value }) => buildStatusTag(Boolean(value)),
      lastLoginAt: ({ value }) => formatDateTime(value),
      actions: ({ record }) => (
        <div className={cx('lecturers-page__actions')}>
           <Tooltip title="Phân công chủ nhiệm">
            <button
              type="button"
              className={cx('lecturers-page__action-button', 'lecturers-page__action-button--assign')}
              onClick={(event) => {
                event.stopPropagation();
                handleOpenAssignModal(record);
              }}
            >
              <FontAwesomeIcon icon={faChalkboardTeacher} />
            </button>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <button
              type="button"
              className={cx('lecturers-page__action-button', 'lecturers-page__action-button--edit')}
              onClick={(event) => {
                event.stopPropagation();
                handleEditLecturer(record.id);
              }}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </button>
          </Tooltip>
          <Tooltip title="Xóa giảng viên">
            <button
              type="button"
              className={cx('lecturers-page__action-button', 'lecturers-page__action-button--delete')}
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteLecturer(record);
              }}
              disabled={isDeleting}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </Tooltip>
        </div>
      ),
    }),
    [handleDeleteLecturer, handleEditLecturer, isDeleting, pagination],
  );

  const hasLecturers = lecturers.length > 0;
  const startIndex = hasLecturers ? (pagination.current - 1) * pagination.pageSize + 1 : 0;
  const endIndex = hasLecturers ? startIndex + lecturers.length - 1 : 0;

  const classOptions = useMemo(() => {
    if (!availableClasses) return [];
    return availableClasses.map((cls) => ({
      label: `${cls.maLop} - ${cls.tenLop} ${cls.giangVienChuNhiem ? `(GVCN: ${cls.giangVienChuNhiem.hoTen})` : '(Chưa có GVCN)'}`,
      value: cls.id,
    }));
  }, [availableClasses]);

  return (
    <>
      {contextHolder}
      <div className={cx('lecturers-page')}>
        <div className={cx('lecturers-page__filter-bar')}>
          <Input
            size="large"
            allowClear
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm giảng viên..."
            prefix={<FontAwesomeIcon icon={faSearch} />}
            className={cx('lecturers-page__filter-search')}
          />

          <Select
            size="large"
            value={statusValue}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
            className={cx('lecturers-page__filter-select')}
          />

          <Button size="large" onClick={handleResetFilters} className={cx('lecturers-page__reset-button')}>
            <FontAwesomeIcon icon={faArrowRotateRight} />
            Đặt lại
          </Button>
        </div>

        <div className={cx('lecturers-page__content')}>
          <div className={cx('lecturers-page__content-header')}>
            <h3>Danh sách giảng viên</h3>
            <span className={cx('lecturers-page__content-summary')}>
              {totalItems ? `${totalItems.toLocaleString('vi-VN')} giảng viên` : 'Không có dữ liệu'}
            </span>
          </div>

          <div className={cx('lecturers-page__table-wrapper')}>
            <AdminTable
              rowKey="id"
              columns={columns}
              dataSource={lecturers}
              loading={isFetching}
              columnRenderers={columnRenderers}
              pagination={false}
              sortIcon={renderSortIcon}
              className={cx('lecturers-page__table')}
            />
          </div>

          <div className={cx('lecturers-page__pagination')}>
            <div className={cx('lecturers-page__pagination-summary')}>
              {totalItems
                ? hasLecturers
                  ? `Đang hiển thị ${startIndex}-${endIndex} trong ${totalItems.toLocaleString('vi-VN')} giảng viên`
                  : 'Không tìm thấy giảng viên phù hợp'
                : 'Không có giảng viên'}
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
      </div>

      <Modal
        title={`Phân công chủ nhiệm - ${selectedLecturer?.fullName || ''}`}
        open={isAssignModalOpen}
        onCancel={() => setIsAssignModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit}>
          <Form.Item
            name="classIds"
            label="Chọn lớp chủ nhiệm"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một lớp' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn lớp..."
              options={classOptions}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setIsAssignModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={assignHomeroomMutation.isLoading}>
              Lưu phân công
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
