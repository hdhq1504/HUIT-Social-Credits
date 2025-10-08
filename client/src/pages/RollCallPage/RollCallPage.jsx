import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateRight } from '@fortawesome/free-solid-svg-icons';
import { Button, Input, Select, Tabs } from 'antd';
import CardActivity from '@components/CardActivity/CardActivity';
import Label from '@components/Label/Label';
import styles from './RollCallPage.module.scss';
import { mockApi } from '@utils/mockAPI';

const cx = classNames.bind(styles);

function RollCallPage() {
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

  const tabItems = useMemo(
    () => [
      {
        key: '1',
        label: (
          <div className={cx('my-activities__tab-label')}>
            <span>Đang diễn ra</span>
          </div>
        ),
        children: (
          <div className={cx('my-activities__list')}>
            {activities.map((activity) => (
              <CardActivity key={activity.id} {...activity} variant="vertical" state="confirm_in" />
            ))}
          </div>
        ),
      },
      {
        key: '2',
        label: (
          <div className={cx('my-activities__tab-label')}>
            <span>Sắp diễn ra</span>
          </div>
        ),
        children: (
          <div className={cx('my-activities__list')}>
            {activities.map((activity) => (
              <CardActivity key={activity.id} {...activity} variant="vertical" state="attendance_closed" />
            ))}
          </div>
        ),
      },
      {
        key: '3',
        label: (
          <div className={cx('my-activities__tab-label')}>
            <span>Đã kết thúc</span>
          </div>
        ),
        children: (
          <div className={cx('my-activities__list')}>
            {activities.map((activity) => (
              <CardActivity key={activity.id} {...activity} variant="vertical" state="details_only" />
            ))}
          </div>
        ),
      },
    ],
    [activities],
  );

  return (
    <section className={cx('my-activities')}>
      <div className={cx('my-activities__container')}>
        {/* Header */}
        <header className={cx('my-activities__header')}>
          <nav className={cx('my-activities__header-breadcrumb')} aria-label="Breadcrumb">
            <Link to="/">Trang chủ</Link> / <span>Điểm danh</span>
          </nav>

          <Label title="Điểm danh" highlight="hoạt động" leftDivider={false} rightDivider showSubtitle={false} />
        </header>

        {/* Tabs */}
        <div className={cx('my-activities__tabs')}>
          <Tabs
            defaultActiveKey="1"
            items={tabItems}
            type="line"
            size="large"
            tabBarGutter={12}
            renderTabBar={(props, DefaultTabBar) => (
              <>
                <DefaultTabBar {...props} />

                {/* Thanh tìm kiếm */}
                <div className={cx('my-activities__search')}>
                  <Input
                    placeholder="Nhập từ khóa"
                    size="large"
                    className={cx('my-activities__search-input')}
                    allowClear
                  />

                  <Select defaultValue="all" size="large" className={cx('my-activities__search-select')}>
                    <Select.Option value="all">Nhóm hoạt động</Select.Option>
                    <Select.Option value="mua-he-xanh">Mùa hè xanh</Select.Option>
                    <Select.Option value="hien-mau">Hiến máu</Select.Option>
                    <Select.Option value="dia-chi-do">Địa chỉ đỏ</Select.Option>
                  </Select>

                  <Select defaultValue="all" size="large" className={cx('my-activities__search-select')}>
                    <Select.Option value="all">Mới nhất</Select.Option>
                    <Select.Option value="oldest">Cũ nhất</Select.Option>
                    <Select.Option value="popular">Phổ biến nhất</Select.Option>
                  </Select>

                  <Button
                    type="primary"
                    size="large"
                    className={cx('my-activities__reset-button')}
                    icon={<FontAwesomeIcon icon={faArrowRotateRight} />}
                  >
                    Đặt lại
                  </Button>
                </div>

                {/* Tiêu đề danh sách */}
                <div className={cx('my-activities__title')}>Danh sách hoạt động</div>
              </>
            )}
          />
        </div>
      </div>
    </section>
  );
}

export default RollCallPage;
