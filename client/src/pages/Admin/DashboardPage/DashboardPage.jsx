import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarDays, Users, MessageSquare, ArrowRight, Calendar } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './DashboardPage.module.scss';
import { chartData, recentActivities, upcomingEvents, pendingFeedback } from './DashboardPageData.jsx';

const cx = classNames.bind(styles);

export default function DashboardPage() {
  const [year, setYear] = useState(2023);

  return (
    <div className={cx('dashboard')}>
      {/* 1. Header */}
      <header className={cx('dashboard__header')}>
        <h1 className={cx('dashboard__title')}>Bảng điều khiển tổng quan</h1>
        <button className={cx('dashboard__add-btn')}>
          <span className={cx('dashboard__add-btn-icon')}>+</span> Thêm hoạt động mới
        </button>
      </header>

      {/* 2. Filter Bar */}
      <section className={cx('dashboard__filter-bar')}>
        <input type="text" placeholder="Tìm kiếm hoạt động..." className={cx('dashboard__search-input')} />
        <select className={cx('dashboard__select')}>
          <option>Chọn học kỳ</option>
          <option>Học kỳ 1</option>
          <option>Học kỳ 2</option>
        </select>
        <select className={cx('dashboard__select')}>
          <option>Chọn năm học</option>
          <option>2024 - 2025</option>
          <option>2025 - 2026</option>
        </select>
        <select className={cx('dashboard__select')}>
          <option>Tất cả khoa</option>
          <option>CNTT</option>
          <option>Kinh tế</option>
        </select>
        <button className={cx('dashboard__filter-btn')}>🔍 Lọc</button>
      </section>

      {/* 3. Quick Stats */}
      <section className={cx('dashboard__stats')}>
        {[
          {
            icon: <CalendarDays size={22} color="#fff" />,
            count: 156,
            label: 'Hoạt động CTXH',
            badge: '+12%',
            color: 'blue',
          },
          {
            icon: <Users size={22} color="#fff" />,
            count: 1245,
            label: 'Sinh viên tham gia',
            badge: '+8%',
            color: 'green',
          },
          {
            icon: <MessageSquare size={22} color="#fff" />,
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

      {/* 4. Chart + Recent Activities */}
      <section className={cx('dashboard__chart-section')}>
        <div className={cx('dashboard__chart-box')}>
          <div className={cx('dashboard__chart-header')}>
            <h3>Hoạt động CTXH theo tháng</h3>
            <div className={cx('dashboard__year-buttons')}>
              {[2022, 2023].map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={cx('dashboard__year-btn', { 'dashboard__year-btn--active': year === y })}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData[year]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 30]} ticks={[0, 10, 20, 30]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="group1" name="Nhóm 1" fill="#00008b" />
              <Bar dataKey="group2" name="Nhóm 2,3" fill="#ff5200" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={cx('dashboard__recent-box')}>
          <h3>Hoạt động gần đây</h3>
          <ul className={cx('dashboard__recent-list')}>
            {recentActivities.map((item, idx) => (
              <li key={idx} className={cx('dashboard__recent-item')}>
                <div className={cx('dashboard__recent-icon')}>{item.icon}</div>
                <div className={cx('dashboard__recent-content')}>
                  <strong>{item.title}</strong>
                  <p className={cx('dashboard__recent-desc', 'dashboard__truncate')}>{item.desc}</p>
                </div>
                <div className={cx('dashboard__recent-time')}>{item.time}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. Two Columns: Upcoming & Feedback */}
      <section className={cx('dashboard__two-column')}>
        {/* Upcoming Events */}
        <div className={cx('dashboard__card')}>
          <div className={cx('dashboard__card-header')}>
            <h3>Hoạt động sắp diễn ra</h3>
            <a href="/upcoming" className={cx('dashboard__view-more')}>
              Xem tất cả <ArrowRight size={14} />
            </a>
          </div>
          <div className={cx('dashboard__upcoming-list')}>
            {upcomingEvents.map((event, idx) => (
              <div key={idx} className={cx('dashboard__upcoming-item')}>
                <h4 className={cx('dashboard__upcoming-title')}>{event.title}</h4>
                <p className={cx('dashboard__upcoming-location')}>{event.location}</p>
                <div className={cx('dashboard__upcoming-footer')}>
                  <div className={cx('dashboard__upcoming-date')}>
                    <Calendar size={14} />
                    <span>{event.date}</span>
                  </div>
                  <div className={cx('dashboard__upcoming-participants')}>
                    <Users size={14} />
                    <span>{event.participants} người</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Feedback */}
        <div className={cx('dashboard__card')}>
          <div className={cx('dashboard__card-header')}>
            <h3>Phản hồi chờ xử lý</h3>
            <a href="/pending" className={cx('dashboard__view-more')}>
              Xem tất cả <ArrowRight size={14} />
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
                  <strong className={cx('dashboard__feedback-name')}>{feedback.name}</strong>
                  <p className={cx('dashboard__feedback-message')}>{feedback.message}</p>
                </div>
                <span className={cx('dashboard__feedback-time')}>{feedback.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
