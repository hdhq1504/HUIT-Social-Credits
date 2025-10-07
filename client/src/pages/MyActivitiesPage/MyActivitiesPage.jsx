import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faCalendarCheck, faCircleCheck, faClock } from '@fortawesome/free-solid-svg-icons';
import { Badge, Calendar, Tabs } from 'antd';
import CardActivity from '@components/CardActivity/CardActivity';
import SearchBar from '@layouts/components/SearchBar/SearchBar';
import styles from './MyActivitiesPage.module.scss';
import { mockApi } from '@utils/mockAPI';

const cx = classNames.bind(styles);

const getListData = (value) => {
  let listData = [];
  switch (value.date()) {
    case 8:
      listData = [
        { type: 'warning', content: 'This is warning event.' },
        { type: 'success', content: 'This is usual event.' },
      ];
      break;
    case 10:
      listData = [
        { type: 'warning', content: 'This is warning event.' },
        { type: 'success', content: 'This is usual event.' },
        { type: 'error', content: 'This is error event.' },
      ];
      break;
    case 15:
      listData = [
        { type: 'warning', content: 'This is warning event' },
        { type: 'success', content: 'This is very long usual event......' },
        { type: 'error', content: 'This is error event 1.' },
        { type: 'error', content: 'This is error event 2.' },
        { type: 'error', content: 'This is error event 3.' },
        { type: 'error', content: 'This is error event 4.' },
      ];
      break;
    default:
  }
  return listData || [];
};

const getMonthData = (value) => {
  if (value.month() === 8) {
    return 1394;
  }
};

function MyActivitiesPage() {
  const monthCellRender = (value) => {
    const num = getMonthData(value);
    return num ? (
      <div className="notes-month">
        <section>{num}</section>
        <span>Backlog number</span>
      </div>
    ) : null;
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.map((item) => (
          <li key={item.content}>
            <Badge status={item.type} text={item.content} />
          </li>
        ))}
      </ul>
    );
  };

  const cellRender = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    if (info.type === 'month') return monthCellRender(current);
    return info.originNode;
  };

  const items = useMemo(
    () => [
      {
        key: '1',
        label: 'Đã đăng ký',
        children: '',
      },
      {
        key: '2',
        label: 'Đã tham gia',
        children: '',
      },
      {
        key: '3',
        label: 'Đã hủy',
        children: '',
      },
    ],
    [],
  );

  const [activities, setActivities] = useState([]);

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

  return (
    <section className={cx('my-activities')}>
      <div className={cx('my-activities__container')}>
        {/* Header */}
        <header className={cx('my-activities__header')}>
          <nav className={cx('my-activities__header-breadcrumb')} aria-label="Breadcrumb">
            <Link to="/">Trang chủ</Link> / <span>Hoạt động của tôi</span>
          </nav>

          <div className={cx('my-activities__header-heading')}>
            <span className={cx('my-activities__header-title')}>
              Hoạt động <span className={cx('my-activities__header-highlight')}>của tôi</span>
            </span>
            <div className={cx('my-activities__heading-divider')}></div>
          </div>
        </header>

        {/* Stats */}
        <div className={cx('my-activities__stats')}>
          <div className={`${cx('stat-card')} ${cx('stat-card--orange')}`}>
            <div className={cx('stat-card__row')}>
              <div className={cx('stat-card__info')}>
                <div className={cx('stat-card__label')}>Điểm CTXH</div>
                <div className={cx('stat-card__value')}>156</div>
              </div>
              <div className={cx('stat-card__icon')}>
                <FontAwesomeIcon icon={faTrophy} className={cx('stat-card__icon-mark')} />
              </div>
            </div>
          </div>

          <div className={`${cx('stat-card')} ${cx('stat-card--blue')}`}>
            <div className={cx('stat-card__row')}>
              <div className={cx('stat-card__info')}>
                <div className={cx('stat-card__label')}>Tổng hoạt động</div>
                <div className={cx('stat-card__value')}>24</div>
              </div>
              <div className={cx('stat-card__icon')}>
                <FontAwesomeIcon icon={faCalendarCheck} className={cx('stat-card__icon-mark')} />
              </div>
            </div>
          </div>

          <div className={`${cx('stat-card')} ${cx('stat-card--green')}`}>
            <div className={cx('stat-card__row')}>
              <div className={cx('stat-card__info')}>
                <div className={cx('stat-card__label')}>Đã hoàn thành</div>
                <div className={cx('stat-card__value')}>18</div>
              </div>
              <div className={cx('stat-card__icon')}>
                <FontAwesomeIcon icon={faCircleCheck} className={cx('stat-card__icon-mark')} />
              </div>
            </div>
          </div>

          <div className={`${cx('stat-card')} ${cx('stat-card--purple')}`}>
            <div className={cx('stat-card__row')}>
              <div className={cx('stat-card__info')}>
                <div className={cx('stat-card__label')}>Đang chờ</div>
                <div className={cx('stat-card__value')}>3</div>
              </div>
              <div className={cx('stat-card__icon')}>
                <FontAwesomeIcon icon={faClock} className={cx('stat-card__icon-mark')} />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className={cx('my-activities__calendar')}>
          <div className={cx('calendar__title')}>Lịch hoạt động sắp tới</div>
          <Calendar cellRender={cellRender} />
        </div>

        {/* Tabs */}
        <div className={cx('my-activities__tabs')}>
          <Tabs defaultActiveKey="1" items={items} type="line" size="large" />

          <div className={cx('my-activities__search')}>
            <SearchBar variant="list" onSubmit={(query) => console.log('List filter search:', query)} />
          </div>

          <div className={cx('my-activities__title')}>Danh sách hoạt động</div>

          <div className={cx('my-activities__list')}>
            {activities.map((activity) => (
              <CardActivity key={activity.id} {...activity} variant="vertical" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MyActivitiesPage;
