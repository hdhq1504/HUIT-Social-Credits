import React, { useMemo } from 'react';
import classNames from 'classnames/bind';
import { useQuery } from '@tanstack/react-query';
import Label from '@components/Label/Label';
import CardActivity from '@components/CardActivity/CardActivity';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import activitiesApi, { ACTIVITIES_QUERY_KEY } from '@api/activities.api';
import { isRegisterableActivity } from '@utils/activityState';
import styles from './FeaturedActivitySection.module.scss';
import useInvalidateActivities from '@/hooks/useInvalidateActivities';

const cx = classNames.bind(styles);

function FeaturedActivitySection() {
  const invalidateActivityQueries = useInvalidateActivities();

  const { data: activities = [], isFetching: isLoading } = useQuery({
    queryKey: ACTIVITIES_QUERY_KEY,
    queryFn: activitiesApi.list,
    staleTime: 30 * 1000, // Cache 30 giây
  });

  // Filter ra những activity được đánh dấu nổi bật + phù hợp trạng thái sử dụng
  const featuredActivities = useMemo(
    () => activities.filter((activity) => activity.isFeatured && isRegisterableActivity(activity)),
    [activities],
  );

  return (
    <>
      <Label
        title="Hoạt động"
        highlight="nổi bật"
        subtitle="Những hoạt động được Ban quản lý đặc biệt giới thiệu"
        leftDivider
        rightDivider
        showSubtitle
      />

      <div className={cx('featured-activities')}>
        <div className={cx('featured-activities__slider')}>
          <Swiper
            modules={[Autoplay, Navigation, A11y]}
            slidesPerView={1}
            slidesPerGroup={1}
            navigation
            loop
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}
            breakpoints={{
              640: { slidesPerView: 1.2, slidesPerGroup: 1, spaceBetween: 16 },
              768: { slidesPerView: 2, slidesPerGroup: 1, spaceBetween: 16 },
              1024: { slidesPerView: 3, slidesPerGroup: 1, spaceBetween: 20 },
              1280: { slidesPerView: 4, slidesPerGroup: 1, spaceBetween: 20 },
            }}
          >
            {/* Loading skeletons: dùng CardActivity loading để đồng bộ */}
            {isLoading &&
              Array.from({ length: 4 }).map((_, idx) => (
                <SwiperSlide key={`sk-${idx}`}>
                  <CardActivity loading variant="vertical" />
                </SwiperSlide>
              ))}

            {/* Loaded activities */}
            {!isLoading &&
              featuredActivities.map((a) => (
                <SwiperSlide key={a.id}>
                  <CardActivity
                    {...a}
                    state={a.state || 'guest'}
                    onRegister={(activity) => console.log('Open modal for:', activity)}
                    onRegistered={async ({ activity, note }) => {
                      try {
                        await activitiesApi.register(activity.id, note ? { note } : {});
                        await invalidateActivityQueries();
                      } catch (e) {
                        console.error('Register failed', e);
                        throw e;
                      }
                    }}
                    onCancelRegister={async ({ activity, reason, note }) => {
                      try {
                        await activitiesApi.cancel(activity.id, { reason, note });
                        await invalidateActivityQueries();
                      } catch (e) {
                        console.error('Cancel registration failed', e);
                        throw e;
                      }
                    }}
                    showConflictAlert={false}
                    variant="vertical"
                  />
                </SwiperSlide>
              ))}
          </Swiper>
        </div>

        {/* Empty state khi không có hoạt động nổi bật */}
        {!isLoading && featuredActivities.length === 0 && <div className={cx('empty')}>Chưa có hoạt động nổi bật.</div>}
      </div>
    </>
  );
}

export default FeaturedActivitySection;
