import React from 'react';
import classNames from 'classnames/bind';
import { Layout, Menu } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logo from '@/assets/images/apple-touch-icon.png';
import {
  faGaugeHigh,
  faUsers,
  faChartColumn,
  faMedal,
  faGear,
  faHeart,
  faCalendar,
  faUserGear,
  faChalkboardUser,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import styles from './TeacherSidebar.module.scss';

const cx = classNames.bind(styles);
const { Sider } = Layout;

const iconByKey = {
  dashboard: faGaugeHigh,
  activities: faHeart,
  scoring: faCalendar,
  feedback: faUsers,
  reports: faChartColumn,
  council: faMedal,
  users: faUserGear,
  system: faGear,
  classes: faChalkboardUser,
};

function TeacherSidebar({ items = [], activePath, isOpen = true, onNavigate = () => {}, onLogout = () => {} }) {
  const menuItems = items
    .filter((item) => iconByKey[item.iconKey] || item.icon)
    .map((item) => ({
      key: item.path,
      label: item.label,
      className: cx('sidebar__item', activePath === item.path ? 'sidebar__item--active' : 'sidebar__item--neutral'),
      icon: <FontAwesomeIcon icon={item.icon || iconByKey[item.iconKey]} fixedWidth />,
    }));

  const selected = activePath ? [activePath] : items.length ? [items[0].path] : [];

  return (
    <Sider width={250} collapsible collapsed={!isOpen} trigger={null} className={cx('sidebar__sider')}>
      <div className={cx('sidebar__logo')}>
        <img src={logo} alt="" aria-hidden="true" />
        {isOpen && <div className={cx('sidebar__brand')}>TEACHER</div>}
      </div>

      <div className={cx('sidebar__content')}>
        <Menu
          mode="inline"
          selectedKeys={selected}
          onClick={(e) => onNavigate?.(e.key)}
          items={menuItems}
          className={cx('sidebar__menu')}
        />
      </div>

      <div className={cx('sidebar__footer')}>
        <button className={cx('sidebar__logout-btn')} onClick={onLogout}>
          <FontAwesomeIcon icon={faRightFromBracket} fixedWidth />
          {isOpen && <span>Đăng xuất</span>}
        </button>
      </div>
    </Sider>
  );
}

export default TeacherSidebar;
