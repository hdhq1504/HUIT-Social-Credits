import React, { useState } from 'react';
import { ArrowLeft, Trash2, Edit3, CalendarDays, Users, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import layoutStyles from '../../styles/AdminPage.module.scss';
import styles from './A_Activity_Detail.module.scss';
import TabContent from './A_Activity_DetailData'; // ✅ Import nội dung tab đã tách riêng

const A_ActivityDetailPage = ({ onBackToList }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info'); // info | students | feedback

  const handleBack = () => {
    if (onBackToList) onBackToList();
    else navigate('/admin/activities');
  };

  return (
    <div className={layoutStyles.wrapper}>
      {/* ---------------- HEADER ---------------- */}
      <div className={layoutStyles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={18} />
            <h1 className={layoutStyles.title}>Chi tiết hoạt động</h1>
          </button>
        </div>

        <div className={styles.actionButtons}>
          <button className={styles.deleteButton}>
            <Trash2 size={16} />
            <span>Xóa hoạt động</span>
          </button>
          <button className={styles.editButton}>
            <Edit3 size={16} />
            <span>Chỉnh sửa</span>
          </button>
        </div>
      </div>

      {/* ---------------- THÔNG TIN CHUNG ---------------- */}
      <div className={styles.activityCard}>
        <div className={styles.imageBox}>
          <img src="" alt="Hoạt động tình nguyện" />
        </div>

        <div className={styles.infoBox}>
          <h2 className={styles.activityTitle}>Hoạt động tình nguyện tại viện dưỡng lão Thành phố</h2>

          <div className={styles.activityType}>
            <span className={styles.typeBadge}>Tình nguyện xã hội</span>
            <span className={styles.points}>🌟 60 điểm</span>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <strong>Người phụ trách:</strong>
              <p>TS. Nguyễn Văn An</p>
            </div>

            <div className={styles.infoItem}>
              <strong>Hạn đăng ký:</strong>
              <p>
                <CalendarDays size={14} /> 23:59, 10/12/2024
              </p>
            </div>

            <div className={styles.infoItem}>
              <strong>Thời gian:</strong>
              <p>
                <Clock size={14} /> 08:00 - 17:00, 15/12/2024
              </p>
            </div>

            <div className={styles.infoItem}>
              <strong>Số lượng tham gia:</strong>
              <p>
                <Users size={14} /> 45/50 sinh viên
              </p>
            </div>

            <div className={styles.infoItem}>
              <strong>Địa điểm:</strong>
              <p>
                <MapPin size={14} /> Viện dưỡng lão Thành phố HCM
              </p>
            </div>

            <div className={styles.infoItem}>
              <strong>Trạng thái:</strong>
              <p>
                <span className={styles.statusBadge}>🟡 Đang diễn ra</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- TABS MENU ---------------- */}
      <div className={styles.tabsMenu}>
        <button
          className={activeTab === 'info' ? styles.activeTab : styles.tabButton}
          onClick={() => setActiveTab('info')}
        >
          Thông tin chi tiết
        </button>
        <button
          className={activeTab === 'students' ? styles.activeTab : styles.tabButton}
          onClick={() => setActiveTab('students')}
        >
          Sinh viên tham gia
        </button>
        <button
          className={activeTab === 'feedback' ? styles.activeTab : styles.tabButton}
          onClick={() => setActiveTab('feedback')}
        >
          Nhật ký phản hồi
        </button>
      </div>

      {/* ---------------- NỘI DUNG TABS ---------------- */}
      <div className={styles.tabContentContainer}>
        <TabContent activeTab={activeTab} styles={styles} />
      </div>
    </div>
  );
};

export default A_ActivityDetailPage;
