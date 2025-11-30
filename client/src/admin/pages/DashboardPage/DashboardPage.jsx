import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faCalendar,
  faCalendarCheck,
  faComments,
  faUsers,
  faPlus,
  faSpinner,
  faCheck,
  faPenToSquare,
  faXmark,
  faCircleCheck,
  faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS } from '@/config/routes.config';
import activitiesApi, { DASHBOARD_QUERY_KEY } from '@/api/activities.api';
import statsApi, { ADMIN_DASHBOARD_QUERY_KEY } from '@/api/stats.api';
import { formatDateTime } from '@/utils/datetime';
import styles from './DashboardPage.module.scss';
import { useMemo } from 'react';

const cx = classNames.bind(styles);
dayjs.extend(relativeTime);
dayjs.locale('vi');

const formatPercentChange = (value) => {
  if (value == null) return '0%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}%`;
};

export default function DashboardPage() {
  const [year, setYear] = useState(dayjs().year());
  const { setPageActions } = useContext(AdminPageContext);
  const navigate = useNavigate();

  const { data: recentActivities, isLoading: isLoadingRecent } = useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, 'recent'],
    queryFn: activitiesApi.getRecent,
  });

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ADMIN_DASHBOARD_QUERY_KEY,
    queryFn: statsApi.getAdminDashboard,
  });

  const availableYears = useMemo(() => {
    if (!dashboardData?.chart) return [];
    return Object.keys(dashboardData.chart)
      .map((key) => Number(key))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);
  }, [dashboardData?.chart]);

  useEffect(() => {
    if (!availableYears.length) return;
    if (!availableYears.includes(year)) {
      setYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears, year]);

  const chartRows = useMemo(() => {
    if (!dashboardData?.chart || !year) return [];
    const rows = dashboardData.chart[year];
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
      name: row.label ?? `T${row.month ?? ''}`,
      group1: row.group1 ?? 0,
      group2: row.group2 ?? 0,
      group3: row.group3 ?? 0,
    }));
  }, [dashboardData?.chart, year]);

  const overviewCards = useMemo(() => {
    const overview = dashboardData?.overview;
    const baseCards = [
      {
        key: 'activities',
        icon: <FontAwesomeIcon icon={faCalendarCheck} size={22} color="#fff" />,
        count: overview?.activities?.total ?? 0,
        label: 'Hoạt động CTXH',
        percent: overview?.activities?.changePercent ?? 0,
        color: 'blue',
      },
      {
        key: 'participants',
        icon: <FontAwesomeIcon icon={faUsers} size={22} color="#fff" />,
        count: overview?.participants?.total ?? 0,
        label: 'Sinh viên tham gia',
        percent: overview?.participants?.changePercent ?? 0,
        color: 'green',
      },
      {
        key: 'feedbacks',
        icon: <FontAwesomeIcon icon={faComments} size={22} color="#fff" />,
        count: overview?.feedbacks?.total ?? 0,
        label: 'Phản hồi chờ xử lý',
        percent: overview?.feedbacks?.changePercent ?? 0,
        color: 'purple',
      },
    ];

    return baseCards.map(({ percent, ...card }) => ({
      ...card,
      count: isLoadingDashboard ? '--' : card.count,
      badge: isLoadingDashboard ? '--' : formatPercentChange(percent),
      negative: !isLoadingDashboard && percent < 0,
    }));
  }, [dashboardData?.overview, isLoadingDashboard]);

  const upcomingActivities = dashboardData?.upcoming ?? [];
  const pendingFeedback = dashboardData?.feedbacks ?? [];

  useEffect(() => {
    setPageActions([
      {
        key: 'add',
        label: 'Thêm hoạt động mới',
        icon: <FontAwesomeIcon icon={faPlus} />,
        type: 'primary',
        className: 'admin-navbar__add-button',
        onClick: () => navigate(ROUTE_PATHS.ADMIN.ACTIVITY_CREATE),
      },
    ]);

    return () => setPageActions(null);
  }, [setPageActions, navigate]);

  const renderRecentActivities = () => {
    if (isLoadingRecent) {
      return (
        <li className={cx('dashboard__recent-item')} style={{ justifyContent: 'center' }}>
          <FontAwesomeIcon icon={faSpinner} spin />
          <span style={{ marginLeft: 8 }}>Đang tải...</span>
        </li>
      );
    }

    if (!recentActivities || recentActivities.length === 0) {
      return <li className={cx('dashboard__recent-item')}>Không có hoạt động gần đây.</li>;
    }

    const getIconForActivity = (activity) => {
      const type = activity.type || 'CREATED';

      switch (type) {
        case 'COMPLETED':
          return {
            icon: faCheck,
            className: 'dashboard__recent-icon-wrapper--complete',
          };
        case 'REGISTERED':
          return {
            icon: faUsers,
            className: 'dashboard__recent-icon-wrapper--register',
          };
        case 'UPDATED':
          return {
            icon: faPenToSquare,
            className: 'dashboard__recent-icon-wrapper--update',
          };
        case 'CANCELLED':
          return {
            icon: faXmark,
            className: 'dashboard__recent-icon-wrapper--cancel',
          };
        case 'APPROVED':
          return {
            icon: faCircleCheck,
            className: 'dashboard__recent-icon-wrapper--approved',
          };
        case 'FEEDBACK_RECEIVED':
          return {
            icon: faComments,
            className: 'dashboard__recent-icon-wrapper--feedback',
          };
        case 'ATTENDANCE_CHECKED':
          return {
            icon: faClipboardCheck,
            className: 'dashboard__recent-icon-wrapper--attendance',
          };
        case 'CREATED':
        default:
          return {
            icon: faPlus,
            className: 'dashboard__recent-icon-wrapper--create',
          };
      }
    };

    const mappedActivities = recentActivities.map((activity) => {
      const iconInfo = getIconForActivity(activity);

      let title = '';
      let desc = '';

      const activityTitle = activity.title || 'Hoạt động';
      const maxCapacity = activity.maxCapacity || 0;
      const currentParticipants = activity.participantsCount || 0;
      const organizer = activity.organizer || 'Hệ thống';

      switch (activity.type) {
        case 'COMPLETED':
          title = `Hoạt động "${activityTitle}"`;
          desc = `${currentParticipants} sinh viên đã tham gia thành công.`;
          break;
        case 'REGISTERED':
          title = `${currentParticipants} sinh viên mới đăng ký tham...`;
          desc = `Hoạt động "${activityTitle}" có thêm ${currentParticipants} người đăng ký.`;
          break;
        case 'UPDATED':
          title = `Cập nhật hoạt động "${activityTitle}"`;
          desc = `${organizer} đã chỉnh sửa thông tin hoạt động.`;
          break;
        case 'CANCELLED':
          title = `Hủy hoạt động "${activityTitle}"`;
          desc = `Hoạt động đã bị hủy bởi ${organizer}.`;
          break;
        case 'APPROVED':
          title = `Phê duyệt hoạt động "${activityTitle}"`;
          desc = `${organizer} đã phê duyệt hoạt động này.`;
          break;
        case 'FEEDBACK_RECEIVED':
          title = `Nhận phản hồi mới cho "${activityTitle}"`;
          desc = `${currentParticipants} sinh viên đã gửi phản hồi.`;
          break;
        case 'ATTENDANCE_CHECKED':
          title = `Điểm danh hoạt động "${activityTitle}"`;
          desc = `${currentParticipants} sinh viên đã được điểm danh.`;
          break;
        case 'CREATED':
        default:
          title = `Tạo hoạt động mới "${activityTitle}"`;
          desc = maxCapacity
            ? `${organizer} tạo hoạt động mới với sức chứa ${maxCapacity} người.`
            : `${organizer} tạo hoạt động mới.`;
          break;
      }

      return {
        id: activity.id,
        icon: iconInfo.icon,
        iconClassName: iconInfo.className,
        title,
        desc,
        time: activity.createdAt ? dayjs(activity.createdAt).fromNow() : 'Vừa xong',
      };
    });

    return mappedActivities.map((item) => (
      <li key={item.id} className={cx('dashboard__recent-item')}>
        <div className={cx('dashboard__recent-icon-wrapper', item.iconClassName)}>
          <FontAwesomeIcon icon={item.icon} />
        </div>

        <div className={cx('dashboard__recent-content')}>
          <div className={cx('dashboard__recent-top')}>
            <strong className={cx('dashboard__recent-title', 'dashboard__truncate')}>{item.title}</strong>
            <span className={cx('dashboard__recent-time')}>{item.time}</span>
          </div>
          <p className={cx('dashboard__recent-desc', 'dashboard__truncate')}>{item.desc}</p>
        </div>
      </li>
    ));
  };

  return (
    <div className={cx('dashboard')}>
      <section className={cx('dashboard__stats')}>
        {overviewCards.map((item) => (
          <div key={item.key} className={cx('dashboard__stat-card')}>
            <div className={cx('dashboard__icon-box', `dashboard__icon-box--${item.color}`)}>{item.icon}</div>
            <div className={cx('dashboard__stat-info')}>
              <h2>{item.count}</h2>
              <p>{item.label}</p>
            </div>
            <span
              className={cx('dashboard__badge', {
                'dashboard__badge--positive': !item.negative,
                'dashboard__badge--negative': item.negative,
              })}
            >
              {item.badge}
            </span>
          </div>
        ))}
      </section>

      <section className={cx('dashboard__grid')}>
        <div className={cx('dashboard__chart')}>
          <div className={cx('dashboard__chart-header')}>
            <h3 className={cx('dashboard__chart-title')}>Hoạt động CTXH theo tháng</h3>
            <div className={cx('dashboard__chart-year-group')}>
              {availableYears.length > 0 ? (
                availableYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={cx('dashboard__chart-year-chip', {
                      'dashboard__chart-year-chip--active': year === y,
                    })}
                  >
                    {y}
                  </button>
                ))
              ) : (
                <span className={cx('dashboard__chart-year-chip')} style={{ cursor: 'default', opacity: 0.6 }}>
                  Chưa có dữ liệu
                </span>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartRows} barCategoryGap={18} barGap={6}>
              <CartesianGrid stroke="#B3B3B3" strokeOpacity={0.35} vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={{ stroke: 'rgba(0,0,0,0.6)' }}
                tick={{ fontSize: 12, fill: 'var(--black-color)' }}
                dy={8}
              />
              <YAxis
                domain={[0, 30]}
                ticks={[0, 10, 20, 30]}
                tickLine={false}
                axisLine={{ stroke: 'rgba(0,0,0,0.6)' }}
                tick={{ fontSize: 12, fill: 'var(--black-color)' }}
                label={{
                  value: 'Số lượng hoạt động',
                  angle: -90,
                  position: 'middle',
                  style: { fill: 'rgba(0,0,0,0.6)', fontSize: 13, fontWeight: 500 },
                }}
              />
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingTop: 14 }}
              />
              <Bar dataKey="group1" name="Nhóm 1" fill="#00008B" barSize={12} radius={[6, 6, 0, 0]} />
              <Bar dataKey="group2" name="Nhóm 2" fill="#FF5C00" barSize={12} radius={[6, 6, 0, 0]} />
              <Bar dataKey="group3" name="Nhóm 3" fill="#10B981" barSize={12} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={cx('dashboard__recent')}>
          <h3 className={cx('dashboard__recent-title')}>Hoạt động gần đây</h3>
          <ul className={cx('dashboard__recent-list')}>{renderRecentActivities()}</ul>
        </div>

        <div className={cx('dashboard__upcoming')}>
          <div className={cx('dashboard__upcoming-header')}>
            <h3>Hoạt động sắp diễn ra</h3>
            <a href={ROUTE_PATHS.ADMIN.ACTIVITIES} className={cx('dashboard__upcoming-view-more')}>
              Xem tất cả <FontAwesomeIcon icon={faArrowRight} />
            </a>
          </div>
          <div className={cx('dashboard__upcoming-list')}>
            {isLoadingDashboard ? (
              <div className={cx('dashboard__upcoming-item')}>Đang tải dữ liệu...</div>
            ) : upcomingActivities.length ? (
              upcomingActivities.map((event) => (
                <div key={event.id} className={cx('dashboard__upcoming-item')}>
                  <h4 className={cx('dashboard__upcoming-title')}>{event.title}</h4>
                  <p className={cx('dashboard__upcoming-location')}>{event.location}</p>
                  <div className={cx('dashboard__upcoming-footer')}>
                    <div className={cx('dashboard__upcoming-date')}>
                      <FontAwesomeIcon icon={faCalendar} />
                      <span>{formatDateTime(event.startTime)}</span>
                    </div>
                    <div className={cx('dashboard__upcoming-participants')}>
                      <FontAwesomeIcon icon={faUsers} />
                      <span>
                        {event.participantsCount}
                        {event.maxCapacity ? `/${event.maxCapacity}` : ''} người
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={cx('dashboard__upcoming-item')}>Không có hoạt động sắp diễn ra.</div>
            )}
          </div>
        </div>

        <div className={cx('dashboard__feedback')}>
          <div className={cx('dashboard__feedback-header')}>
            <h3>Phản hồi chờ xử lý</h3>
            <a href={ROUTE_PATHS.ADMIN.FEEDBACKS} className={cx('dashboard__feedback-view-more')}>
              Xem tất cả <FontAwesomeIcon icon={faArrowRight} />
            </a>
          </div>
          <div className={cx('dashboard__feedback-list')}>
            {isLoadingDashboard ? (
              <div className={cx('dashboard__feedback-item')}>Đang tải dữ liệu...</div>
            ) : pendingFeedback.length ? (
              pendingFeedback.map((feedback, idx) => (
                <div key={feedback.id || idx} className={cx('dashboard__feedback-item')}>
                  <img
                    src={feedback.avatarUrl}
                    alt={feedback.name}
                    className={cx('dashboard__feedback-avatar')}
                  />
                  <div className={cx('dashboard__feedback-content')}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <strong className={cx('dashboard__feedback-name')}>{feedback.name}</strong>
                      <span className={cx('dashboard__feedback-time')}>
                        {feedback.submittedAt ? dayjs(feedback.submittedAt).fromNow() : 'Vừa xong'}
                      </span>
                    </div>
                    <p className={cx('dashboard__feedback-message')}>{feedback.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className={cx('dashboard__feedback-item')}>Không có phản hồi chờ xử lý.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
