import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Tag } from 'antd';
import Button from '../Button/Button';
import CardActivity from '../CardActivity/CardActivity';
import Label from '../Label/Label';
import activitiesApi from '@api/activities.api';
import { isRegisterableActivity } from '@utils/activityState';
import { ROUTE_PATHS } from '@/config/routes.config';
import useInvalidateActivities from '@/hooks/useInvalidateActivities';
import styles from './UpcomingActivitiesSection.module.scss';

const { CheckableTag } = Tag;
const cx = classNames.bind(styles);

const GROUP_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'NHOM_1', label: 'Nhóm 1' },
  { key: 'NHOM_2', label: 'Nhóm 2' },
  { key: 'NHOM_3', label: 'Nhóm 3' },
];

function UpcomingActivitiesSection() {
  const [activities, setActivities] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const invalidateActivityQueries = useInvalidateActivities();

  const visibleActivities = useMemo(
    () => activities.filter((activity) => isRegisterableActivity(activity)),
    [activities],
  );

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
                        const updated = await activitiesApi.register(activity.id, note ? { note } : {});
                        setActivities((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                        await invalidateActivityQueries();
                      } catch (e) {
                        console.error('Register failed', e);
                        throw e;
                      }
                    }}
                    onCancelRegister={async ({ activity, reason, note }) => {
                      try {
                        const updated = await activitiesApi.cancel(activity.id, { reason, note });
                        setActivities((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
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
