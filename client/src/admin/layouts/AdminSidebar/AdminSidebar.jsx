import React from 'react';
import classNames from 'classnames/bind';
import { Layout, Menu } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logo from '@/assets/images/apple-touch-icon.png';
import {
  faGaugeHigh,
  faClipboardCheck,
  faComments,
  faChartColumn,
  faMedal,
  faGear,
  faHeart,
  faCalendar,
} from '@fortawesome/free-solid-svg-icons';
import adminRoutes from '../../../routes/adminRoutes';
import styles from './AdminSidebar.module.scss';

const cx = classNames.bind(styles);
const { Sider } = Layout;

const iconByKey = {
  dashboard: faGaugeHigh,
  activities: faHeart,
  scoring: faCalendar,
  proof: faClipboardCheck,
  feedback: faComments,
  reports: faChartColumn,
  council: faMedal,
  system: faGear,
};

function AdminSidebar({ activePath, isOpen = true, onNavigate = () => {} }) {
  const routes = (adminRoutes ?? []).filter((r) => iconByKey[r.path]);

  const menuItems = routes.map((r) => ({
    key: r.fullPath,
    label: r.label,
    className: cx('sidebar__item', activePath === r.fullPath ? 'sidebar__item--active' : 'sidebar__item--neutral'),
    icon: <FontAwesomeIcon icon={iconByKey[r.path]} fixedWidth />,
  }));

  const selected = activePath ? [activePath] : routes.length ? [routes[0].fullPath] : [];

  return (
    <Sider width={250} collapsible collapsed={!isOpen} trigger={null} className={cx('sidebar__sider')}>
      <div className={cx('sidebar__logo')}>
        <img src={logo} alt="" aria-hidden="true" />
        {isOpen && <div className={cx('sidebar__brand')}>ADMIN</div>}
      </div>

      <Menu
        mode="inline"
        selectedKeys={selected}
        onClick={(e) => onNavigate?.(e.key)}
        items={menuItems}
        className={cx('sidebar__menu')}
      />
    </Sider>
  );
}

export default AdminSidebar;
