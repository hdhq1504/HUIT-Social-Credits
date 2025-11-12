import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Input, Modal, Pagination, Select, Table, Tag, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleDot, faPenToSquare, faSearch, faSort, faTrashCan, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import usersApi, { USERS_QUERY_KEY } from '@/api/users.api';
import useDebounce from '@/hooks/useDebounce';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS, buildPath } from '@/config/routes.config';
import useToast from '@/components/Toast/Toast';
import styles from './UsersPage.module.scss';

const cx = classNames.bind(styles);

const ROLE_OPTIONS = [
  { label: 'Tất cả vai trò', value: 'all' },
  { label: 'Sinh viên', value: 'SINHVIEN' },
  { label: 'Giảng viên', value: 'GIANGVIEN' },
  { label: 'Nhân viên', value: 'NHANVIEN' },
  { label: 'Quản trị viên', value: 'ADMIN' },
];

const STATUS_OPTIONS = [
  { label: 'Tất cả trạng thái', value: 'all' },
  { label: 'Đang hoạt động', value: 'active' },
  { label: 'Ngưng hoạt động', value: 'inactive' },
];

const ROLE_LABELS = {
  SINHVIEN: 'Sinh viên',
  GIANGVIEN: 'Giảng viên',
  NHANVIEN: 'Nhân viên',
  ADMIN: 'Quản trị viên',
};

const formatDateTime = (value, placeholder = 'Chưa đăng nhập') => {
  if (!value) return placeholder;
  return dayjs(value).format('HH:mm DD/MM/YYYY');
};

const toTimeValue = (value) => (value ? dayjs(value).valueOf() : 0);

const buildStatusTag = (isActive) => (
  <Tag className={cx('users-page__status-tag', isActive ? '--active' : '--inactive')}>
    <FontAwesomeIcon icon={faCircleDot} className={cx('users-page__status-icon')} />
    {isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
  </Tag>
);

const mapIdentifier = (user) => {
  if (user.studentCode) return user.studentCode;
  if (user.staffCode) return user.staffCode;
  return '--';
};

export default function UsersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPageActions, setBreadcrumbs } = useContext(AdminPageContext);
  const { contextHolder, open: openToast } = useToast();
  const [searchValue, setSearchValue] = useState('');
  const [roleValue, setRoleValue] = useState('all');
  const [statusValue, setStatusValue] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const debouncedSearch = useDebounce(searchValue, 400);

  const handleCreateUser = useCallback(() => {
    navigate(ROUTE_PATHS.ADMIN.USER_CREATE);
  }, [navigate]);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Quản lý người dùng', path: ROUTE_PATHS.ADMIN.USERS },
    ]);
    setPageActions([
      <Button
        key="create-user"
        type="primary"
        icon={<FontAwesomeIcon icon={faUserPlus} />}
        onClick={handleCreateUser}
        className={cx('users-page__create-button')}
      >
        Thêm người dùng
      </Button>,
    ]);

    return () => {
      setBreadcrumbs(null);
      setPageActions(null);
    };
  }, [handleCreateUser, setBreadcrumbs, setPageActions]);

  const queryKey = useMemo(
    () => [
      USERS_QUERY_KEY,
      {
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: debouncedSearch.trim(),
        role: roleValue,
        status: statusValue,
      },
    ],
    [pagination, debouncedSearch, roleValue, statusValue],
  );

  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: ({ queryKey: [, params] }) => usersApi.list(params),
    keepPreviousData: true,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => usersApi.remove(userId),
    onSuccess: (response) => {
      openToast({ message: response?.message || 'Đã xóa người dùng.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
    onError: (error) => {
      openToast({ message: error.response?.data?.error || 'Không thể xóa người dùng.', variant: 'danger' });
    },
  });

  const users = data?.users ?? [];
  const totalItems = data?.pagination?.total ?? 0;

  const handleEditUser = useCallback(
    (userId) => {
      navigate(buildPath.adminUserEdit(userId));
    },
    [navigate],
  );

  const handleDeleteUser = useCallback(
    (record) => {
      if (!record?.id) return;
      const displayName = record.fullName || record.email || 'người dùng này';
      Modal.confirm({
        title: 'Xóa người dùng',
        content: (
          <span>
            Bạn có chắc chắn muốn xóa <strong>{displayName}</strong> khỏi hệ thống?
          </span>
        ),
        okText: 'Xóa',
        cancelText: 'Hủy',
        okButtonProps: { danger: true },
        centered: true,
        onOk: () => deleteUserMutation.mutateAsync(record.id),
      });
    },
    [deleteUserMutation],
  );

  const renderSortIcon = useCallback(
    ({ sortOrder }) => (
      <FontAwesomeIcon icon={faSort} className={cx('users-page__sort-icon', { '--active': Boolean(sortOrder) })} />
    ),
    [],
  );

  const isDeletingUser = deleteUserMutation.isLoading;

  const handleResetFilters = () => {
    setSearchValue('');
    setRoleValue('all');
    setStatusValue('all');
    setPagination((prev) => ({ current: 1, pageSize: prev.pageSize }));
  };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleRoleChange = (value) => {
    setRoleValue(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = (value) => {
    setStatusValue(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handlePaginationChange = (page, pageSize) => {
    setPagination((prev) => ({ current: pageSize !== prev.pageSize ? 1 : page, pageSize }));
  };

  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: 'STT',
        dataIndex: 'index',
        key: 'index',
        width: 70,
        align: 'center',
        sorter: (a, b) => toTimeValue(a.createdAt) - toTimeValue(b.createdAt),
        render: (_value, _record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
      },
      {
        title: 'Thông tin người dùng',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 280,
        sorter: (a, b) => (a.fullName || '').localeCompare(b.fullName || ''),
        render: (_value, record) => (
          <div className={cx('users-page__user-cell')}>
            <Avatar size={44} src={record.avatarUrl} className={cx('users-page__avatar')}>
              {(record.fullName || record.email || '?').charAt(0).toUpperCase()}
            </Avatar>
            <div className={cx('users-page__user-info')}>
              <strong>{record.fullName || '--'}</strong>
              <span>{record.email || '--'}</span>
            </div>
          </div>
        ),
      },
      {
        title: 'Mã định danh',
        dataIndex: 'identifier',
        key: 'identifier',
        width: 160,
        sorter: (a, b) => mapIdentifier(a).localeCompare(mapIdentifier(b)),
        render: (_value, record) => mapIdentifier(record),
      },
      {
        title: 'Vai trò',
        dataIndex: 'role',
        key: 'role',
        width: 150,
        sorter: (a, b) => (a.role || '').localeCompare(b.role || ''),
        render: (role) => ROLE_LABELS[role] || role || '--',
      },
      {
        title: 'Khoa / Lớp',
        dataIndex: 'departmentCode',
        key: 'department',
        width: 200,
        sorter: (a, b) =>
          `${a.departmentCode || ''} ${a.classCode || ''}`.localeCompare(
            `${b.departmentCode || ''} ${b.classCode || ''}`,
          ),
        render: (_value, record) => (
          <div className={cx('users-page__meta-cell')}>
            <strong>{record.departmentCode || '--'}</strong>
            <span>{record.classCode || '--'}</span>
          </div>
        ),
      },
      {
        title: 'Số điện thoại',
        dataIndex: 'phoneNumber',
        key: 'phoneNumber',
        width: 160,
        sorter: (a, b) => (a.phoneNumber || '').localeCompare(b.phoneNumber || ''),
        render: (value) => value || '--',
      },
      {
        title: 'Trạng thái',
        dataIndex: 'isActive',
        key: 'status',
        width: 180,
        sorter: (a, b) => Number(Boolean(a.isActive)) - Number(Boolean(b.isActive)),
        render: (value) => buildStatusTag(Boolean(value)),
      },
      {
        title: 'Lần đăng nhập cuối',
        dataIndex: 'lastLoginAt',
        key: 'lastLoginAt',
        width: 220,
        sorter: (a, b) => toTimeValue(a.lastLoginAt) - toTimeValue(b.lastLoginAt),
        render: (value) => formatDateTime(value),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 160,
        align: 'center',
        render: (_value, record) => (
          <div className={cx('users-page__actions')}>
            <Tooltip title="Chỉnh sửa">
              <button
                type="button"
                className={cx('users-page__action-button')}
                onClick={(event) => {
                  event.stopPropagation();
                  handleEditUser(record.id);
                }}
              >
                <FontAwesomeIcon icon={faPenToSquare} />
              </button>
            </Tooltip>
            <Tooltip title="Xóa người dùng">
              <button
                type="button"
                className={cx('users-page__action-button', '--delete')}
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteUser(record);
                }}
                disabled={isDeletingUser}
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </Tooltip>
          </div>
        ),
      },
    ];

    return baseColumns.map((column) => (column.sorter ? { ...column, sortIcon: renderSortIcon } : column));
  }, [pagination, renderSortIcon, handleEditUser, handleDeleteUser, isDeletingUser]);

  const hasUsers = users.length > 0;
  const startIndex = hasUsers ? (pagination.current - 1) * pagination.pageSize + 1 : 0;
  const endIndex = hasUsers ? startIndex + users.length - 1 : 0;

  return (
    <>
      {contextHolder}
      <div className={cx('users-page__wrapper')}>
        <div className={cx('users-page__filter-bar')}>
          <Input
            size="large"
            allowClear
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm người dùng..."
            prefix={<FontAwesomeIcon icon={faSearch} />}
            className={cx('users-page__filter-input')}
          />

          <Select
            size="large"
            value={roleValue}
            onChange={handleRoleChange}
            options={ROLE_OPTIONS}
            className={cx('users-page__filter-select')}
          />

          <Select
            size="large"
            value={statusValue}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
            className={cx('users-page__filter-select')}
          />

          <Button size="large" onClick={handleResetFilters} className={cx('users-page__reset-button')}>
            Đặt lại
          </Button>
        </div>

        <div className={cx('users-page__content-box')}>
          <div className={cx('users-page__content-header')}>
            <h3>Danh sách người dùng</h3>
            <span className={cx('users-page__content-summary')}>
              {totalItems ? `${totalItems.toLocaleString('vi-VN')} người dùng` : 'Không có dữ liệu'}
            </span>
          </div>

          <div className={cx('users-page__table-wrapper')}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={users}
              loading={isFetching}
              pagination={false}
              sortDirections={['ascend', 'descend']}
              className={cx('users-page__table')}
            />
          </div>

          <div className={cx('users-page__pagination')}>
            <div className={cx('users-page__pagination-summary')}>
              {totalItems
                ? hasUsers
                  ? `Đang hiển thị ${startIndex}-${endIndex} trong ${totalItems.toLocaleString('vi-VN')} người dùng`
                  : 'Không tìm thấy người dùng phù hợp'
                : 'Không có người dùng'}
            </div>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={totalItems}
              pageSizeOptions={['10', '20', '50', '100']}
              showSizeChanger
              onChange={handlePaginationChange}
            />
          </div>
        </div>
      </div>
    </>
  );
}
