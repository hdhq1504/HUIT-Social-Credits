import React, { useState } from 'react';
import { ArrowLeft, Trash2, Edit3, CalendarDays, Users, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import layoutStyles from '../../styles/AdminPage.module.scss';
import styles from './A_Activity_Detail.module.scss';
import TabContent from './A_Activity_DetailData';

const A_ActivityDetailPage = ({ onBackToList }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info'); // info | students | feedback

  const handleBack = () => {
    if (onBackToList) onBackToList();
    else navigate('/admin/activities');
  };

  return (
    <div className={layoutStyles.wrapper}>
      {/* ===== HEADER ===== */}
      <header className={styles['activity-detail__header']}>
        <div className={styles['activity-detail__header-left']}>
          <button className={styles['activity-detail__back-btn']} onClick={handleBack}>
            <ArrowLeft size={18} />
            <h1 className={layoutStyles.title}>Chi tiết hoạt động</h1>
          </button>
        </div>

        <div className={styles['activity-detail__actions']}>
          <button className={`${styles['activity-detail__btn']} ${styles['activity-detail__btn--delete']}`}>
            <Trash2 size={16} />
            <span>Xóa hoạt động</span>
          </button>

          <button className={`${styles['activity-detail__btn']} ${styles['activity-detail__btn--edit']}`}>
            <Edit3 size={16} />
            <span>Chỉnh sửa</span>
          </button>
        </div>
      </header>

      {/* ===== CARD (THÔNG TIN CHUNG) ===== */}
      <section className={styles['activity-detail__card']}>
        <div className={styles['activity-detail__image-box']}>
          <img src="" alt="Hoạt động tình nguyện" />
        </div>

        <div className={styles['activity-detail__info']}>
          <h2 className={styles['activity-detail__title']}>Hoạt động tình nguyện tại viện dưỡng lão Thành phố</h2>

          <div className={styles['activity-detail__meta']}>
            <span className={styles['activity-detail__badge']}>Tình nguyện xã hội</span>
            <span className={styles['activity-detail__points']}>🌟 60 điểm</span>
          </div>

          <div className={styles['activity-detail__info-grid']}>
            <div className={styles['activity-detail__info-item']}>
              <strong>Người phụ trách:</strong>
              <p>TS. Nguyễn Văn An</p>
            </div>

            <div className={styles['activity-detail__info-item']}>
              <strong>Hạn đăng ký:</strong>
              <p>
                <CalendarDays size={14} /> 23:59, 10/12/2024
              </p>
            </div>

            <div className={styles['activity-detail__info-item']}>
              <strong>Thời gian:</strong>
              <p>
                <Clock size={14} /> 08:00 - 17:00, 15/12/2024
              </p>
            </div>

            <div className={styles['activity-detail__info-item']}>
              <strong>Số lượng tham gia:</strong>
              <p>
                <Users size={14} /> 45/50 sinh viên
              </p>
            </div>

            <div className={styles['activity-detail__info-item']}>
              <strong>Địa điểm:</strong>
              <p>
                <MapPin size={14} /> Viện dưỡng lão Thành phố HCM
              </p>
            </div>

            <div className={styles['activity-detail__info-item']}>
              <strong>Trạng thái:</strong>
              <p>
                <span className={styles['activity-detail__status-badge']}>🟡 Đang diễn ra</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TABS ===== */}
      <nav className={styles['activity-detail__tabs']}>
        {[
          { id: 'info', label: 'Thông tin chi tiết' },
          { id: 'students', label: 'Sinh viên tham gia' },
          { id: 'feedback', label: 'Nhật ký phản hồi' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? `${styles['activity-detail__tab']} ${styles['activity-detail__tab--active']}`
                : styles['activity-detail__tab']
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ===== TAB CONTENT ===== */}
      <div className={styles['activity-detail__tab-content']}>
        <TabContent activeTab={activeTab} styles={styles} />
      </div>
    </div>
  );
};

export default A_ActivityDetailPage;
