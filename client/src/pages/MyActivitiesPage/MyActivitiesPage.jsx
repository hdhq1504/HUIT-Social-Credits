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
import { Button, Calendar, ConfigProvider, Input, Select, Tabs } from 'antd';
import viVN from 'antd/es/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import updateLocale from 'dayjs/plugin/updateLocale';
import CardActivity from '@components/CardActivity/CardActivity';
import Label from '@components/Label/Label';
import useToast from '@components/Toast/Toast';
import activitiesApi from '@api/activities.api';
import styles from './MyActivitiesPage.module.scss';

const cx = classNames.bind(styles);

dayjs.extend(updateLocale);
dayjs.locale('vi');
dayjs.updateLocale('vi', { weekStart: 1 });

function MyActivitiesPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { contextHolder, open: toast } = useToast();

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await activitiesApi.listMine();
      setRegistrations(data);
    } catch (error) {
      const message = error.response?.data?.error || 'Không thể tải danh sách hoạt động của bạn';
      toast({ message, variant: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const stats = useMemo(() => {
    const registered = registrations.filter((item) => item.status === 'DANG_KY');
    const attended = registrations.filter((item) => item.status === 'DA_THAM_GIA');
    const canceled = registrations.filter((item) => item.status === 'DA_HUY' || item.status === 'VANG_MAT');
    const totalPoints = attended.reduce((sum, item) => sum + (item.activity?.points ?? 0), 0);
    const pendingFeedback = attended.filter((item) => item.feedback?.status !== 'DA_DUYET').length;

    return {
      totalPoints,
      totalActivities: registrations.length,
      completed: attended.length,
      pending: pendingFeedback,
      registered,
      attended,
      canceled,
    };
  }, [registrations]);

  const calendarEvents = useMemo(() => {
    const map = {};
    registrations.forEach((registration) => {
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
  }, [registrations]);

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
      await activitiesApi.register(activity.id, { note });
      await fetchRegistrations();
    },
    [fetchRegistrations],
  );

  const handleCancel = useCallback(
    async ({ activity, reason, note }) => {
      if (!activity?.id) return;
      await activitiesApi.cancel(activity.id, { reason, note });
      await fetchRegistrations();
    },
    [fetchRegistrations],
  );

  const handleAttendance = useCallback(
    async ({ activity }) => {
      if (!activity?.id) return;
      await activitiesApi.attendance(activity.id, {});
      await fetchRegistrations();
    },
    [fetchRegistrations],
  );

  const handleFeedback = useCallback(
    async ({ activity, content, files }) => {
      if (!activity?.id) return;
      const attachments = (files || []).map((file) => file?.name).filter(Boolean);
      await activitiesApi.feedback(activity.id, { content, attachments });
      await fetchRegistrations();
    },
    [fetchRegistrations],
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
        />
      )),
    [handleRegister, handleCancel, handleAttendance, handleFeedback],
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
        children: <div className={cx('my-activities__list')}>{buildCards(registered)}</div>,
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
        children: <div className={cx('my-activities__list')}>{buildCards(attended)}</div>,
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
        children: <div className={cx('my-activities__list')}>{buildCards(canceled)}</div>,
      },
    ];
  }, [stats, buildCards]);

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
                  <div className={cx('my-activities__stat-card-value')}>3</div>
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
                <span>Sắp diễn ra</span>
              </div>
              <div className={cx('my-activities__legend-item')}>
                <span className={cx('my-activities__legend-dot', 'my-activities__legend-dot--warning')} />
                <span>Đang diễn ra</span>
              </div>
              <div className={cx('my-activities__legend-item')}>
                <span className={cx('my-activities__legend-dot', 'my-activities__legend-dot--success')} />
                <span>Đã hủy</span>
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
              renderTabBar={(props, DefaultTabBar) => (
                <>
                  <DefaultTabBar {...props} />

                  {/* Thanh tìm kiếm */}
                  <div className={cx('my-activities__search')}>
                    <Input
                      placeholder="Nhập từ khóa"
                      size="large"
                      className={cx('my-activities__search-input')}
                      allowClear
                    />

                    <Select defaultValue="all" size="large" className={cx('my-activities__search-select')}>
                      <Select.Option value="all">Nhóm hoạt động</Select.Option>
                      <Select.Option value="mua-he-xanh">Mùa hè xanh</Select.Option>
                      <Select.Option value="hien-mau">Hiến máu</Select.Option>
                      <Select.Option value="dia-chi-do">Địa chỉ đỏ</Select.Option>
                    </Select>

                    <Select defaultValue="all" size="large" className={cx('my-activities__search-select')}>
                      <Select.Option value="all">Mới nhất</Select.Option>
                      <Select.Option value="oldest">Cũ nhất</Select.Option>
                      <Select.Option value="popular">Phổ biến nhất</Select.Option>
                    </Select>

                    <Button
                      type="primary"
                      size="large"
                      className={cx('my-activities__reset-button')}
                      icon={<FontAwesomeIcon icon={faArrowRotateRight} />}
                      onClick={fetchRegistrations}
                      loading={loading}
                    >
                      Đặt lại
                    </Button>
                  </div>

                  <div className={cx('my-activities__title')}>Danh sách hoạt động</div>
                </>
              )}
            />
          </div>
        </div>
      </section>
    </ConfigProvider>
  );
}

export default MyActivitiesPage;
