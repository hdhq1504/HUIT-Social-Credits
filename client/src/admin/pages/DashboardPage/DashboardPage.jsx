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
} from '@fortawesome/free-solid-svg-icons';
import { AdminPageContext } from '@/admin/contexts/AdminPageContext';
import { ROUTE_PATHS } from '@/config/routes.config';
import AdminSearchBar from '../../layouts/AdminSearchBar/AdminSearchBar';
import activitiesApi, { DASHBOARD_QUERY_KEY } from '@/api/activities.api';
import styles from './DashboardPage.module.scss';

const cx = classNames.bind(styles);
dayjs.extend(relativeTime);
dayjs.locale('vi');

const chartData = {
  2022: [
    { name: 'T1', group1: 10, group2: 5 },
    { name: 'T2', group1: 12, group2: 7 },
  ],
  2023: [
    { name: 'T1', group1: 15, group2: 10 },
    { name: 'T2', group1: 18, group2: 12 },
    { name: 'T3', group1: 20, group2: 15 },
    { name: 'T4', group1: 17, group2: 11 },
    { name: 'T5', group1: 22, group2: 18 },
    { name: 'T6', group1: 25, group2: 20 },
  ],
};
const upcomingEvents = [
  {
    title: 'Chiến dịch Mùa Hè Xanh 2024',
    location: 'Huyện Cần Giờ, TP.HCM',
    date: '15/07/2024',
    participants: 120,
  },
];
const pendingFeedback = [
  {
    name: 'Nguyễn Văn A',
    message: 'Xin chào, tôi đã tham gia...',
    time: '2 giờ trước',
  },
];

export default function DashboardPage() {
  const [year, setYear] = useState(2023);
  const { setPageActions } = useContext(AdminPageContext);
  const navigate = useNavigate();

  const { data: recentActivities, isLoading: isLoadingRecent } = useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, 'recent'],
    queryFn: activitiesApi.getRecent,
  });

  useEffect(() => {
    setPageActions([
      {
        key: 'add',
        label: 'Thêm mới hoạt động mới',
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

    // -----
    // TODO: Khi API của bạn trả về một "luồng thông báo" (thay vì chỉ hoạt động)
    // Bạn cần cập nhật logic map dữ liệu và hàm getIconForActivity() bên dưới
    // -----

    // Hàm helper để chọn icon và style dựa trên loại
    const getIconForActivity = (activity) => {
      const type = activity.type || 'CREATED';

      switch (type) {
        case 'COMPLETED':
          return {
            icon: faCheck,
            className: '--complete',
          };
        case 'REGISTERED':
          return {
            icon: faUsers,
            className: '--register',
          };
        case 'CREATED':
        default:
          return {
            icon: faPlus,
            className: '--create',
          };
      }
    };

    const mappedActivities = recentActivities.map((activity) => {
      const iconInfo = getIconForActivity(activity);
      return {
        id: activity.id,
        icon: iconInfo.icon,
        iconClassName: iconInfo.className,
        title: `Tạo hoạt động mới "${activity.title || 'Hoạt động'}"`,
        desc: activity.description || `Hoạt động mới với sức chứa ${activity.maxCapacity || '...'} người.`,
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
      {/* Filter search bar */}
      <AdminSearchBar
        facultyOptions={[
          { value: 'all', label: 'Tất cả khoa' },
          { value: 'cntt', label: 'Khoa CNTT' },
          { value: 'kt', label: 'Khoa Kế toán' },
        ]}
      />

      {/* Quick stats */}
      <section className={cx('dashboard__stats')}>
        {[
          {
            icon: <FontAwesomeIcon icon={faCalendarCheck} size={22} color="#fff" />,
            count: 156,
            label: 'Hoạt động CTXH',
            badge: '+12%',
            color: 'blue',
          },
          {
            icon: <FontAwesomeIcon icon={faUsers} size={22} color="#fff" />,
            count: 1245,
            label: 'Sinh viên tham gia',
            badge: '+8%',
            color: 'green',
          },
          {
            icon: <FontAwesomeIcon icon={faComments} size={22} color="#fff" />,
            count: 89,
            label: 'Phản hồi chờ xử lý',
            badge: '-2%',
            color: 'purple',
            negative: true,
          },
        ].map((item, idx) => (
          <div key={idx} className={cx('dashboard__stat-card')}>
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

      {/* Dashboard grid */}
      <section className={cx('dashboard__grid')}>
        <div className={cx('dashboard__chart')}>
          <div className={cx('dashboard__chart-header')}>
            <h3 className={cx('dashboard__chart-title')}>Hoạt động CTXH theo tháng</h3>
            <div className={cx('dashboard__chart-year-group')}>
              {[2022, 2023].map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={cx('dashboard__chart-year-chip', { 'dashboard__chart-year-chip--active': year === y })}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData[year]} barCategoryGap={18} barGap={6}>
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
              <Bar dataKey="group1" name="Hoạt động nhóm 1" fill="#00008B" barSize={12} radius={[6, 6, 0, 0]} />
              <Bar dataKey="group2" name="Hoạt động nhóm 2,3" fill="#FF5C00" barSize={12} radius={[6, 6, 0, 0]} />
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
            <a href="/upcoming" className={cx('dashboard__upcoming-view-more')}>
              Xem tất cả <FontAwesomeIcon icon={faArrowRight} />
            </a>
          </div>
          <div className={cx('dashboard__upcoming-list')}>
            {upcomingEvents.map((event, idx) => (
              <div key={idx} className={cx('dashboard__upcoming-item')}>
                <h4 className={cx('dashboard__upcoming-title')}>{event.title}</h4>
                <p className={cx('dashboard__upcoming-location')}>{event.location}</p>
                <div className={cx('dashboard__upcoming-footer')}>
                  <div className={cx('dashboard__upcoming-date')}>
                    <FontAwesomeIcon icon={faCalendar} />
                    <span>{event.date}</span>
                  </div>
                  <div className={cx('dashboard__upcoming-participants')}>
                    <FontAwesomeIcon icon={faUsers} />
                    <span>{event.participants} người</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cx('dashboard__feedback')}>
          <div className={cx('dashboard__feedback-header')}>
            <h3>Phản hồi chờ xử lý</h3>
            <a href="/pending" className={cx('dashboard__feedback-view-more')}>
              Xem tất cả <FontAwesomeIcon icon={faArrowRight} />
            </a>
          </div>
          <div className={cx('dashboard__feedback-list')}>
            {pendingFeedback.map((feedback, idx) => (
              <div key={idx} className={cx('dashboard__feedback-item')}>
                <img
                  src={feedback.avatar || `https://i.pravatar.cc/40?img=${idx + 5}`}
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
                    <span className={cx('dashboard__feedback-time')}>{feedback.time}</span>
                  </div>
                  <p className={cx('dashboard__feedback-message')}>{feedback.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
