import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCircleXmark, faClock } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import { Table, Tag, Select } from 'antd';
import dayjs from 'dayjs';
import { Label, ProgressSection } from '@components/index';
import useToast from '../../../components/Toast/Toast';
import { useQuery } from '@tanstack/react-query';
import statsApi, { PROGRESS_QUERY_KEY } from '@api/stats.api';
import useAuthStore from '@stores/useAuthStore';
import activitiesApi, { MY_ACTIVITIES_QUERY_KEY } from '@api/activities.api';
import { DEFAULT_PROGRESS_SECTION, mapProgressSummaryToSection } from '@utils/progress';
import { ROUTE_PATHS } from '@/config/routes.config';
import styles from './MyPointsPage.module.scss';

const cx = classNames.bind(styles);

function MyPointsPage() {
  const { contextHolder, open: toast } = useToast();
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const { data: progressSummary } = useQuery({
    queryKey: PROGRESS_QUERY_KEY,
    queryFn: statsApi.getProgress,
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000,
  });

  const progressSection = useMemo(
    () => (isLoggedIn ? mapProgressSummaryToSection(progressSummary) : DEFAULT_PROGRESS_SECTION),
    [isLoggedIn, progressSummary],
  );

  const { data: participated = [], isFetching: loadingRecords } = useQuery({
    queryKey: [...MY_ACTIVITIES_QUERY_KEY, 'scores'],
    queryFn: () => activitiesApi.listMine({ status: 'DA_THAM_GIA' }),
    enabled: isLoggedIn,
    staleTime: 30 * 1000,
    retry: 1,
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể tải danh sách hoạt động đã tham gia.';
      toast({ message, variant: 'danger' });
    },
  });

  const records = useMemo(() => {
    if (!isLoggedIn) return [];

    const determineStatus = (state) => {
      switch (state) {
        case 'completed':
          return { key: 'completed', label: 'Đã hoàn thành' };
        case 'feedback_accepted':
          return { key: 'confirmed', label: 'Đã xác nhận' };
        case 'feedback_denied':
          return { key: 'denied', label: 'Từ chối' };
        case 'feedback_pending':
          return { key: 'pending', label: 'Chờ gửi minh chứng' };
        case 'feedback_reviewing':
        case 'attendance_review':
          return { key: 'reviewing', label: 'Đang xét duyệt' };
        case 'feedback_waiting':
          return { key: 'waiting', label: 'Đang chờ' };
        case 'ended':
          return { key: 'ended', label: 'Đã kết thúc' };
        case 'canceled':
          return { key: 'canceled', label: 'Đã hủy' };
        case 'absent':
          return { key: 'absent', label: 'Vắng mặt' };
        default:
          return { key: 'pending', label: 'Đang cập nhật' };
      }
    };

    return (participated || [])
      .filter((registration) => registration?.activity)
      .map((registration) => {
        const activity = registration.activity || {};
        const statusInfo = determineStatus(activity.state);
        const dateValue =
          registration.approvedAt ||
          activity.endTime ||
          activity.startTime ||
          registration.checkInAt ||
          registration.registeredAt;

        return {
          id: registration.id,
          activityName: activity.title || 'Hoạt động của bạn',
          location: activity.location || 'Đang cập nhật',
          group: activity.pointGroupLabel || activity.pointGroup || 'Khác',
          points: activity.points ?? 0,
          date: dateValue,
          status: statusInfo.key,
          statusLabel: statusInfo.label,
          semester:
            activity.semesterDisplay ||
            (activity.semester && activity.academicYear
              ? `${activity.semester} - ${activity.academicYear}`
              : activity.semester) ||
            null,
          academicYear: activity.academicYear || null,
        };
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [isLoggedIn, participated]);

  const columns = useMemo(
    () => [
      {
        title: 'Tên hoạt động',
        dataIndex: 'activityName',
        key: 'activityName',
        className: cx('my-points__col', 'my-points__col--name'),
        render: (_, record) => (
          <div className={cx('my-points__name-wrap')}>
            <div className={cx('my-points__name')}>{record.activityName}</div>
            <div className={cx('my-points__location')}>{record.location}</div>
          </div>
        ),
      },
      {
        title: 'Nhóm hoạt động',
        dataIndex: 'group',
        key: 'group',
        className: cx('my-points__col', 'my-points__col--group'),
        render: (group) => {
          const label = group || 'Khác';
          const normalized = typeof label === 'string' ? label.trim() : String(label);
          const isGroupOne = normalized.toLowerCase().includes('1');
          return (
            <Tag
              className={cx('my-points__group', {
                'my-points__group--danger': isGroupOne,
                'my-points__group--success': !isGroupOne,
              })}
            >
              {normalized}
            </Tag>
          );
        },
        width: 180,
        responsive: ['md'],
      },
      {
        title: 'Điểm',
        dataIndex: 'points',
        key: 'points',
        align: 'center',
        width: 100,
        className: cx('my-points__col', 'my-points__col--points'),
        render: (val) => <span className={cx('my-points__points')}>+{val}</span>,
      },
      {
        title: 'Ngày tham gia',
        dataIndex: 'date',
        key: 'date',
        align: 'center',
        width: 160,
        className: cx('my-points__col'),
        render: (val) => <span className={cx('my-points__date')}>{dayjs(val).format('DD/MM/YYYY')}</span>,
        responsive: ['sm'],
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        width: 150,
        className: cx('my-points__col', 'my-points__col-status'),
        render: (_, record) => {
          const status = record.status;
          const label = record.statusLabel;
          let tagClass = 'pending';
          let icon = faClock;

          if (status === 'completed' || status === 'confirmed') {
            tagClass = 'confirmed';
            icon = faCheck;
          } else if (status === 'denied' || status === 'canceled' || status === 'absent') {
            tagClass = 'denied';
            icon = faCircleXmark;
          } else if (status === 'reviewing' || status === 'waiting') {
            tagClass = 'reviewing';
            icon = faClock;
          }

          return (
            <Tag
              bordered={false}
              className={cx('my-points__tag', {
                'my-points__tag--confirmed': tagClass === 'confirmed',
                'my-points__tag--pending': tagClass === 'pending',
                'my-points__tag--denied': tagClass === 'denied',
                'my-points__tag--reviewing': tagClass === 'reviewing',
              })}
            >
              <FontAwesomeIcon icon={icon} className={cx('my-points__tag-icon')} aria-hidden />
              <span>{label}</span>
            </Tag>
          );
        },
      },
    ],
    [],
  );

  const semesterOptions = useMemo(() => {
    const values = new Set();
    records.forEach((record) => {
      if (record.semester) values.add(record.semester);
    });
    return [
      { value: 'all', label: 'Tất cả học kỳ' },
      ...Array.from(values)
        .sort((a, b) => String(a).localeCompare(String(b)))
        .map((value) => ({ value, label: String(value) })),
    ];
  }, [records]);

  const yearOptions = useMemo(() => {
    const values = new Set();
    records.forEach((record) => {
      if (record.academicYear) values.add(record.academicYear);
    });
    return [
      { value: 'all', label: 'Tất cả năm học' },
      ...Array.from(values)
        .sort((a, b) => String(b).localeCompare(String(a)))
        .map((value) => ({ value, label: String(value) })),
    ];
  }, [records]);

  useEffect(() => {
    if (semesterFilter !== 'all' && !semesterOptions.some((option) => option.value === semesterFilter)) {
      setSemesterFilter('all');
    }
  }, [semesterFilter, semesterOptions]);

  useEffect(() => {
    if (yearFilter !== 'all' && !yearOptions.some((option) => option.value === yearFilter)) {
      setYearFilter('all');
    }
  }, [yearFilter, yearOptions]);

  const filteredData = useMemo(
    () =>
      records.filter((record) => {
        const semesterMatches = semesterFilter === 'all' || record.semester === semesterFilter;
        const yearMatches = yearFilter === 'all' || record.academicYear === yearFilter;
        return semesterMatches && yearMatches;
      }),
    [records, semesterFilter, yearFilter],
  );

  return (
    <section className={cx('my-points')}>
      {contextHolder}
      <div className={cx('my-points__container')}>
        <header className={cx('my-points__header')}>
          <nav className={cx('my-points__breadcrumb')} aria-label="Breadcrumb">
            <Link to={ROUTE_PATHS.PUBLIC.HOME}>Trang chủ</Link> / <span>Kết quả của tôi</span>
          </nav>

          <Label title="Kết quả" highlight="của tôi" leftDivider={false} rightDivider showSubtitle={false} />
        </header>

        <article className={cx('my-points__progress')}>
          <ProgressSection
            currentPoints={progressSection.currentPoints}
            targetPoints={progressSection.targetPoints}
            percent={progressSection.percent}
            groups={progressSection.groups}
            missingPoints={progressSection.missingPoints}
            isQualified={progressSection.isQualified}
            requirements={progressSection.requirements}
            imageUrl={progressSection.imageUrl}
            onViewDetail={() => {
              const el = document.getElementById('score-table');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        </article>

        <article className={cx('my-points__scores')} id="score-table" aria-label="Bảng điểm chi tiết">
          <div className={cx('my-points__scores-header')}>
            <h2 className={cx('my-points__scores-title')}>Bảng điểm chi tiết</h2>

            <div className={cx('my-points__filters')}>
              <Select
                value={semesterFilter}
                onChange={setSemesterFilter}
                size="large"
                className={cx('my-points__select')}
                options={semesterOptions}
              />
              <Select
                value={yearFilter}
                onChange={setYearFilter}
                size="large"
                className={cx('my-points__select')}
                options={yearOptions}
              />
            </div>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={filteredData}
            loading={loadingRecords}
            pagination={false}
            className={cx('my-points__table')}
          />
        </article>
      </div>
    </section>
  );
}

export default MyPointsPage;
