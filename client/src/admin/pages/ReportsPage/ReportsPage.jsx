import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import { useQuery } from '@tanstack/react-query';
import { Card, Empty, Select, Skeleton, Table, Tag } from 'antd';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faLayerGroup, faUsers, faClipboardList, faMedal } from '@fortawesome/free-solid-svg-icons';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import statsApi, { ADMIN_REPORTS_QUERY_KEY } from '@/api/stats.api';
import { ROUTE_PATHS } from '@/config/routes.config';
import styles from './ReportsPage.module.scss';

const cx = classNames.bind(styles);

const formatNumber = (value, fractionDigits = 0) => {
  if (value === undefined || value === null) return '--';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return numeric.toLocaleString('vi-VN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

export default function ReportsPage() {
  const { setBreadcrumbs, setPageActions } = useContext(AdminPageContext);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const initializedFiltersRef = useRef(false);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Trang chủ', path: ROUTE_PATHS.ADMIN.DASHBOARD },
      { label: 'Báo cáo & Thống kê', path: ROUTE_PATHS.ADMIN.REPORTS },
    ]);
    setPageActions([]);
    return () => {
      setBreadcrumbs(null);
      setPageActions(null);
    };
  }, [setBreadcrumbs, setPageActions]);

  const queryParams = useMemo(() => {
    const params = {};
    if (selectedYear !== 'all') params.yearId = selectedYear;
    if (selectedSemester !== 'all') params.semesterId = selectedSemester;
    return params;
  }, [selectedYear, selectedSemester]);

  const {
    data,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: [ADMIN_REPORTS_QUERY_KEY, queryParams],
    queryFn: () => statsApi.getAdminReports(queryParams),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (!data?.filters?.applied) return;
    if (initializedFiltersRef.current) return;
    const { yearId, semesterId } = data.filters.applied;
    if (yearId) setSelectedYear(yearId);
    if (semesterId) setSelectedSemester(semesterId);
    initializedFiltersRef.current = true;
  }, [data?.filters?.applied]);

  const rawYears = useMemo(() => data?.filters?.years ?? [], [data?.filters?.years]);
  const rawSemesters = useMemo(() => data?.filters?.semesters ?? [], [data?.filters?.semesters]);

  const semesterOptions = useMemo(() => {
    if (selectedYear === 'all') return rawSemesters;
    return rawSemesters.filter((item) => !item.yearId || item.yearId === selectedYear);
  }, [rawSemesters, selectedYear]);

  useEffect(() => {
    if (selectedSemester === 'all') return;
    const exists = semesterOptions.some((item) => item.id === selectedSemester);
    if (!exists) {
      setSelectedSemester('all');
    }
  }, [semesterOptions, selectedSemester]);

  const overview = data?.overview ?? {};
  const categoryData = data?.byCategory ?? [];
  const facultyData = data?.byFaculty ?? [];
  const activityData = data?.byActivity ?? [];
  const timelineData = useMemo(
    () =>
      (data?.timeline ?? []).map((item) => ({
        ...item,
        points: Number(item.totalPoints) || 0,
        registrations: Number(item.registrations) || 0,
        label: item.label || item.key,
      })),
    [data?.timeline],
  );

  const classData = useMemo(() => (data?.byClass ?? []).slice(0, 10), [data?.byClass]);
  const studentData = useMemo(() => (data?.byStudent ?? []).slice(0, 15), [data?.byStudent]);

  const isInitialLoading = isLoading && !data;
  const isBusy = isFetching && !!data;

  const overviewCards = useMemo(
    () => [
      {
        key: 'totalPoints',
        label: 'Tổng điểm cộng',
        value: overview.totalPoints ?? 0,
        icon: faChartLine,
        modifier: 'primary',
        fractionDigits: 0,
      },
      {
        key: 'totalParticipants',
        label: 'Sinh viên tham gia',
        value: overview.totalParticipants ?? 0,
        icon: faUsers,
        modifier: 'teal',
        fractionDigits: 0,
      },
      {
        key: 'totalActivities',
        label: 'Hoạt động ghi nhận',
        value: overview.totalActivities ?? 0,
        icon: faClipboardList,
        modifier: 'orange',
        fractionDigits: 0,
      },
      {
        key: 'average',
        label: 'Điểm trung bình / SV',
        value: overview.averagePointsPerStudent ?? 0,
        icon: faMedal,
        modifier: 'purple',
        fractionDigits: 2,
      },
    ],
    [overview.averagePointsPerStudent, overview.totalActivities, overview.totalParticipants, overview.totalPoints],
  );

  const classColumns = useMemo(
    () => [
      {
        title: 'Lớp',
        dataIndex: 'classCode',
        key: 'classCode',
        render: (value) => value || 'Chưa cập nhật',
      },
      {
        title: 'Khoa',
        dataIndex: 'faculty',
        key: 'faculty',
        render: (value) => value || '---',
      },
      {
        title: 'Tổng điểm',
        dataIndex: 'totalPoints',
        key: 'totalPoints',
        align: 'right',
        render: (value) => formatNumber(value),
      },
      {
        title: 'Số SV',
        dataIndex: 'studentCount',
        key: 'studentCount',
        align: 'right',
        render: (value) => formatNumber(value),
      },
      {
        title: 'Điểm TB/SV',
        dataIndex: 'averagePoints',
        key: 'averagePoints',
        align: 'right',
        render: (value) => formatNumber(value, 2),
      },
    ],
    [],
  );

  const studentColumns = useMemo(
    () => [
      {
        title: 'Sinh viên',
        dataIndex: 'name',
        key: 'name',
        render: (value, record) => (
          <div className={cx('reports-page__cell-user')}>
            <span className={cx('reports-page__cell-user-name')}>{value || 'Sinh viên'}</span>
            {record.studentCode ? (
              <span className={cx('reports-page__cell-user-code')}>{record.studentCode}</span>
            ) : null}
          </div>
        ),
      },
      {
        title: 'Lớp',
        dataIndex: 'classCode',
        key: 'classCode',
        render: (value) => value || '---',
      },
      {
        title: 'Khoa',
        dataIndex: 'faculty',
        key: 'faculty',
        render: (value) => value || '---',
      },
      {
        title: 'Hoạt động',
        dataIndex: 'activityCount',
        key: 'activityCount',
        align: 'right',
        render: (value) => formatNumber(value),
      },
      {
        title: 'Tổng điểm',
        dataIndex: 'totalPoints',
        key: 'totalPoints',
        align: 'right',
        render: (value) => formatNumber(value),
      },
      {
        title: 'Điểm TB/HD',
        dataIndex: 'averagePoints',
        key: 'averagePoints',
        align: 'right',
        render: (value) => formatNumber(value, 2),
      },
    ],
    [],
  );

  const renderCategoryList = () => {
    if (!categoryData.length) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu phân bổ" />;
    }
    return (
      <ul className={cx('reports-page__category-list')}>
        {categoryData.map((item) => (
          <li key={item.id} className={cx('reports-page__category-item')}>
            <div className={cx('reports-page__category-info')}>
              <span className={cx('reports-page__category-name')}>{item.label}</span>
              <div className={cx('reports-page__category-meta')}>
                <span>{formatNumber(item.totalPoints)} điểm</span>
                <span>{formatNumber(item.activityCount)} lượt</span>
              </div>
            </div>
            <Tag className={cx('reports-page__category-tag')}>{formatNumber(item.percent, 1)}%</Tag>
          </li>
        ))}
      </ul>
    );
  };

  const renderFacultyList = () => {
    if (!facultyData.length) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu khoa" />;
    }
    return (
      <ul className={cx('reports-page__faculty-list')}>
        {facultyData.map((item) => (
          <li key={item.faculty || 'unknown'} className={cx('reports-page__faculty-item')}>
            <div className={cx('reports-page__faculty-info')}>
              <span className={cx('reports-page__faculty-name')}>{item.faculty || 'Chưa cập nhật'}</span>
              <div className={cx('reports-page__faculty-meta')}>
                <span>{formatNumber(item.totalPoints)} điểm</span>
                <span>{formatNumber(item.studentCount)} SV</span>
              </div>
            </div>
            <span className={cx('reports-page__faculty-count')}>
              {formatNumber(item.participationCount)} lượt
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderActivities = () => {
    if (!activityData.length) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hoạt động nổi bật" />;
    }
    return (
      <ul className={cx('reports-page__activity-list')}>
        {activityData.map((item) => (
          <li key={item.id} className={cx('reports-page__activity-item')}>
            <div className={cx('reports-page__activity-main')}>
              <span className={cx('reports-page__activity-title')}>{item.title}</span>
              <Tag className={cx('reports-page__activity-tag')}>{item.pointGroupLabel}</Tag>
            </div>
            <div className={cx('reports-page__activity-meta')}>
              <span>{formatNumber(item.participantCount)} SV</span>
              <span>{formatNumber(item.totalPoints)} điểm</span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className={cx('reports-page')}>
      <div className={cx('reports-page__filters')}>
        <div className={cx('reports-page__filter')}>
          <span className={cx('reports-page__filter-label')}>Năm học</span>
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            options={[
              { value: 'all', label: 'Tất cả năm học' },
              ...rawYears.map((item) => ({ value: item.id, label: item.label })),
            ]}
            className={cx('reports-page__filter-select')}
            loading={isInitialLoading}
          />
        </div>
        <div className={cx('reports-page__filter')}>
          <span className={cx('reports-page__filter-label')}>Học kỳ</span>
          <Select
            value={selectedSemester}
            onChange={setSelectedSemester}
            options={[
              { value: 'all', label: 'Tất cả học kỳ' },
              ...semesterOptions.map((item) => ({ value: item.id, label: item.label })),
            ]}
            className={cx('reports-page__filter-select')}
            loading={isInitialLoading}
          />
        </div>
      </div>

      <div className={cx('reports-page__stats')}>
        {overviewCards.map((card) => (
          <div
            key={card.key}
            className={cx('reports-page__stat-card', `reports-page__stat-card--${card.modifier}`, {
              'reports-page__stat-card--loading': isBusy,
            })}
          >
            <div className={cx('reports-page__stat-card-icon', `reports-page__stat-card-icon--${card.modifier}`)}>
              <FontAwesomeIcon icon={card.icon} size="lg" />
            </div>
            <div className={cx('reports-page__stat-card-info')}>
              <span className={cx('reports-page__stat-card-value')}>
                {isInitialLoading ? <Skeleton paragraph={false} active title /> : formatNumber(card.value, card.fractionDigits)}
              </span>
              <span className={cx('reports-page__stat-card-label')}>{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={cx('reports-page__grid')}>
        <Card
          bordered={false}
          className={cx('reports-page__panel', 'reports-page__panel--timeline')}
          title="Xu hướng điểm theo tháng"
        >
          {isInitialLoading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : timelineData.length ? (
            <div className={cx('reports-page__timeline')}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary-color)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary-color)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} width={70} />
                  <Tooltip formatter={(value) => formatNumber(value)} labelStyle={{ fontWeight: 600 }} />
                  <Area type="monotone" dataKey="points" stroke="var(--primary-color)" fill="url(#colorPoints)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu biểu đồ" />
          )}
        </Card>

        <Card bordered={false} className={cx('reports-page__panel')} title="Phân bổ điểm">
          <div className={cx('reports-page__panel-section')}>
            <h3 className={cx('reports-page__section-title')}>
              <FontAwesomeIcon icon={faLayerGroup} /> Theo nhóm điểm
            </h3>
            {isInitialLoading ? <Skeleton active paragraph={{ rows: 6 }} /> : renderCategoryList()}
          </div>
          <div className={cx('reports-page__panel-section')}>
            <h3 className={cx('reports-page__section-title')}>
              <FontAwesomeIcon icon={faUsers} /> Theo khoa
            </h3>
            {isInitialLoading ? <Skeleton active paragraph={{ rows: 4 }} /> : renderFacultyList()}
          </div>
        </Card>
      </div>

      <div className={cx('reports-page__tables')}>
        <Card bordered={false} className={cx('reports-page__panel')} title="Top lớp tích lũy điểm">
          <Table
            size="small"
            className={cx('reports-page__table')}
            columns={classColumns}
            dataSource={classData}
            rowKey={(record) => record.classCode || record.faculty || record.totalPoints}
            pagination={false}
            loading={isLoading || isFetching}
            locale={{ emptyText: 'Chưa có dữ liệu lớp' }}
          />
        </Card>
        <Card bordered={false} className={cx('reports-page__panel')} title="Top sinh viên nổi bật">
          <Table
            size="small"
            className={cx('reports-page__table')}
            columns={studentColumns}
            dataSource={studentData}
            rowKey={(record) => record.id}
            pagination={false}
            loading={isLoading || isFetching}
            locale={{ emptyText: 'Chưa có dữ liệu sinh viên' }}
          />
        </Card>
      </div>

      <Card bordered={false} className={cx('reports-page__panel')} title="Hoạt động nổi bật">
        {isInitialLoading ? <Skeleton active paragraph={{ rows: 6 }} /> : renderActivities()}
      </Card>
    </section>
  );
}
