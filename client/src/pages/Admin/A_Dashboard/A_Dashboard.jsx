import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarDays, Users, MessageSquare, ArrowRight, Calendar } from 'lucide-react';

import layoutStyles from '../styles/AdminPage.module.scss';
import styles from './A_Dashboard.module.scss';
import { chartData, recentActivities, upcomingEvents, pendingFeedback } from './A_DashboardData.jsx';

export default function DashboardPage() {
  const [year, setYear] = useState(2023);

  return (
    <div className={layoutStyles.wrapper}>
      {/* === 1. Header === */}
      <div className={layoutStyles.header}>
        <h1 className={layoutStyles.title}>Bảng điều khiển tổng quan</h1>
        <button className={layoutStyles.addButton}>
          <span className={layoutStyles.addButton__icon}>+</span>
          Thêm hoạt động mới
        </button>
      </div>

      {/* === 2. Bộ lọc === */}
      <div className={styles.dashboard__filterBar}>
        <input type="text" placeholder="Tìm kiếm hoạt động..." className={styles.dashboard__searchInput} />
        <select className={styles.dashboard__select}>
          <option>Chọn học kỳ</option>
          <option>Học kỳ 1</option>
          <option>Học kỳ 2</option>
        </select>
        <select className={styles.dashboard__select}>
          <option>Chọn năm học</option>
          <option>2024 - 2025</option>
          <option>2025 - 2026</option>
        </select>
        <select className={styles.dashboard__select}>
          <option>Tất cả khoa</option>
          <option>CNTT</option>
          <option>Kinh tế</option>
        </select>
        <button className={styles.dashboard__filterButton}>🔍 Lọc</button>
      </div>

      {/* === 3. Thống kê nhanh === */}
      <div className={styles.dashboard__stats}>
        <div className={`${styles.dashboard__statCard}`}>
          <div className={`${styles.dashboard__iconBox} ${styles['dashboard__iconBox--blue']}`}>
            <CalendarDays size={22} color="#fff" />
          </div>
          <div className={styles.dashboard__statInfo}>
            <h2>156</h2>
            <p>Hoạt động CTXH</p>
          </div>
          <span className={`${styles.dashboard__badge} ${styles['dashboard__badge--positive']}`}>+12%</span>
        </div>

        <div className={styles.dashboard__statCard}>
          <div className={`${styles.dashboard__iconBox} ${styles['dashboard__iconBox--green']}`}>
            <Users size={22} color="#fff" />
          </div>
          <div className={styles.dashboard__statInfo}>
            <h2>1,245</h2>
            <p>Sinh viên tham gia</p>
          </div>
          <span className={`${styles.dashboard__badge} ${styles['dashboard__badge--positive']}`}>+8%</span>
        </div>

        <div className={styles.dashboard__statCard}>
          <div className={`${styles.dashboard__iconBox} ${styles['dashboard__iconBox--purple']}`}>
            <MessageSquare size={22} color="#fff" />
          </div>
          <div className={styles.dashboard__statInfo}>
            <h2>89</h2>
            <p>Phản hồi chờ xử lý</p>
          </div>
          <span className={`${styles.dashboard__badge} ${styles['dashboard__badge--negative']}`}>-2%</span>
        </div>
      </div>

      {/* === 4. Biểu đồ + Hoạt động gần đây === */}
      <div className={styles.dashboard__chartSection}>
        {/* Biểu đồ */}
        <div className={styles.dashboard__chartBox}>
          <div className={styles.dashboard__chartHeader}>
            <h3>Hoạt động CTXH theo tháng</h3>
            <div className={styles.dashboard__yearButtons}>
              {[2022, 2023].map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={year === y ? styles['dashboard__yearButton--active'] : styles.dashboard__yearButton}
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

        {/* Hoạt động gần đây */}
        <div className={styles.dashboard__recentBox}>
          <h3>Hoạt động gần đây</h3>
          <ul className={styles.dashboard__recentList}>
            {recentActivities.map((item, idx) => (
              <li key={idx} className={styles.dashboard__recentItem}>
                <div className={styles.dashboard__recentIcon}>{item.icon}</div>
                <div className={styles.dashboard__recentContent}>
                  <strong>{item.title}</strong>
                  <p className={`${styles.dashboard__recentDesc} ${styles['dashboard__truncate']}`}>{item.desc}</p>
                </div>
                <div className={styles.dashboard__recentTime}>{item.time}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* === 5. Hoạt động sắp diễn ra & Phản hồi chờ xử lý === */}
      <div className={styles.dashboard__twoColumn}>
        {/* Hoạt động sắp diễn ra */}
        <div className={styles.dashboard__card}>
          <div className={styles.dashboard__cardHeader}>
            <h3>Hoạt động sắp diễn ra</h3>
            <a href="/upcoming" className={styles.dashboard__viewMore}>
              Xem tất cả <ArrowRight size={14} />
            </a>
          </div>

          <div className={styles.dashboard__upcomingList}>
            {upcomingEvents.map((event, index) => (
              <div key={index} className={styles.dashboard__upcomingItem}>
                <h4 className={styles.dashboard__upcomingTitle}>{event.title}</h4>
                <p className={styles.dashboard__upcomingLocation}>{event.location}</p>
                <div className={styles.dashboard__upcomingFooter}>
                  <div className={styles.dashboard__upcomingDate}>
                    <Calendar size={14} />
                    <span>{event.date}</span>
                  </div>
                  <div className={styles.dashboard__upcomingParticipants}>
                    <Users size={14} />
                    <span>{event.participants} người</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phản hồi chờ xử lý */}
        <div className={styles.dashboard__card}>
          <div className={styles.dashboard__cardHeader}>
            <h3>Phản hồi chờ xử lý</h3>
            <a href="/pending" className={styles.dashboard__viewMore}>
              Xem tất cả <ArrowRight size={14} />
            </a>
          </div>

          <div className={styles.dashboard__feedbackList}>
            {pendingFeedback.map((feedback, index) => (
              <div key={index} className={styles.dashboard__feedbackItem}>
                <img
                  src={feedback.avatar || `https://i.pravatar.cc/40?img=${index + 5}`}
                  alt={feedback.name}
                  className={styles.dashboard__avatar}
                />
                <div className={styles.dashboard__feedbackContent}>
                  <strong className={styles.dashboard__feedbackName}>{feedback.name}</strong>
                  <p className={styles.dashboard__feedbackMessage}>{feedback.message}</p>
                </div>
                <span className={styles.dashboard__feedbackTime}>{feedback.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
