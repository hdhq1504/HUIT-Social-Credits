import React, { useState } from 'react';
import { ArrowLeft, Trash2, Edit3, CalendarDays, Users, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ActivityDetailPage.module.scss';
import TabContent from './ActivityDetailPageData';

const cx = classNames.bind(styles);

const ActivityDetailPage = ({ onBackToList }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info'); // info | students | feedback

  const handleBack = () => {
    if (onBackToList) onBackToList();
    else navigate('/activities');
  };

  const tabs = [
    { id: 'info', label: 'Thông tin chi tiết' },
    { id: 'students', label: 'Sinh viên tham gia' },
    { id: 'feedback', label: 'Nhật ký phản hồi' },
  ];

  return (
    <div className={cx('activity-detail')}>
      {/* ===== HEADER ===== */}
      <header className={cx('activity-detail__header')}>
        <button className={cx('activity-detail__back-btn')} onClick={handleBack}>
          <ArrowLeft size={18} />
          <span>Chi tiết hoạt động</span>
        </button>

        <div className={cx('activity-detail__actions')}>
          <button className={cx('activity-detail__btn', 'activity-detail__btn--delete')}>
            <Trash2 size={16} />
            <span>Xóa</span>
          </button>

          <button className={cx('activity-detail__btn', 'activity-detail__btn--edit')}>
            <Edit3 size={16} />
            <span>Chỉnh sửa</span>
          </button>
        </div>
      </header>

      {/* ===== CARD (THÔNG TIN CHUNG) ===== */}
      <section className={cx('activity-detail__card')}>
        <div className={cx('activity-detail__image')}>
          <img src="https://via.placeholder.com/220" alt="Hoạt động tình nguyện" />
        </div>

        <div className={cx('activity-detail__info')}>
          <h2 className={cx('activity-detail__title')}>Hoạt động tình nguyện tại viện dưỡng lão Thành phố</h2>

          <div className={cx('activity-detail__meta')}>
            <span className={cx('activity-detail__badge')}>Tình nguyện xã hội</span>
            <span className={cx('activity-detail__points')}>🌟 60 điểm</span>
          </div>

          <div className={cx('activity-detail__grid')}>
            <div className={cx('activity-detail__item')}>
              <strong>Người phụ trách:</strong>
              <p>TS. Nguyễn Văn An</p>
            </div>

            <div className={cx('activity-detail__item')}>
              <strong>Hạn đăng ký:</strong>
              <p>
                <CalendarDays size={14} /> 23:59, 10/12/2024
              </p>
            </div>

            <div className={cx('activity-detail__item')}>
              <strong>Thời gian:</strong>
              <p>
                <Clock size={14} /> 08:00 - 17:00, 15/12/2024
              </p>
            </div>

            <div className={cx('activity-detail__item')}>
              <strong>Số lượng:</strong>
              <p>
                <Users size={14} /> 45/50 sinh viên
              </p>
            </div>

            <div className={cx('activity-detail__item')}>
              <strong>Địa điểm:</strong>
              <p>
                <MapPin size={14} /> Viện dưỡng lão TP. HCM
              </p>
            </div>

            <div className={cx('activity-detail__item')}>
              <strong>Trạng thái:</strong>
              <p>
                <span className={cx('activity-detail__status')}>🟡 Đang diễn ra</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TABS ===== */}
      <nav className={cx('activity-detail__tabs')}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cx('activity-detail__tab', {
              'activity-detail__tab--active': activeTab === tab.id,
            })}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ===== TAB CONTENT ===== */}
      <div className={cx('activity-detail__content')}>
        <TabContent activeTab={activeTab} styles={styles} />
      </div>
    </div>
  );
};

export default ActivityDetailPage;
