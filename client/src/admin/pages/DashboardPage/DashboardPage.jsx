import React, { useState } from 'react';
import classNames from 'classnames/bind';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCalendar, faCalendarCheck, faComments, faSearch, faUsers } from '@fortawesome/free-solid-svg-icons';
import styles from './DashboardPage.module.scss';
import { chartData, recentActivities, upcomingEvents, pendingFeedback } from './DashboardPageData.jsx';
import { TextAlignCenter } from 'lucide-react';

const cx = classNames.bind(styles);

export default function DashboardPage() {
  const [year, setYear] = useState(2023);

  return (
    <div className={cx('dashboard')}>
      {/* Filter search bar */}
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
        <button className={cx('dashboard__filter-btn')}><FontAwesomeIcon icon={faSearch} /> Lọc</button>
      </section>

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
