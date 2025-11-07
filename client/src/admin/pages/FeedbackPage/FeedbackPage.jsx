import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Table, Input, Select, Button, Avatar, Tag, Tooltip, Pagination, ConfigProvider } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faEye,
  faSort,
  faCalendarDay,
  faFileLines,
  faHourglassHalf,
  faCircleCheck,
  faCircleXmark,
} from '@fortawesome/free-solid-svg-icons';
import viVN from 'antd/locale/vi_VN';
import { proofListData, statsData } from './FeedbackPageData';
import { buildPath } from '@/config/routes.config';
import styles from './FeedbackPage.module.scss';

const cx = classNames.bind(styles);
const { Option } = Select;

// Hàm helper cho tag trạng thái
const getStatusTag = (status) => {
  switch (status) {
    case 'Đã duyệt':
      return (
        <Tag className={cx('status-tag', '--success')} color="success">
          {status}
        </Tag>
      );
    case 'Chờ duyệt':
      return (
        <Tag className={cx('status-tag', '--pending')} color="warning">
          {status}
        </Tag>
      );
    case 'Từ chối':
      return (
        <Tag className={cx('status-tag', '--fail')} color="error">
          {status}
        </Tag>
      );
    default:
      return <Tag>{status}</Tag>;
  }
};

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc dữ liệu (giả lập)
  const filteredData = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return proofListData.filter(
      (item) =>
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.mssv.toLowerCase().includes(normalizedSearch) ||
        item.hoatDong.toLowerCase().includes(normalizedSearch),
    );
  }, [searchTerm]);

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const hasSelected = selectedRowKeys.length > 0;

  const columns = useMemo(
    () => [
      {
        title: 'STT',
        dataIndex: 'stt',
        key: 'stt',
        width: 60,
        align: 'center',
        render: (_, record, index) => {
          return (pagination.current - 1) * pagination.pageSize + index + 1;
        },
      },
      {
        title: 'Tên sinh viên',
        dataIndex: 'name',
        key: 'name',
        width: 250,
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (_, record) => (
          <div className={cx('student-info')}>
            <Avatar src={record.avatar} alt={record.name} />
            <div className={cx('student-info__details')}>
              <strong>{record.name}</strong>
              <p>{record.email}</p>
            </div>
          </div>
        ),
      },
      {
        title: 'MSSV',
        dataIndex: 'mssv',
        key: 'mssv',
        width: 120,
        sorter: (a, b) => a.mssv.localeCompare(b.mssv),
      },
      {
        title: 'Khoa',
        dataIndex: 'khoa',
        key: 'khoa',
        width: 210,
        sorter: (a, b) => a.khoa.localeCompare(b.khoa),
      },
      {
        title: 'Lớp',
        dataIndex: 'lop',
        key: 'lop',
        width: 110,
        sorter: (a, b) => a.lop.localeCompare(b.lop),
      },
      {
        title: 'Hoạt động',
        dataIndex: 'hoatDong',
        key: 'hoatDong',
        width: 300,
        sorter: (a, b) => a.hoatDong.localeCompare(b.hoatDong),
        render: (_, record) => (
          <div className={cx('activity-info')}>
            <strong>{record.hoatDong}</strong>
            <p>
              <FontAwesomeIcon icon={faCalendarDay} /> {record.ngayHoatDong}
            </p>
          </div>
        ),
      },
      {
        title: 'Ngày gửi',
        dataIndex: 'ngayGui',
        key: 'ngayGui',
        width: 160,
        sorter: (a, b) => new Date(a.ngayGui) - new Date(b.ngayGui),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'trangThai',
        key: 'trangThai',
        width: 120,
        align: 'center',
        sorter: (a, b) => a.trangThai.localeCompare(b.trangThai),
        render: (status) => getStatusTag(status),
      },
      {
        title: 'Hành động',
        key: 'actions',
        width: 115,
        align: 'center',
        render: (_, record) => (
          <Tooltip title="Xem chi tiết">
            <button
              className={cx('action-btn')}
              onClick={(e) => {
                e.stopPropagation();
                navigate(buildPath.adminFeedbackDetail(record.id));
              }}
            >
              <FontAwesomeIcon icon={faEye} />
            </button>
          </Tooltip>
        ),
      },
    ],
    [pagination, navigate],
  );

  const iconMap = {
    faFileLines: faFileLines,
    faHourglassHalf: faHourglassHalf,
    faCircleCheck: faCircleCheck,
    faCircleXmark: faCircleXmark,
  };

  return (
    <ConfigProvider locale={viVN}>
      <div className={cx('feedback-page__wrapper')}>
        {/* Thống kê */}
        <section className={cx('stats__grid')}>
          {statsData.map((item, index) => (
            <div key={index} className={cx('stats__card')}>
              <div className={cx('stats__info')}>
                <p className={cx('stats__label')}>{item.label}</p>
                <h2 className={cx('stats__value')} style={{ color: item.color }}>
                  {item.value}
                </h2>
              </div>
              <div className={cx('stats__icon-box')} style={{ backgroundColor: item.bg }}>
                <FontAwesomeIcon icon={iconMap[item.iconName]} size="lg" color={item.color} />
              </div>
            </div>
          ))}
        </section>

        {/* Filter Bar */}
        <div className={cx('filter-bar')}>
          <Input
            placeholder="Tìm kiếm hoạt động, sinh viên..."
            className={cx('filter-bar__search')}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Select placeholder="Khoa" className={cx('filter-bar__select')}>
            <Option value="cntt">Công nghệ thông tin</Option>
            <Option value="qtkd">Quản trị kinh doanh</Option>
          </Select>
          <Select placeholder="Lớp" className={cx('filter-bar__select')}>
            <Option value="13dth02">13DHTH02</Option>
            <Option value="13dth03">13DHTH03</Option>
          </Select>
          <Select placeholder="Hoạt động" className={cx('filter-bar__select')}>
            <Option value="hmnđ">Hiến máu nhân đạo</Option>
          </Select>
          <Select placeholder="Trạng thái" className={cx('filter-bar__select')}>
            <Option value="pending">Chờ duyệt</Option>
            <Option value="success">Đã duyệt</Option>
            <Option value="fail">Từ chối</Option>
          </Select>
          <Button type="primary" icon={<FontAwesomeIcon icon={faSearch} />} className={cx('filter-bar__button')}>
            Lọc
          </Button>
        </div>

        {/* Table Content */}
        <div className={cx('content-box')}>
          <div className={cx('content-header')}>
            <h3>Danh sách phản hồi</h3>
          </div>
          <Table
            rowKey="id"
            columns={columns.map((col) => ({
              ...col,
              sortIcon: ({ sortOrder }) => (
                <FontAwesomeIcon
                  icon={faSort}
                  className={cx('sort-icon', {
                    '--active': sortOrder,
                  })}
                />
              ),
            }))}
            dataSource={filteredData}
            rowSelection={rowSelection}
            pagination={false}
            className={cx('table')}
            onRow={(record) => ({
              onClick: (event) => {
                if (event.target.closest('button')) return;
                navigate(buildPath.adminFeedbackDetail(record.id));
              },
            })}
          />
          <div className={cx('pagination-wrapper')}>
            <div className={cx('selection-info')}>
              Đã chọn <strong>{selectedRowKeys.length}</strong> trong <strong>{filteredData.length}</strong> kết quả
            </div>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={filteredData.length}
              onChange={(page, pageSize) => {
                setPagination({ current: page, pageSize });
              }}
              showSizeChanger={false}
            />
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
