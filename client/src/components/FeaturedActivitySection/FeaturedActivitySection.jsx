import React, { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames/bind';
import Label from '@components/Label/Label';
import CardActivity from '@components/CardActivity/CardActivity';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import activitiesApi from '@api/activities.api';
import { isUnregisteredOrParticipated } from '@utils/activityState';
import styles from './FeaturedActivitySection.module.scss';

const cx = classNames.bind(styles);

function FeaturedActivitySection() {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const res = await activitiesApi.list();
        setActivities(res);
      } catch (err) {
        console.error('Lỗi load activities:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const featuredActivities = useMemo(
    () => activities.filter((activity) => activity.isFeatured && isUnregisteredOrParticipated(activity)),
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
            {/* Loading: dùng chính CardActivity loading để đồng bộ với ListActivitiesPage */}
            {isLoading &&
              Array.from({ length: 4 }).map((_, idx) => (
                <SwiperSlide key={`sk-${idx}`}>
                  <CardActivity loading variant="vertical" />
                </SwiperSlide>
              ))}

            {/* Loaded */}
            {!isLoading &&
              featuredActivities.map((a) => (
                <SwiperSlide key={a.id}>
                  <CardActivity
                    {...a}
                    state={a.state || 'guest'}
                    onRegister={(activity) => console.log('Open modal for:', activity)}
                    onRegistered={async ({ activity, note }) => {
                      try {
                        const updated = await activitiesApi.register(activity.id, note ? { note } : {});
                        setActivities((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                      } catch (e) {
                        console.error('Register failed', e);
                        throw e;
                      }
                    }}
                    onCancelRegister={async ({ activity, reason, note }) => {
                      try {
                        const updated = await activitiesApi.cancel(activity.id, { reason, note });
                        setActivities((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
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
