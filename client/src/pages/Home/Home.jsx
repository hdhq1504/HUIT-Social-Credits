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
    <main className={cx('home')}>
      {/* Banner */}
      <header className={cx('home__hero')}>
        <div className={cx('home__hero-content')}>
          <h1 className={cx('home__hero-heading')}>
            TÌM KIẾM VÀ TRA CỨU ĐIỂM CÔNG TÁC XÃ HỘI
            <br />
            TẠI <span className={cx('home__hero-highlight')}>HUIT SOCIAL CREDITS</span>
          </h1>
          <p className={cx('home__hero-subtitle')}>
            Trang web chính thức của Trường Đại học Công thương TP. Hồ Chí Minh
          </p>
        </div>
        <div className={cx('home__hero-search')}>
          <SearchBar variant="home" onSubmit={(q) => console.log('Home search:', q)} />
        </div>
      </header>

      {/* Content */}
      <div className={cx('home__sections')}>
        <section className={cx('home__section')}>
          <FeaturedActivitySection />
        </section>
        
        <section className={cx('home__section', 'home__section--spacious')}>
          <ActivityCategoriesSection />
        </section>
        
        <section className={cx('home__section')}>
          <UpcomingActivitiesSection />
        </section>
        
        <section className={cx('home__section')}>
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
        </section>
        
        <section className={cx('home__section')}>
          <PersonalActivitiesSection />
        </section>
        
        <section className={cx('home__section')}>
          <ProofStatusSection />
        </section>
      </div>
    </main>
  );
}

export default Home;
