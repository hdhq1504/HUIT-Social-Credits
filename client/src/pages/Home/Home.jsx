import React from 'react';
import classNames from 'classnames/bind';
import styles from './Home.module.scss';
import SearchBar from '@layouts/components/SearchBar';
import FeaturedActivitySection from '@components/FeaturedActivitySection';
import ActivityCategoriesSection from '@components/ActivityCategoriesSection';
import UpcomingActivitiesSection from '@components/UpcomingActivitiesSection/UpcomingActivitiesSection';
import ProgressSection from '@components/ProgressSection';
import PersonalActivitiesSection from '@components/PersonalActivitiesSection/PersonalActivitiesSection';
import ProofStatusSection from '@components/ProofStatusSection/ProofStatusSection';

const cx = classNames.bind(styles);

function Home() {
  return (
    <div className={cx('wrapper')}>
      {/* Banner */}
      <div className={cx('banner')}>
        <div className={cx('banner-content')}>
          <h1 className={cx('banner-title')}>
            TÌM KIẾM VÀ TRA CỨU ĐIỂM CÔNG TÁC XÃ HỘI
            <br />
            TẠI <span className={cx('highlight')}>HUIT SOCIAL CREDITS</span>
          </h1>
          <p className={cx('banner-subtitle')}>Trang web chính thức của Trường Đại học Công thương TP. Hồ Chí Minh</p>
        </div>
        <div className={cx('banner-search')}>
          <SearchBar variant="home" onSubmit={(q) => console.log('Home search:', q)} />
        </div>
      </div>

      {/* Content */}
      <div className={cx('content')}>
        <FeaturedActivitySection />
        <div style={{ marginBottom: '32px' }} />
        <ActivityCategoriesSection />
        <div style={{ marginBottom: '48px' }} />
        <UpcomingActivitiesSection />
        <div style={{ marginBottom: '32px' }} />
        <ProgressSection
          currentPoints={90}
          targetPoints={170}
          percent={77}
          missingPoints={80}
          groups={[
            { name: 'Nhóm 1', value: '50/50', note: 'Hoàn thành', status: 'success' },
            { name: 'Nhóm 2,3', value: '40/120', note: 'Còn 80 điểm', status: 'warning' },
          ]}
          onViewDetail={() => console.log('Xem chi tiết')}
          imageUrl="https://placehold.co/320x320"
        />
        <div style={{ marginBottom: '32px' }} />
        <PersonalActivitiesSection />
        <div style={{ marginBottom: '32px' }} />
        <ProofStatusSection />
      </div>
    </div>
  );
}

export default Home;
