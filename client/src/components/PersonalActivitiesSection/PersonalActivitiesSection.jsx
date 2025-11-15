import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faLocationDot, faCalendar, faSeedling, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { Empty, List, Skeleton } from 'antd';
import dayjs from 'dayjs';
import Button from '../Button/Button';
import Label from '../Label/Label';
import { useQuery } from '@tanstack/react-query';
import activitiesApi, { MY_ACTIVITIES_QUERY_KEY } from '@api/activities.api';
import useAuthStore from '@stores/useAuthStore';
import { formatDateTimeRange } from '@utils/datetime';
import styles from './PersonalActivitiesSection.module.scss';

const cx = classNames.bind(styles);

const STYLE_PRESETS = [
  { variant: 'orange', icon: faCalendar },
  { variant: 'yellow', icon: faSeedling },
  { variant: 'primary', icon: faGraduationCap },
];

function PersonalActivitiesSection() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const { data: registrations = [], isFetching } = useQuery({
    queryKey: MY_ACTIVITIES_QUERY_KEY,
    queryFn: () => activitiesApi.listMine(),
    enabled: isLoggedIn,
    staleTime: 30 * 1000,
  });

  const activities = useMemo(() => {
    if (!Array.isArray(registrations)) return [];

    const now = dayjs();

    return registrations
      .filter((registration) => {
        if (!registration?.activity?.startTime) return false;
        const start = dayjs(registration.activity.startTime);
        if (!start.isValid()) return false;
        if (registration.status === 'DA_HUY' || registration.status === 'VANG_MAT') return false;
        return start.isAfter(now);
      })
      .sort((a, b) => {
        const startA = dayjs(a.activity.startTime);
        const startB = dayjs(b.activity.startTime);
        return startA.valueOf() - startB.valueOf();
      })
      .slice(0, 3)
      .map((registration, index) => {
        const activity = registration.activity || {};
        const { variant, icon } = STYLE_PRESETS[index % STYLE_PRESETS.length];

        return {
          id: registration.id || activity.id || index,
          title: activity.title || 'Hoạt động chưa có tiêu đề',
          datetime: activity.dateTime || formatDateTimeRange(activity.startTime, activity.endTime),
          location: activity.location || 'Đang cập nhật địa điểm',
          variant,
          icon,
        };
      });
  }, [registrations]);

  const canShowViewAll = Array.isArray(activities) && activities.length > 3 && !isFetching;

  const emptyText = isLoggedIn ? 'Bạn chưa có hoạt động sắp tới' : 'Đăng nhập để xem hoạt động sắp tới của bạn';

  const getVariant = (variant) => variant || 'orange';

  return (
    <>
      <Label
        title="Hoạt động"
        highlight="sắp tới của bạn"
        subtitle="Bạn hãy thường xuyên kiểm tra để không bỏ lỡ nhé"
        leftDivider
        rightDivider
        showSubtitle
      />

      <div className={cx('personal-activities')}>
        {isLoggedIn && isFetching ? (
          <List
            itemLayout="horizontal"
            dataSource={[1, 2, 3]}
            renderItem={(key) => (
              <List.Item
                key={`sk-${key}`}
                className={cx('personal-activities__item', 'personal-activities__item--skeleton')}
              >
                <Skeleton
                  active
                  avatar={{ shape: 'square', size: 64 }}
                  title={false}
                  paragraph={{ rows: 2, width: ['80%', '60%'] }}
                />
              </List.Item>
            )}
          />
        ) : activities.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={activities}
            locale={{ emptyText }}
            renderItem={(activity, index) => (
              <List.Item
                key={activity.id || activity.title}
                className={cx('personal-activities__item', {
                  'personal-activities__item--bordered': index !== activities.length - 1,
                })}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      className={cx(
                        'personal-activities__icon',
                        `personal-activities__icon--${getVariant(activity.variant)}`,
                      )}
                    >
                      <FontAwesomeIcon
                        icon={activity.icon || faCalendar}
                        className={cx(
                          'personal-activities__icon-shape',
                          `personal-activities__icon-shape--${getVariant(activity.variant)}`,
                        )}
                      />
                    </div>
                  }
                  title={<div className={cx('personal-activities__title')}>{activity.title}</div>}
                  description={
                    <div className={cx('personal-activities__meta')}>
                      <div className={cx('personal-activities__meta-group')}>
                        <FontAwesomeIcon icon={faClock} className={cx('personal-activities__meta-icon')} />
                        <span className={cx('personal-activities__meta-text')}>{activity.datetime}</span>
                      </div>
                      <div className={cx('personal-activities__meta-group')}>
                        <FontAwesomeIcon icon={faLocationDot} className={cx('personal-activities__meta-icon')} />
                        <span className={cx('personal-activities__meta-text')}>{activity.location}</span>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div className={cx('personal-activities__empty')}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
          </div>
        )}
      </div>

      {canShowViewAll && (
        <div className={cx('personal-activities__actions')}>
          <Link to={'/my-activities'}>
            <Button variant="primary">Xem tất cả</Button>
          </Link>
        </div>
      )}
    </>
  );
}

export default PersonalActivitiesSection;
