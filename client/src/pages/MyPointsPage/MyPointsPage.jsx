import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faClock } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import { Table, Tag, Select } from 'antd';
import dayjs from 'dayjs';
import Label from '@components/Label/Label';
import ProgressSection from '@components/ProgressSection/ProgressSection';
import { mockApi } from '@utils/mockAPI';
import styles from './MyPointsPage.module.scss';

const cx = classNames.bind(styles);

function MyPointsPage() {
  const [records, setRecords] = useState([]);
  const [semester, setSemester] = useState('all');
  const [loading, setLoading] = useState(false);

  const progressData = useMemo(
    () => ({
      currentPoints: 90,
      targetPoints: 170,
      percent: 77,
      groups: [
        { name: 'Nhóm 1', value: '50/50', note: 'Hoàn thành', status: 'success' },
        { name: 'Nhóm 2,3', value: '40/120', note: 'Còn 80 điểm', status: 'warning' },
      ],
      missingPoints: 80,
      imageUrl: '/images/profile.png',
    }),
    [],
  );

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await mockApi.getScoreRecords();
        setRecords(data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const columns = useMemo(
    () => [
      {
        title: 'Tên hoạt động',
        dataIndex: 'activityName',
        key: 'activityName',
        className: cx('my-point__col', 'my-point__col--name'),
        render: (_, record) => (
          <div className={cx('my-point__name-wrap')}>
            <div className={cx('my-point__name')}>{record.activityName}</div>
            <div className={cx('my-point__location')}>{record.location}</div>
          </div>
        ),
      },
      {
        title: 'Nhóm hoạt động',
        dataIndex: 'group',
        key: 'group',
        className: cx('my-point__col', 'my-point__col--group'),
        render: (group) =>
          group === 'Nhóm 1' ? (
            <Tag className={cx('my-point__group', 'my-point__group--danger')}>Nhóm 1</Tag>
          ) : (
            <Tag className={cx('my-point__group', 'my-point__group--success')}>Nhóm 2, 3</Tag>
          ),
        width: 180,
        responsive: ['md'],
      },
      {
        title: 'Điểm',
        dataIndex: 'points',
        key: 'points',
        align: 'center',
        width: 100,
        className: cx('my-point__col', 'my-point__col--points'),
        render: (val) => <span className={cx('my-point__points')}>+{val}</span>,
      },
      {
        title: 'Ngày tham gia',
        dataIndex: 'date',
        key: 'date',
        align: 'center',
        width: 160,
        className: cx('my-point__col'),
        render: (val) => <span className={cx('my-point__date')}>{dayjs(val).format('DD/MM/YYYY')}</span>,
        responsive: ['sm'],
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        width: 150,
        className: cx('my-point__col', 'my-point__col-status'),
        render: (status) => {
          const isConfirmed = status === 'confirmed';
          return (
            <Tag
              bordered={false}
              className={cx('my-point__tag', {
                'my-point__tag--confirmed': isConfirmed,
                'my-point__tag--pending': !isConfirmed,
              })}
            >
              <FontAwesomeIcon
                icon={isConfirmed ? faCheck : faClock}
                className={cx('my-point__tag-icon')}
                aria-hidden
              />
              <span>{isConfirmed ? 'Đã xác nhận' : 'Đang phản hồi'}</span>
            </Tag>
          );
        },
      },
    ],
    [],
  );

  const filteredData = useMemo(() => {
    if (semester === 'all') return records;
    return records;
  }, [records, semester]);

  return (
    <section className={cx('my-point')}>
      <div className={cx('my-point__container')}>
        {/* Header */}
        <header className={cx('my-point__header')}>
          <nav className={cx('my-point__breadcrumb')} aria-label="Breadcrumb">
            <Link to="/">Trang chủ</Link> / <span>Kết quả của tôi</span>
          </nav>

          <Label title="Kết quả" highlight="của tôi" leftDivider={false} rightDivider showSubtitle={false} />
        </header>

        {/* Progress Section */}
        <article className={cx('my-point__progress')}>
          <ProgressSection
            currentPoints={progressData.currentPoints}
            targetPoints={progressData.targetPoints}
            percent={progressData.percent}
            groups={progressData.groups}
            missingPoints={progressData.missingPoints}
            imageUrl={progressData.imageUrl}
            onViewDetail={() => {
              const el = document.getElementById('score-table');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        </article>

        {/* Bảng điểm chi tiết */}
        <article className={cx('my-point__scores')} id="score-table" aria-label="Bảng điểm chi tiết">
          <div className={cx('my-point__scores-header')}>
            <h2 className={cx('my-point__scores-title')}>Bảng điểm chi tiết</h2>

            <div className={cx('my-point__filters')}>
              <Select
                value={semester}
                onChange={setSemester}
                size="large"
                className={cx('my-point__select')}
                options={[
                  { value: 'all', label: 'Tất cả học kỳ' },
                  { value: '2024-hk1', label: 'HK1 2024-2025' },
                  { value: '2024-hk2', label: 'HK2 2024-2025' },
                ]}
              />
            </div>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pagination={false}
            className={cx('my-point__table')}
          />
        </article>
      </div>
    </section>
  );
}

export default MyPointsPage;
