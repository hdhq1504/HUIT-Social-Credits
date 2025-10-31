import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRotateRight,
  faCalendarCheck,
  faCircleCheck,
  faClock,
  faTrophy,
} from '@fortawesome/free-solid-svg-icons';
import { Button, Calendar, ConfigProvider, Empty, Input, Pagination, Select, Tabs } from 'antd';
import viVN from 'antd/es/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import updateLocale from 'dayjs/plugin/updateLocale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CardActivity from '@components/CardActivity/CardActivity';
import Label from '@components/Label/Label';
import useToast from '@components/Toast/Toast';
import activitiesApi, { MY_ACTIVITIES_QUERY_KEY } from '@api/activities.api';
import { fileToDataUrl } from '@utils/file';
import styles from './MyActivitiesPage.module.scss';

const cx = classNames.bind(styles);
const PAGE_SIZE = 6;

dayjs.extend(updateLocale);
dayjs.locale('vi');
dayjs.updateLocale('vi', { weekStart: 1 });

const normalize = (s) =>
  (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

function MyActivitiesPage() {
  const { contextHolder, open: toast } = useToast();

  const queryClient = useQueryClient();
  const [pages, setPages] = useState({ registered: 1, attended: 1, canceled: 1 });
  const [keyword, setKeyword] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');

  const {
    data: registrations = [],
    isFetching,
    refetch,
  } = useQuery({
    queryKey: MY_ACTIVITIES_QUERY_KEY,
    queryFn: () => activitiesApi.listMine(),
    staleTime: 30 * 1000,
    retry: 1,
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể tải danh sách hoạt động của bạn';
      toast({ message, variant: 'danger' });
    },
  });

  const { academicYears, semesters } = useMemo(() => {
    const yearSet = new Set();
    const semesterSet = new Set();
    registrations.forEach((registration) => {
      const year = registration.activity?.academicYear;
      const semester = registration.activity?.semester;
      if (year) yearSet.add(year);
      if (semester) semesterSet.add(semester);
    });
    const sortedYears = Array.from(yearSet).sort((a, b) => b.localeCompare(a));
    const sortedSemesters = Array.from(semesterSet).sort((a, b) => a.localeCompare(b));
    return { academicYears: sortedYears, semesters: sortedSemesters };
  }, [registrations]);

  const registerMutation = useMutation({
    mutationFn: ({ id, note }) => activitiesApi.register(id, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries(MY_ACTIVITIES_QUERY_KEY);
      toast({ message: 'Đăng ký hoạt động thành công!', variant: 'success' });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể đăng ký hoạt động. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason, note }) => activitiesApi.cancel(id, { reason, note }),
    onSuccess: () => {
      queryClient.invalidateQueries(MY_ACTIVITIES_QUERY_KEY);
      toast({ message: 'Hủy đăng ký hoạt động thành công!', variant: 'success' });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể hủy đăng ký hoạt động. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: ({ id, payload }) => activitiesApi.attendance(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries(MY_ACTIVITIES_QUERY_KEY);
      const message = data?.message || 'Điểm danh thành công!';
      toast({ message, variant: 'success' });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể điểm danh hoạt động. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ id, content, attachments }) => activitiesApi.feedback(id, { content, attachments }),
    onSuccess: () => {
      queryClient.invalidateQueries(MY_ACTIVITIES_QUERY_KEY);
      toast({ message: 'Gửi phản hồi thành công!', variant: 'success' });
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Không thể gửi phản hồi. Vui lòng thử lại.';
      toast({ message, variant: 'danger' });
    },
  });

  const normalizedKeyword = normalize(keyword);

  const filteredRegistrations = useMemo(
    () =>
      registrations.filter((registration) => {
        const activity = registration.activity || {};
        if (selectedYear !== 'all' && activity.academicYear !== selectedYear) return false;
        if (selectedSemester !== 'all' && activity.semester !== selectedSemester) return false;
        if (normalizedKeyword) {
          const haystack = normalize(
            [activity.title, activity.code, activity.location, activity.category, activity.pointGroupLabel]
              .filter(Boolean)
              .join(' '),
          );
          if (!haystack.includes(normalizedKeyword)) return false;
        }
        return true;
      }),
    [registrations, selectedYear, selectedSemester, normalizedKeyword],
  );

  useEffect(() => {
    setPages({ registered: 1, attended: 1, canceled: 1 });
  }, [selectedYear, selectedSemester, normalizedKeyword, registrations.length]);

  const stats = useMemo(() => {
    const registered = filteredRegistrations.filter((item) => item.status === 'DANG_KY');
    const attended = filteredRegistrations.filter((item) => item.status === 'DA_THAM_GIA');
    const canceled = filteredRegistrations.filter((item) => item.status === 'DA_HUY' || item.status === 'VANG_MAT');
    const totalPoints = attended.reduce((sum, item) => sum + (item.activity?.points ?? 0), 0);
    const pendingFeedback = attended.filter((item) => item.feedback?.status !== 'DA_DUYET').length;

    return {
      totalPoints,
      totalActivities: filteredRegistrations.length,
      completed: attended.length,
      pending: pendingFeedback,
      registered,
      attended,
      canceled,
    };
  }, [filteredRegistrations]);

  const handlePageChange = useCallback((tabKey, page) => {
    setPages((prev) => ({ ...prev, [tabKey]: page }));
  }, []);

  const paginate = useCallback(
    (items, tabKey) => {
      const total = items.length;
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const current = Math.max(1, Math.min(pages[tabKey] ?? 1, totalPages));
      const start = (current - 1) * PAGE_SIZE;

      return {
        total,
        current,
        pageItems: items.slice(start, start + PAGE_SIZE),
      };
    },
    [pages],
  );

  const calendarEvents = useMemo(() => {
    const map = {};
    filteredRegistrations.forEach((registration) => {
      const activity = registration.activity;
      if (!activity?.startTime) return;
      const key = dayjs(activity.startTime).format('YYYY-MM-DD');
      if (map[key]) return;
      let type = 'primary';
      if (registration.status === 'DA_THAM_GIA') type = 'success';
      else if (registration.status === 'DA_HUY' || registration.status === 'VANG_MAT') type = 'warning';
      map[key] = { type, label: activity.title };
    });
    return map;
  }, [filteredRegistrations]);

  const fullCellRender = (current, info) => {
    const key = dayjs(current).format('YYYY-MM-DD');
    const event = calendarEvents[key];
    const isCurrentMonth = info.originNode?.props?.className?.includes('ant-picker-cell-in-view');

    return (
      <div
        className={cx('my-activities__calendar-cell', {
          'my-activities__calendar-cell--in-view': isCurrentMonth,
          'my-activities__calendar-cell--has-event': Boolean(event),
          'my-activities__calendar-cell--primary': event?.type === 'primary',
          'my-activities__calendar-cell--warning': event?.type === 'warning',
          'my-activities__calendar-cell--success': event?.type === 'success',
        })}
      >
        <span className={cx('my-activities__calendar-date')}>{current.date()}</span>
      </div>
    );
  };

  const handleRegister = useCallback(
    async ({ activity, note }) => {
      if (!activity?.id) return;
      await registerMutation.mutateAsync({ id: activity.id, note });
    },
    [registerMutation],
  );

  const handleCancel = useCallback(
    async ({ activity, reason, note }) => {
      if (!activity?.id) return;
      await cancelMutation.mutateAsync({ id: activity.id, reason, note });
    },
    [cancelMutation],
  );

  const handleAttendance = useCallback(
    async ({ activity, dataUrl, file, phase }) => {
      if (!activity?.id) return;

      let evidenceDataUrl = dataUrl ?? null;
      if (!evidenceDataUrl && file) {
        try {
          evidenceDataUrl = await fileToDataUrl(file);
        } catch {
          toast({ message: 'Không thể đọc dữ liệu ảnh điểm danh. Vui lòng thử lại.', variant: 'danger' });
          return;
        }
      }

      await attendanceMutation.mutateAsync({
        id: activity.id,
        payload: {
          status: 'present',
          phase,
          evidence: evidenceDataUrl ? { data: evidenceDataUrl, mimeType: file?.type, fileName: file?.name } : undefined,
        },
      });
    },
    [attendanceMutation, toast],
  );

  const handleFeedback = useCallback(
    async ({ activity, content, files }) => {
      if (!activity?.id) return;
      const attachments = (files || []).map((file) => file?.name).filter(Boolean);
      await feedbackMutation.mutateAsync({ id: activity.id, content, attachments });
    },
    [feedbackMutation],
  );

  const buildCards = useCallback(
    (items) =>
      items.map((registration) => (
        <CardActivity
          key={registration.id}
          {...registration.activity}
          variant="vertical"
          state={registration.activity?.state}
          onRegistered={handleRegister}
          onCancelRegister={handleCancel}
          onConfirmPresent={handleAttendance}
          onSendFeedback={handleFeedback}
          attendanceLoading={attendanceMutation.isPending}
        />
      )),
    [handleRegister, handleCancel, handleAttendance, handleFeedback, attendanceMutation.isPending],
  );

  const renderTabContent = useCallback(
    (tabKey, items, emptyText) => {
      const { total, current, pageItems } = paginate(items, tabKey);

      if (isFetching && registrations.length === 0) {
        return (
          <div className={cx('my-activities__list')}>
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <CardActivity key={`skeleton-${tabKey}-${index}`} loading variant="vertical" />
            ))}
          </div>
        );
      }

      if (!total) {
        return (
          <div className={cx('my-activities__empty')}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText || 'Không có hoạt động nào'} />
          </div>
        );
      }

      return (
        <>
          <div className={cx('my-activities__list')}>{buildCards(pageItems)}</div>
          <Pagination
            className={cx('my-activities__pagination')}
            current={current}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={(page) => handlePageChange(tabKey, page)}
            showSizeChanger={false}
            hideOnSinglePage
          />
        </>
      );
    },
    [buildCards, handlePageChange, paginate, isFetching, registrations.length],
  );

  const tabItems = useMemo(() => {
    const { registered, attended, canceled } = stats;

    return [
      {
        key: 'registered',
        label: (
          <div className={cx('my-activities__tab-label')}>
            <FontAwesomeIcon icon={faCalendarCheck} className={cx('my-activities__tab-icon')} />
            <span>Đã đăng ký</span>
            <span className={cx('my-activities__tab-badge')}>{registered.length}</span>
          </div>
        ),
        children: renderTabContent('registered', registered, 'Chưa có hoạt động nào được đăng ký'),
      },
      {
        key: 'attended',
        label: (
          <div className={cx('my-activities__tab-label')}>
            <FontAwesomeIcon icon={faCircleCheck} className={cx('my-activities__tab-icon')} />
            <span>Đã tham gia</span>
            <span className={cx('my-activities__tab-badge')}>{attended.length}</span>
          </div>
        ),
        children: renderTabContent('attended', attended, 'Chưa có hoạt động nào đã tham gia'),
      },
      {
        key: 'canceled',
        label: (
          <div className={cx('my-activities__tab-label')}>
            <FontAwesomeIcon icon={faClock} className={cx('my-activities__tab-icon')} />
            <span>Đã hủy</span>
            <span className={cx('my-activities__tab-badge')}>{canceled.length}</span>
          </div>
        ),
        children: renderTabContent('canceled', canceled, 'Chưa có hoạt động nào bị hủy'),
      },
    ];
  }, [renderTabContent, stats]);

  return (
    <ConfigProvider locale={viVN}>
      <section className={cx('my-activities')}>
        {contextHolder}

        <div className={cx('my-activities__container')}>
          {/* Header */}
          <header className={cx('my-activities__header')}>
            <nav className={cx('my-activities__header-breadcrumb')} aria-label="Breadcrumb">
              <Link to="/">Trang chủ</Link> / <span>Hoạt động của tôi</span>
            </nav>

            <Label title="Hoạt động" highlight="của tôi" leftDivider={false} rightDivider showSubtitle={false} />
          </header>

          {/* Stats */}
          <div className={cx('my-activities__stats')}>
            <div className={`${cx('my-activities__stat-card')} ${cx('my-activities__stat-card--orange')}`}>
              <div className={cx('my-activities__stat-card-row')}>
                <div className={cx('my-activities__stat-card-info')}>
                  <div className={cx('my-activities__stat-card-label')}>Điểm CTXH</div>
                  <div className={cx('my-activities__stat-card-value')}>{stats.totalPoints}</div>
                </div>
                <div className={cx('my-activities__stat-card-icon')}>
                  <FontAwesomeIcon icon={faTrophy} className={cx('my-activities__stat-card-icon-mark')} />
                </div>
              </div>
            </div>

            <div className={`${cx('my-activities__stat-card')} ${cx('my-activities__stat-card--blue')}`}>
              <div className={cx('my-activities__stat-card-row')}>
                <div className={cx('my-activities__stat-card-info')}>
                  <div className={cx('my-activities__stat-card-label')}>Tổng hoạt động</div>
                  <div className={cx('my-activities__stat-card-value')}>{stats.totalActivities}</div>
                </div>
                <div className={cx('my-activities__stat-card-icon')}>
                  <FontAwesomeIcon icon={faCalendarCheck} className={cx('my-activities__stat-card-icon-mark')} />
                </div>
              </div>
            </div>

            <div className={`${cx('my-activities__stat-card')} ${cx('my-activities__stat-card--green')}`}>
              <div className={cx('my-activities__stat-card-row')}>
                <div className={cx('my-activities__stat-card-info')}>
                  <div className={cx('my-activities__stat-card-label')}>Đã hoàn thành</div>
                  <div className={cx('my-activities__stat-card-value')}>{stats.completed}</div>
                </div>
                <div className={cx('my-activities__stat-card-icon')}>
                  <FontAwesomeIcon icon={faCircleCheck} className={cx('my-activities__stat-card-icon-mark')} />
                </div>
              </div>
            </div>

            <div className={`${cx('my-activities__stat-card')} ${cx('my-activities__stat-card--purple')}`}>
              <div className={cx('my-activities__stat-card-row')}>
                <div className={cx('my-activities__stat-card-info')}>
                  <div className={cx('my-activities__stat-card-label')}>Đang chờ</div>
                  <div className={cx('my-activities__stat-card-value')}>{stats.pending}</div>
                </div>
                <div className={cx('my-activities__stat-card-icon')}>
                  <FontAwesomeIcon icon={faClock} className={cx('my-activities__stat-card-icon-mark')} />
                </div>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className={cx('my-activities__calendar')}>
            <h3 className={cx('my-activities__calendar-title')}>Lịch hoạt động sắp tới</h3>
            <Calendar
              fullscreen={false}
              fullCellRender={fullCellRender}
              className={cx('my-activities__calendar-panel')}
            />

            {/* Legend */}
            <div className={cx('my-activities__legend')}>
              <div className={cx('my-activities__legend-item')}>
                <span className={cx('my-activities__legend-dot', 'my-activities__legend-dot--primary')} />
                <span>Đã đăng ký</span>
              </div>
              <div className={cx('my-activities__legend-item')}>
                <span className={cx('my-activities__legend-dot', 'my-activities__legend-dot--success')} />
                <span>Đã tham gia</span>
              </div>
              <div className={cx('my-activities__legend-item')}>
                <span className={cx('my-activities__legend-dot', 'my-activities__legend-dot--warning')} />
                <span>Đã hủy/Vắng mặt</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={cx('my-activities__tabs')}>
            <Tabs
              defaultActiveKey="registered"
              items={tabItems}
              type="line"
              size="large"
              tabBarGutter={12}
              renderTabBar={(props, TabBar) => {
                const RenderedTabBar = TabBar;
                return (
                  <>
                    <RenderedTabBar {...props} />

                    {/* Thanh tìm kiếm */}
                    <div className={cx('my-activities__search')}>
                      <Input
                        placeholder="Nhập từ khóa"
                        size="large"
                        className={cx('my-activities__search-input')}
                        allowClear
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                      />

                      <Select
                        value={selectedYear}
                        size="large"
                        className={cx('my-activities__search-select')}
                        onChange={setSelectedYear}
                      >
                        <Select.Option value="all">Tất cả năm học</Select.Option>
                        {academicYears.map((year) => (
                          <Select.Option key={year} value={year}>
                            {year}
                          </Select.Option>
                        ))}
                      </Select>

                      <Select
                        value={selectedSemester}
                        size="large"
                        className={cx('my-activities__search-select')}
                        onChange={setSelectedSemester}
                      >
                        <Select.Option value="all">Tất cả học kỳ</Select.Option>
                        {semesters.map((semester) => (
                          <Select.Option key={semester} value={semester}>
                            {semester}
                          </Select.Option>
                        ))}
                      </Select>

                      <Button
                        type="primary"
                        size="large"
                        className={cx('my-activities__reset-button')}
                        icon={<FontAwesomeIcon icon={faArrowRotateRight} />}
                        onClick={() => {
                          setKeyword('');
                          setSelectedYear('all');
                          setSelectedSemester('all');
                          refetch();
                        }}
                        loading={isFetching}
                      >
                        Đặt lại
                      </Button>
                    </div>

                    <div className={cx('my-activities__title')}>Danh sách hoạt động</div>
                  </>
                );
              }}
            />
          </div>
        </div>
      </section>
    </ConfigProvider>
  );
}

export default MyActivitiesPage;
