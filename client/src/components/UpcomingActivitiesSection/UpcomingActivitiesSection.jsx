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
import { isUnregisteredOrParticipated } from '@utils/activityState';
import styles from './UpcomingActivitiesSection.module.scss';

const { CheckableTag } = Tag;
const cx = classNames.bind(styles);

const CATEGORIES = ['Tất cả', 'Địa chỉ đỏ', 'Mùa hè xanh', 'Xuân tình nguyện', 'Hiến máu', 'Hỗ trợ'];

function getCategoriesOf(activity) {
  if (typeof activity?.category === 'string') return [activity.category];
  if (Array.isArray(activity?.categories)) return activity.categories;
  if (Array.isArray(activity?.tags)) return activity.tags;
  return [];
}

function UpcomingActivitiesSection() {
  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState('Tất cả');

  const visibleActivities = useMemo(
    () => activities.filter((activity) => isUnregisteredOrParticipated(activity)),
    [activities],
  );

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await activitiesApi.list();
        setActivities(res);
      } catch (err) {
        console.error('Lỗi load activities:', err);
      }
    };
    fetchActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    if (selected === 'Tất cả') return visibleActivities;
    return visibleActivities.filter((a) => {
      const cats = getCategoriesOf(a).map((x) => String(x).trim().toLowerCase());
      return cats.includes(selected.trim().toLowerCase());
    });
  }, [visibleActivities, selected]);

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
          {CATEGORIES.map((cat) => (
            <CheckableTag
              key={cat}
              checked={selected === cat}
              onChange={() => setSelected(cat)}
              className={cx('upcoming-activities__tag', {
                'upcoming-activities__tag--active': selected === cat,
              })}
            >
              {cat}
            </CheckableTag>
          ))}
        </div>

        <div className={cx('upcoming-activities__list')}>
          {filteredActivities.map(
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
                  state={a.state || 'guest'}
                  buttonLabels={{ register: 'Đăng ký ngay' }}
                />
              ),
          )}
        </div>

        <div className={cx('upcoming-activities__actions')}>
          <Link to="/list-activities">
            <Button variant="primary" onClick={() => setSelected('Tất cả')}>
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
