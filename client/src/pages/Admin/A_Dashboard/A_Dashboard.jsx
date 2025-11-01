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
          <span className={layoutStyles.plusIcon}>+</span> Thêm hoạt động mới
        </button>
      </div>

      {/* === 2. Bộ lọc === */}
      <div className={styles.filterBar}>
        <input type="text" placeholder="Tìm kiếm hoạt động..." className={styles.searchInput} />
        <select className={styles.select}>
          <option>Chọn học kỳ</option>
          <option>Học kỳ 1</option>
          <option>Học kỳ 2</option>
        </select>
        <select className={styles.select}>
          <option>Chọn năm học</option>
          <option>2024 - 2025</option>
          <option>2025 - 2026</option>
        </select>
        <select className={styles.select}>
          <option>Tất cả khoa</option>
          <option>CNTT</option>
          <option>Kinh tế</option>
        </select>
        <button className={styles.filterButton}>🔍 Lọc</button>
      </div>

      {/* === 3. Thống kê nhanh === */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={`${styles.iconBox} ${styles.blue}`}>
            <CalendarDays size={22} color="#fff" />
          </div>
          <div className={styles.statInfo}>
            <h2>156</h2>
            <p>Hoạt động CTXH</p>
          </div>
          <span className={`${styles.badge} ${styles.badgePositive}`}>+12%</span>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.iconBox} ${styles.green}`}>
            <Users size={22} color="#fff" />
          </div>
          <div className={styles.statInfo}>
            <h2>1,245</h2>
            <p>Sinh viên tham gia</p>
          </div>
          <span className={`${styles.badge} ${styles.badgePositive}`}>+8%</span>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.iconBox} ${styles.purple}`}>
            <MessageSquare size={22} color="#fff" />
          </div>
          <div className={styles.statInfo}>
            <h2>89</h2>
            <p>Phản hồi chờ xử lý</p>
          </div>
          <span className={`${styles.badge} ${styles.badgeNegative}`}>-2%</span>
        </div>
      </div>

      {/* === 4. Biểu đồ + Hoạt động gần đây === */}
      <div className={styles.chartSection}>
        {/* Biểu đồ */}
        <div className={styles.chartBox}>
          <div className={styles.chartHeader}>
            <h3>Hoạt động CTXH theo tháng</h3>
            <div className={styles.yearButtons}>
              <button onClick={() => setYear(2022)} className={year === 2022 ? styles.yearActive : ''}>
                2022
              </button>
              <button onClick={() => setYear(2023)} className={year === 2023 ? styles.yearActive : ''}>
                2023
              </button>
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
        <div className={styles.recentBox}>
          <h3>Hoạt động gần đây</h3>
          <ul className={styles.recentList}>
            {recentActivities.map((item, idx) => (
              <li key={idx} className={styles.recentItem}>
                <div className={styles.icon}>{item.icon}</div>
                <div className={styles.recentContent}>
                  <strong>{item.title}</strong>
                  <p className={`${styles.recentDesc} ${styles.truncate}`}>{item.desc}</p>
                </div>
                <div className={styles.time}>{item.time}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* === 5. Hoạt động sắp diễn ra & Phản hồi chờ xử lý === */}
      <div className={styles.twoColumnSection}>
        {/* Hoạt động sắp diễn ra */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Hoạt động sắp diễn ra</h3>
            <a href="/upcoming" className={styles.viewMoreLink}>
              Xem tất cả <ArrowRight size={14} />
            </a>
          </div>

          <div className={styles.upcomingList}>
            {upcomingEvents.map((event, index) => (
              <div key={index} className={styles.upcomingItem}>
                <h4 className={styles.upcomingTitle}>{event.title}</h4>
                <p className={styles.upcomingLocation}>{event.location}</p>

                <div className={styles.upcomingFooter}>
                  <div className={styles.upcomingDate}>
                    <Calendar size={14} />
                    <span>{event.date}</span>
                  </div>
                  <div className={styles.upcomingParticipants}>
                    <Users size={14} />
                    <span>{event.participants} người</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phản hồi chờ xử lý */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Phản hồi chờ xử lý</h3>
            <a href="/pending" className={styles.viewMoreLink}>
              Xem tất cả <ArrowRight size={14} />
            </a>
          </div>

          <div className={styles.feedbackList}>
            {pendingFeedback.map((feedback, index) => (
              <div key={index} className={styles.feedbackItem}>
                <img
                  src={feedback.avatar || 'https://i.pravatar.cc/40?img=' + (index + 5)}
                  alt={feedback.name}
                  className={styles.avatar}
                />
                <div className={styles.feedbackContent}>
                  <strong className={styles.feedbackName}>{feedback.name}</strong>
                  <p className={styles.feedbackMessage}>{feedback.message}</p>
                </div>
                <span className={styles.feedbackTime}>{feedback.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
