import React from 'react';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faLocationDot, faCalendar, faSeedling, faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { List } from 'antd';
import Label from '../Label/Label';
import styles from './PersonalActivitiesSection.module.scss';
// import mockApi from '../../utils/mockAPI';

const cx = classNames.bind(styles);

const activities = [
  {
    title: 'Ngày hội hiến máu nhân đạo',
    datetime: '18/12/2024 - 8:30 AM',
    location: 'Hội trường C - HUIT',
    variant: 'orange',
    icon: faCalendar,
  },
  {
    title: 'Chiến dịch làm sạch bãi biển Vũng Tàu',
    datetime: '20/12/2024 - 6:00 AM',
    location: 'Bãi biển Thùy Vân',
    variant: 'yellow',
    icon: faSeedling,
  },
  {
    title: 'Dạy học cho trẻ em vùng cao Sapa',
    datetime: '25/12/2024 - 7:00 AM',
    location: 'Trường Tiểu học Sapa',
    variant: 'primary',
    icon: faGraduationCap,
  },
];

const ICON_MAP = {
  calendar: faCalendar,
  seedling: faSeedling,
  graduation: faGraduationCap,
};

function PersonalActivitiesSection() {
  const getIcon = (iconKey) => ICON_MAP[iconKey] || faCalendar;
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

      <List
        className={cx('personal-activities')}
        itemLayout="horizontal"
        dataSource={activities}
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
                    icon={getIcon(activity.icon)}
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
    </>
  );
}

export default PersonalActivitiesSection;
