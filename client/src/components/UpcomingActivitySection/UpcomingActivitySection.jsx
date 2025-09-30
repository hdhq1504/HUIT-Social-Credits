import React, { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Tag } from 'antd'; // 👈 dùng Tag của Ant Design
import Label from '../Label/Label';
import CardActivity from '../CardActivity/CardActivity';
import Button from '../Button/Button';
import { mockApi } from '../../utils/mockAPI';
import styles from './UpcomingActivitySection.module.scss';

const { CheckableTag } = Tag;
const cx = classNames.bind(styles);

const CATEGORIES = ['Tất cả', 'Địa chỉ đỏ', 'Mùa hè xanh', 'Xuân tình nguyện', 'Hiến máu', 'Hỗ trợ'];

function getCategoriesOf(activity) {
  if (typeof activity?.category === 'string') return [activity.category];
  if (Array.isArray(activity?.categories)) return activity.categories;
  if (Array.isArray(activity?.tags)) return activity.tags;
  return [];
}

function UpcomingActivitySection() {
  const [activities, setActivities] = useState([]);
  const [selected, setSelected] = useState('Tất cả');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await mockApi.getActivities();
        setActivities(res);
      } catch (err) {
        console.error('Lỗi load activities:', err);
      }
    };
    fetchActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    if (selected === 'Tất cả') return activities;
    return activities.filter((a) => {
      const cats = getCategoriesOf(a).map((x) => String(x).trim().toLowerCase());
      return cats.includes(selected.trim().toLowerCase());
    });
  }, [activities, selected]);

  return (
    <>
      <Label title="Hoạt động" highlight="sắp diễn ra" subtitle="Danh sách các hoạt động sắp diễn ra" />

      <div className={cx('tag-filters')}>
        {CATEGORIES.map((cat) => (
          <CheckableTag
            key={cat}
            checked={selected === cat}
            onChange={() => setSelected(cat)}
            className={cx('tag', { active: selected === cat })}
          >
            {cat}
          </CheckableTag>
        ))}
      </div>

      <div className={cx('list')}>
        {filteredActivities.map((a, idx) => (
          <CardActivity
            key={idx}
            {...a}
            onDetails={() => console.log('Chi tiết:', a?.title)}
            onRegister={() => console.log('Đăng ký:', a?.title)}
          />
        ))}
      </div>

      <div className={cx('actions')}>
        <Button variant="primary" onClick={() => setSelected('Tất cả')}>
          <span>Xem tất cả</span>
          <FontAwesomeIcon icon={faArrowRight} />
        </Button>
      </div>
    </>
  );
}

export default UpcomingActivitySection;
