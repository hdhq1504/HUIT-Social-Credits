import React, { useMemo } from 'react';
import classNames from 'classnames/bind';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Table, Tag, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateRight, faBookOpenReader, faCalendarDay, faUserGroup } from '@fortawesome/free-solid-svg-icons';
import teacherApi, { TEACHER_QUERY_KEYS } from '@/api/teacher.api';
import styles from './TeacherClassesPage.module.scss';

const cx = classNames.bind(styles);
const { Title, Text } = Typography;

const buildStatCards = (classes) => {
  const totalStudents = classes.reduce((sum, item) => sum + (item._count?.sinhVien ?? 0), 0);
  const latestYear = classes.reduce((max, item) => Math.max(max, item.namNhapHoc ?? 0), 0);

  return [
    {
      key: 'classes',
      label: 'Tổng số lớp chủ nhiệm',
      value: classes.length,
      icon: faBookOpenReader,
    },
    {
      key: 'students',
      label: 'Tổng sĩ số quản lý',
      value: totalStudents,
      icon: faUserGroup,
    },
    {
      key: 'year',
      label: 'Năm nhập học mới nhất',
      value: latestYear || '—',
      icon: faCalendarDay,
    },
  ];
};

function TeacherClassesPage() {
  const {
    data: classData = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: TEACHER_QUERY_KEYS.CLASSES,
    queryFn: () => teacherApi.getClasses(),
  });

  const classes = useMemo(() => (Array.isArray(classData) ? classData : []), [classData]);
  const statCards = useMemo(() => buildStatCards(classes), [classes]);

  const columns = useMemo(
    () => [
      {
        title: 'Mã lớp',
        dataIndex: 'maLop',
        key: 'maLop',
        width: 140,
        render: (value) => <span className={cx('teacher-classes__code')}>{value}</span>,
      },
      {
        title: 'Tên lớp',
        dataIndex: 'tenLop',
        key: 'tenLop',
        render: (value, record) => (
          <div className={cx('teacher-classes__name')}>
            <Text strong>{value}</Text>
            <Text type="secondary">{record?.khoa?.tenKhoa}</Text>
          </div>
        ),
      },
      {
        title: 'Năm nhập học',
        dataIndex: 'namNhapHoc',
        key: 'namNhapHoc',
        width: 160,
        align: 'center',
        render: (value) => (
          <Tag className={cx('teacher-classes__year-tag')}>
            <FontAwesomeIcon icon={faCalendarDay} />
            <span>{value || '—'}</span>
          </Tag>
        ),
      },
      {
        title: 'Sĩ số',
        dataIndex: ['_count', 'sinhVien'],
        key: 'siSo',
        width: 140,
        align: 'center',
        render: (value) => (
          <span className={cx('teacher-classes__students')}>
            <FontAwesomeIcon icon={faUserGroup} />
            {value ?? 0}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className={cx('teacher-classes')}>
      <div className={cx('teacher-classes__header')}>
        <div>
          <Title level={3} className={cx('teacher-classes__title')}>
            Lớp chủ nhiệm
          </Title>
          <Text className={cx('teacher-classes__description')}>
            Theo dõi các lớp bạn phụ trách và sĩ số cập nhật theo thời gian thực.
          </Text>
        </div>
        <Button
          type="default"
          icon={<FontAwesomeIcon icon={faArrowRotateRight} />}
          onClick={() => refetch()}
          loading={isFetching && !isLoading}
          className={cx('teacher-classes__refresh')}
        >
          Tải lại
        </Button>
      </div>

      <div className={cx('teacher-classes__stats')}>
        {statCards.map((card) => (
          <Card key={card.key} className={cx('teacher-classes__stat-card')}>
            <div className={cx('teacher-classes__stat-icon')}>
              <FontAwesomeIcon icon={card.icon} />
            </div>
            <div>
              <p className={cx('teacher-classes__stat-label')}>{card.label}</p>
              <p className={cx('teacher-classes__stat-value')}>{card.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className={cx('teacher-classes__card')}>
        <div className={cx('teacher-classes__card-header')}>
          <div>
            <Title level={4} className={cx('teacher-classes__card-title')}>
              Danh sách lớp quản lý
            </Title>
            <Text className={cx('teacher-classes__card-subtitle')}>Cập nhật mới nhất về thông tin lớp và sĩ số</Text>
          </div>
          <Tag className={cx('teacher-classes__card-tag')}>{classes.length} lớp</Tag>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={classes}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          loading={isLoading}
          className={cx('teacher-classes__table')}
        />
      </Card>
    </div>
  );
}

export default TeacherClassesPage;
