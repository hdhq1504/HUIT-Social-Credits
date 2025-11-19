import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Input, Modal, Pagination, Select, Tag, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleDot, faArrowRotateRight, faPenToSquare, faSearch, faSort, faTrash, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import AdminTable from '@/admin/components/AdminTable/AdminTable';
import studentsApi, { STUDENTS_QUERY_KEY } from '@/api/students.api';
import useDebounce from '@/hooks/useDebounce';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import useToast from '@/components/Toast/Toast';
import styles from './StudentsPage.module.scss';

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
      'students-page__status-tag',
      isActive ? 'students-page__status-tag--active' : 'students-page__status-tag--inactive',
    )}
  >
    <FontAwesomeIcon icon={faCircleDot} className={cx('students-page__status-icon')} />
    {isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
  </Tag>
);

export default function StudentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageActions, setBreadcrumbs } = useContext(AdminPageContext);
  const { contextHolder, open: openToast } = useToast();
  const [searchValue, setSearchValue] = useState('');
  const [statusValue, setStatusValue] = useState('all');
  const [facultyValue, setFacultyValue] = useState('all');
  const [classValue, setClassValue] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const debouncedSearch = useDebounce(searchValue, 400);

  // Mock Faculty Data - In a real app, this should come from an API
  // Since I don't have a Faculty API yet, I'll hardcode some or try to fetch if possible.
  // The user requirement mentioned "filter by faculty", implying faculties exist.
  // I'll use a placeholder for now or check if I can fetch them.
  // Looking at the backend, `LopHoc` has `khoaId`.
  // I'll assume there's an API or I'll just use text input for now if no API.
  // Wait, `studentsApi.getClassesByFaculty` exists.
  // But I need a list of faculties first.
  // I'll check if there's a `faculties` endpoint.
  // For now, I will use a hardcoded list of faculties based on common data or leave it as a future improvement.
  // Actually, I can't filter by faculty ID if I don't have the IDs.
  // I'll use a text input for Faculty ID or just assume some exist.
  // Better yet, I'll add a TODO to fetch faculties.
  
  const { data: facultiesData } = useQuery({
    queryKey: ['admin', 'faculties'],
    queryFn: studentsApi.getFaculties,
  });

  const FACULTY_OPTIONS = useMemo(() => {
    if (!facultiesData) return [{ label: 'Tất cả khoa', value: 'all' }];
    return [
      { label: 'Tất cả khoa', value: 'all' },
      ...facultiesData.map((f) => ({ label: f.tenKhoa, value: f.id })),
    ];
  }, [facultiesData]);

  const { data: classesData } = useQuery({
    queryKey: ['admin', 'classes', facultyValue],
    queryFn: () => studentsApi.getClassesByFaculty(facultyValue),
    enabled: facultyValue !== 'all',
  });

  const classOptions = useMemo(() => {
    if (!classesData) return [{ label: 'Tất cả lớp', value: 'all' }];
    return [
      { label: 'Tất cả lớp', value: 'all' },
      ...classesData.map((cls) => ({ label: cls.maLop, value: cls.id })),
    ];
  }, [classesData]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Quản lý sinh viên', path: ROUTE_PATHS.ADMIN.STUDENTS },
    ]);
    setPageActions([
      {
        key: 'create',
        label: 'Thêm sinh viên',
        type: 'primary',
        className: 'admin-navbar__add-button',
        icon: <FontAwesomeIcon icon={faUserPlus} />,
        onClick: () => navigate(ROUTE_PATHS.ADMIN.USER_CREATE), // Should probably be STUDENT_CREATE
      },
    ]);
    return () => {
      setBreadcrumbs(null);
      setPageActions(null);
    };
  }, [setBreadcrumbs, setPageActions, navigate]);

  const queryKey = useMemo(
    () => [
      STUDENTS_QUERY_KEY,
      {
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: debouncedSearch.trim(),
        status: statusValue,
        khoaId: facultyValue !== 'all' ? facultyValue : undefined,
        lopId: classValue !== 'all' ? classValue : undefined,
      },
    ],
    [pagination, debouncedSearch, statusValue, facultyValue, classValue],
  );

  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: ({ queryKey: [, params] }) => studentsApi.list(params),
    keepPreviousData: true,
  });

  const deleteStudentMutation = useMutation({
    mutationFn: (id) => studentsApi.remove(id),
    onSuccess: (response) => {
      openToast({ message: response?.message || 'Đã xóa sinh viên.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể xóa sinh viên.', variant: 'danger' });
    },
  });

  const students = data?.students ?? [];
  const totalItems = data?.pagination?.total ?? 0;

  const handleEditStudent = useCallback(
    (id) => {
      navigate(buildPath.adminUserEdit(id)); // Reuse user edit for now
    },
    [navigate],
  );

  const handleDeleteStudent = useCallback(
    (record) => {
      if (!record?.id) return;
      const displayName = record.fullName || record.studentCode || 'sinh viên này';
      Modal.confirm({
        title: 'Xóa sinh viên',
        content: (
          <span>
            Bạn có chắc chắn muốn xóa <strong>{displayName}</strong> khỏi hệ thống?
          </span>
        ),
        okText: 'Xóa',
        cancelText: 'Hủy',
        okButtonProps: { danger: true },
        centered: true,
        onOk: () => deleteStudentMutation.mutateAsync(record.id),
      });
    },
    [deleteStudentMutation],
  );

  const renderSortIcon = useCallback(
    ({ sortOrder }) => (
      <FontAwesomeIcon
        icon={faSort}
        className={cx('students-page__sort-icon', { 'students-page__sort-icon--active': Boolean(sortOrder) })}
      />
    ),
    [],
  );

  const isDeleting = deleteStudentMutation.isLoading;

  const handleResetFilters = () => {
    setSearchValue('');
    setStatusValue('all');
    setFacultyValue('all');
    setClassValue('all');
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

  const handleFacultyChange = (value) => {
    setFacultyValue(value);
    setClassValue('all'); // Reset class when faculty changes
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleClassChange = (value) => {
    setClassValue(value);
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
        title: 'Thông tin sinh viên',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 280,
        sorter: (a, b) => (a.fullName || '').localeCompare(b.fullName || ''),
      },
      {
        title: 'MSSV',
        dataIndex: 'studentCode',
        key: 'studentCode',
        width: 140,
        sorter: (a, b) => (a.studentCode || '').localeCompare(b.studentCode || ''),
      },
      {
        title: 'Lớp',
        dataIndex: 'classCode',
        key: 'classCode',
        width: 120,
        sorter: (a, b) => (a.classCode || '').localeCompare(b.classCode || ''),
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
        width: 140,
        align: 'center',
      },
    ],
    [],
  );

  const columnRenderers = useMemo(
    () => ({
      index: ({ index }) => (pagination.current - 1) * pagination.pageSize + index + 1,
      fullName: ({ record }) => (
        <div className={cx('students-page__user-cell')}>
          <Avatar size={40} src={record.avatarUrl} className={cx('students-page__avatar')}>
            {(record.fullName || record.email || '?').charAt(0).toUpperCase()}
          </Avatar>
          <div className={cx('students-page__user-info')}>
            <strong>{record.fullName || '--'}</strong>
            <span>{record.email || '--'}</span>
          </div>
        </div>
      ),
      studentCode: ({ value }) => value || '--',
      classCode: ({ value }) => value || '--',
      department: ({ value }) => value || '--',
      status: ({ value }) => buildStatusTag(Boolean(value)),
      lastLoginAt: ({ value }) => formatDateTime(value),
      actions: ({ record }) => (
        <div className={cx('students-page__actions')}>
          <Tooltip title="Chỉnh sửa">
            <button
              type="button"
              className={cx('students-page__action-button', 'students-page__action-button--edit')}
              onClick={(event) => {
                event.stopPropagation();
                handleEditStudent(record.id);
              }}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </button>
          </Tooltip>
          <Tooltip title="Xóa sinh viên">
            <button
              type="button"
              className={cx('students-page__action-button', 'students-page__action-button--delete')}
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteStudent(record);
              }}
              disabled={isDeleting}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </Tooltip>
        </div>
      ),
    }),
    [handleDeleteStudent, handleEditStudent, isDeleting, pagination],
  );

  const hasStudents = students.length > 0;
  const startIndex = hasStudents ? (pagination.current - 1) * pagination.pageSize + 1 : 0;
  const endIndex = hasStudents ? startIndex + students.length - 1 : 0;

  return (
    <>
      {contextHolder}
      <div className={cx('students-page')}>
        <div className={cx('students-page__filter-bar')}>
          <Input
            size="large"
            allowClear
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm sinh viên..."
            prefix={<FontAwesomeIcon icon={faSearch} />}
            className={cx('students-page__filter-search')}
          />

          <Select
            size="large"
            value={facultyValue}
            onChange={handleFacultyChange}
            options={FACULTY_OPTIONS}
            className={cx('students-page__filter-select')}
            placeholder="Chọn khoa"
          />

          <Select
            size="large"
            value={classValue}
            onChange={handleClassChange}
            options={classOptions}
            className={cx('students-page__filter-select')}
            placeholder="Chọn lớp"
            disabled={facultyValue === 'all'}
          />

          <Select
            size="large"
            value={statusValue}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
            className={cx('students-page__filter-select')}
          />

          <Button size="large" onClick={handleResetFilters} className={cx('students-page__reset-button')}>
            <FontAwesomeIcon icon={faArrowRotateRight} />
            Đặt lại
          </Button>
        </div>

        <div className={cx('students-page__content')}>
          <div className={cx('students-page__content-header')}>
            <h3>Danh sách sinh viên</h3>
            <span className={cx('students-page__content-summary')}>
              {totalItems ? `${totalItems.toLocaleString('vi-VN')} sinh viên` : 'Không có dữ liệu'}
            </span>
          </div>

          <div className={cx('students-page__table-wrapper')}>
            <AdminTable
              rowKey="id"
              columns={columns}
              dataSource={students}
              loading={isFetching}
              columnRenderers={columnRenderers}
              pagination={false}
              sortIcon={renderSortIcon}
              className={cx('students-page__table')}
            />
          </div>

          <div className={cx('students-page__pagination')}>
            <div className={cx('students-page__pagination-summary')}>
              {totalItems
                ? hasStudents
                  ? `Đang hiển thị ${startIndex}-${endIndex} trong ${totalItems.toLocaleString('vi-VN')} sinh viên`
                  : 'Không tìm thấy sinh viên phù hợp'
                : 'Không có sinh viên'}
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
    </>
  );
}
