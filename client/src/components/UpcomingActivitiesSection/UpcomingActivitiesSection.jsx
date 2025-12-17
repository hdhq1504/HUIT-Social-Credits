import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Tag } from 'antd';
import Button from '../Button/Button';
import CardActivity from '../CardActivity/CardActivity';
import Label from '../Label/Label';
import activitiesApi, { ACTIVITIES_QUERY_KEY } from '@api/activities.api';
import { isRegisterableActivity } from '@utils/activityState';
import { ROUTE_PATHS } from '@/config/routes.config';
import useInvalidateActivities from '@/hooks/useInvalidateActivities';
import styles from './UpcomingActivitiesSection.module.scss';

const { CheckableTag } = Tag;
const cx = classNames.bind(styles);

/** Các bộ lọc nhóm hoạt động */
const GROUP_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'NHOM_1', label: 'Nhóm 1' },
  { key: 'NHOM_2', label: 'Nhóm 2' },
  { key: 'NHOM_3', label: 'Nhóm 3' },
];

/**
 * Section hiển thị danh sách hoạt động sắp diễn ra.
 * Hỗ trợ lọc theo nhóm hoạt động (Nhóm 1, 2, 3).
 *
 * @returns {React.ReactElement} Component UpcomingActivitiesSection.
 */
function UpcomingActivitiesSection() {
  const [selectedGroup, setSelectedGroup] = useState('all');
  const invalidateActivityQueries = useInvalidateActivities();

  // Sử dụng React Query với shared key để tự động dedupe với FeaturedActivitySection
  const { data: activities = [], isFetching: isLoading } = useQuery({
    queryKey: ACTIVITIES_QUERY_KEY,
    queryFn: activitiesApi.list,
    staleTime: 30 * 1000, // Cache 30 giây
  });

  const visibleActivities = useMemo(
    () => activities.filter((activity) => isRegisterableActivity(activity)),
    [activities],
  );

  const filteredActivities = useMemo(() => {
    if (selectedGroup === 'all') return visibleActivities;
    return visibleActivities.filter((activity) => (activity.pointGroup || '').toUpperCase() === selectedGroup);
  }, [visibleActivities, selectedGroup]);

  return (
    <>
      <Label
        title="Hoạt động"
        highlight="sắp diễn ra"
        subtitle="Danh sách các hoạt động sắp diễn ra"
        leftDivider
        rightDivider
        showSubtitle
      />

      <div className={cx('upcoming-activities')}>
        <div className={cx('upcoming-activities__filters')}>
          {GROUP_FILTERS.map((filter) => (
            <CheckableTag
              key={filter.key}
              checked={selectedGroup === filter.key}
              onChange={() => setSelectedGroup(filter.key)}
              className={cx('upcoming-activities__tag', {
                'upcoming-activities__tag--active': selectedGroup === filter.key,
              })}
            >
              {filter.label}
            </CheckableTag>
          ))}
        </div>

        <div className={cx('upcoming-activities__list')}>
          {isLoading &&
            Array.from({ length: 4 }).map((_, idx) => <CardActivity key={`sk-${idx}`} loading variant="vertical" />)}

          {!isLoading &&
            filteredActivities.map(
              (a) =>
                !a.isFeatured && (
                  <CardActivity
                    key={a.id}
                    {...a}
                    variant="vertical"
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
                    state={a.state || 'guest'}
                    buttonLabels={{ register: 'Đăng ký ngay' }}
                  />
                ),
            )}

          {!isLoading && filteredActivities.length === 0 && (
            <div className={cx('upcoming-activities__empty')}>Chưa có hoạt động phù hợp.</div>
          )}
        </div>

        <div className={cx('upcoming-activities__actions')}>
          <Link to={ROUTE_PATHS.USER.ACTIVITIES}>
            <Button variant="primary" onClick={() => setSelectedGroup('all')}>
              <span>Xem tất cả</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}

export default UpcomingActivitiesSection;
