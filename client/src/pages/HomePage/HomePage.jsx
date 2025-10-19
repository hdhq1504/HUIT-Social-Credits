import React, { useMemo } from 'react';
import classNames from 'classnames/bind';
import SearchBar from '@layouts/SearchBar/SearchBar';
import FeaturedActivitySection from '@components/FeaturedActivitySection';
import ActivityCategoriesSection from '@components/ActivityCategoriesSection';
import UpcomingActivitiesSection from '@components/UpcomingActivitiesSection/UpcomingActivitiesSection';
import ProgressSection from '@components/ProgressSection';
import PersonalActivitiesSection from '@components/PersonalActivitiesSection/PersonalActivitiesSection';
import ProofStatusSection from '@components/ProofStatusSection/ProofStatusSection';
import { useQuery } from '@tanstack/react-query';
import statsApi, { PROGRESS_QUERY_KEY } from '@api/stats.api';
import useAuthStore from '@stores/useAuthStore';
import { DEFAULT_PROGRESS_SECTION, mapProgressSummaryToSection } from '@utils/progress';
import styles from './HomePage.module.scss';

const cx = classNames.bind(styles);

function HomePage() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const { data: progressSummary } = useQuery({
    queryKey: PROGRESS_QUERY_KEY,
    queryFn: statsApi.getProgress,
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000,
  });

  const progressSection = useMemo(
    () => (isLoggedIn ? mapProgressSummaryToSection(progressSummary) : DEFAULT_PROGRESS_SECTION),
    [isLoggedIn, progressSummary],
  );

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
            currentPoints={progressSection.currentPoints}
            targetPoints={progressSection.targetPoints}
            percent={progressSection.percent}
            missingPoints={progressSection.missingPoints}
            groups={progressSection.groups}
            onViewDetail={() => console.log('Xem chi tiết')}
            imageUrl={progressSection.imageUrl}
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

export default HomePage;
