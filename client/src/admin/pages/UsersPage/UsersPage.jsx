import React, { useCallback, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Button, Input, Pagination, Select, Table, Tag } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleDot, faSearch } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import usersApi, { USERS_QUERY_KEY } from '@/api/users.api';
import useDebounce from '@/hooks/useDebounce';
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
  const [searchValue, setSearchValue] = useState('');
  const [roleValue, setRoleValue] = useState('all');
  const [statusValue, setStatusValue] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [sortState, setSortState] = useState({ sortBy: 'createdAt', sortOrder: 'descend' });

  const debouncedSearch = useDebounce(searchValue, 400);

  const queryKey = useMemo(
    () => [
      USERS_QUERY_KEY,
      {
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: debouncedSearch.trim(),
        role: roleValue,
        status: statusValue,
        sortBy: sortState.sortBy,
        sortOrder: sortState.sortOrder === 'ascend' ? 'asc' : 'desc',
      },
    ],
    [pagination, debouncedSearch, roleValue, statusValue, sortState],
  );

  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: ({ queryKey: [, params] }) => usersApi.list(params),
    keepPreviousData: true,
  });

  const users = data?.users ?? [];
  const totalItems = data?.pagination?.total ?? 0;

  const handleResetFilters = () => {
    setSearchValue('');
    setRoleValue('all');
    setStatusValue('all');
    setPagination((prev) => ({ current: 1, pageSize: prev.pageSize }));
    setSortState({ sortBy: 'createdAt', sortOrder: 'descend' });
  };

  const handleTableChange = (nextPagination, _filters, sorter) => {
    if (nextPagination?.current && nextPagination?.pageSize) {
      setPagination({ current: nextPagination.current, pageSize: nextPagination.pageSize });
    }

    if (Array.isArray(sorter)) return;

    if (!sorter?.order) {
      setSortState({ sortBy: 'createdAt', sortOrder: 'descend' });
      return;
    }

    const nextSortBy = sorter.field || sorter.columnKey || 'createdAt';
    setSortState({ sortBy: nextSortBy, sortOrder: sorter.order });
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

  const getSortOrderForColumn = useCallback(
    (columnKey) => (sortState.sortBy === columnKey ? sortState.sortOrder : null),
    [sortState],
  );

  const handlePaginationChange = (page, pageSize) => {
    setPagination((prev) => ({ current: pageSize !== prev.pageSize ? 1 : page, pageSize }));
  };

  const columns = useMemo(
    () => [
      {
        title: 'STT',
        dataIndex: 'index',
        key: 'index',
        width: 70,
        align: 'center',
        sorter: true,
        columnKey: 'createdAt',
        sortOrder: getSortOrderForColumn('createdAt'),
        render: (_value, _record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
      },
      {
        title: 'Thông tin người dùng',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 280,
        sorter: true,
        columnKey: 'fullName',
        sortOrder: getSortOrderForColumn('fullName'),
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
        sorter: true,
        columnKey: 'identifier',
        sortOrder: getSortOrderForColumn('identifier'),
        render: (_value, record) => mapIdentifier(record),
      },
      {
        title: 'Vai trò',
        dataIndex: 'role',
        key: 'role',
        width: 150,
        sorter: true,
        columnKey: 'role',
        sortOrder: getSortOrderForColumn('role'),
        render: (role) => ROLE_LABELS[role] || role || '--',
      },
      {
        title: 'Khoa / Lớp',
        dataIndex: 'departmentCode',
        key: 'department',
        width: 200,
        sorter: true,
        columnKey: 'departmentCode',
        sortOrder: getSortOrderForColumn('departmentCode'),
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
        sorter: true,
        columnKey: 'phoneNumber',
        sortOrder: getSortOrderForColumn('phoneNumber'),
        render: (value) => value || '--',
      },
      {
        title: 'Trạng thái',
        dataIndex: 'isActive',
        key: 'status',
        width: 180,
        sorter: true,
        columnKey: 'isActive',
        sortOrder: getSortOrderForColumn('isActive'),
        render: (value) => buildStatusTag(Boolean(value)),
      },
      {
        title: 'Lần đăng nhập cuối',
        dataIndex: 'lastLoginAt',
        key: 'lastLoginAt',
        width: 220,
        sorter: true,
        columnKey: 'lastLoginAt',
        sortOrder: getSortOrderForColumn('lastLoginAt'),
        render: (value) => formatDateTime(value),
      },
    ],
    [pagination, getSortOrderForColumn],
  );

  const hasUsers = users.length > 0;
  const startIndex = hasUsers ? (pagination.current - 1) * pagination.pageSize + 1 : 0;
  const endIndex = hasUsers ? startIndex + users.length - 1 : 0;

  return (
    <div className={cx('users-page')}>
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

      <div className={cx('users-page__table-card')}>
        <div className={cx('users-page__table-header')}>
          <h3>Danh sách người dùng</h3>
          <span className={cx('users-page__table-summary')}>
            {totalItems ? `${totalItems.toLocaleString('vi-VN')} người dùng` : 'Không có dữ liệu'}
          </span>
        </div>

        <div className={cx('users-page__table')}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={users}
            loading={isFetching}
            pagination={false}
            sortDirections={['ascend', 'descend']}
            onChange={handleTableChange}
          />
          <div className={cx('users-page__pagination-bar')}>
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
    </div>
  );
}
