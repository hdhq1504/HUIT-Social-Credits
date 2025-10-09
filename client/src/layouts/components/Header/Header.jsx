import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect, useCallback } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import classNames from 'classnames/bind';
import logo from '../../../assets/images/logo.svg';
import avatar from '../../../assets/images/profile.png';
import { Bell, BadgeCheck, BookAlert, ClipboardList, Lock, LogOut, User } from 'lucide-react';
import { logout } from '../../../redux/slices/authSlice';
import Notification from '../../../components/Notification/Notification';
import styles from './Header.module.scss';
import { mockApi } from '@utils/mockAPI';

const cx = classNames.bind(styles);

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoggedIn, user } = useSelector((state) => state.auth);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    const items = await mockApi.getNotifications();
    const count = items.filter((n) => n.isUnread).length;
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth <= 640);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  const handleLogout = async (event) => {
    event.preventDefault();
    const confirmLogout = window.confirm('Bạn có chắc chắn muốn đăng xuất?');
    if (confirmLogout) {
      dispatch(logout());
      localStorage.removeItem('accessToken');
      navigate('/login');
    }
  };

  const renderLoggedOutMenu = () => (
    <div className={cx('header__menu')}>
      {isMobile && (
        <>
          <div className={cx('header__menu-item')}>
            <Link to="/list-activities">
              <span>Hoạt động</span>
            </Link>
          </div>
          <div className={cx('header__menu-item')}>
            <Link to="/my-activities">
              <span>Hoạt động của tôi</span>
            </Link>
          </div>
          <div className={cx('header__menu-item')}>
            <Link to="/roll-call">
              <span>Điểm danh</span>
            </Link>
          </div>
          <div className={cx('header__menu-item')}>
            <Link to="/feedback">
              <span>Phản hồi</span>
            </Link>
          </div>
          <div className={cx('menu-divider')} />
        </>
      )}
      <div className={cx('header__menu-item')}>
        <Link to="/login">
          <LogOut size={16} />
          <span>Đăng nhập</span>
        </Link>
      </div>
      <div className={cx('header__menu-item')}>
        <Link to="/forgot-password">
          <Lock size={16} />
          <span>Quên mật khẩu</span>
        </Link>
      </div>
    </div>
  );

  const renderLoggedInMenu = () => (
    <div className={cx('header__menu')}>
      <div className={cx('header__menu-header')}>
        Xin chào <span>{user?.TenNguoiDung || user?.email || 'Người dùng'}</span>
      </div>
      <div className={cx('header__menu-item')}>
        <Link to="/profile">
          <User size={16} />
          <span>Thông tin</span>
        </Link>
      </div>
      <div className={cx('header__menu-item')}>
        <Link to="/my-activities">
          <ClipboardList size={16} />
          <span>Hoạt động của tôi</span>
        </Link>
      </div>
      <div className={cx('header__menu-item')}>
        <Link to="/">
          <BadgeCheck size={16} />
          <span>Kết quả</span>
        </Link>
      </div>
      <div className={cx('header__menu-item')}>
        <Link to="/feedback">
          <BookAlert size={16} />
          <span>Phản hồi điểm</span>
        </Link>
      </div>
      {isMobile && (
        <>
          <div className={cx('header__menu-divider')} />
          <div className={cx('header__menu-item')}>
            <Link to="/list-activities">
              <span>Hoạt động</span>
            </Link>
          </div>
          <div className={cx('header__menu-item')}>
            <Link to="/my-activities">
              <span>Hoạt động của tôi</span>
            </Link>
          </div>
          <div className={cx('header__menu-item')}>
            <Link to="/roll-call">
              <span>Điểm danh</span>
            </Link>
          </div>
          <div className={cx('header__menu-item')}>
            <Link to="/feedback">
              <span>Phản hồi</span>
            </Link>
          </div>
        </>
      )}
      <div className={cx('header__menu-item')}>
        <Link to="/logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </Link>
      </div>
    </div>
  );

  return (
    <header className={cx('header')}>
      <div className={cx('header__inner')}>
        <div className={cx('header__logo')}>
          <Link to="/" className={cx('header__logo-link')}>
            <img src={logo} alt="HUIT Social Credits" className={cx('header__logo-image')} />
            <div className={cx('header__logo-text')}>
              <span className={cx('header__logo-huit')}>HUIT</span>
              <span className={cx('header__logo-sc')}>Social Credits</span>
            </div>
          </Link>
        </div>

        <div className={cx('header__actions')}>
          <NavLink
            to="/list-activities"
            className={({ isActive }) => cx('header__action-link', { 'header__action-link--active': isActive })}
          >
            Hoạt động
          </NavLink>

          <NavLink
            to="/my-activities"
            className={({ isActive }) => cx('header__action-link', { 'header__action-link--active': isActive })}
          >
            Hoạt động của tôi
          </NavLink>

          <NavLink
            to="/roll-call"
            className={({ isActive }) => cx('header__action-link', { 'header__action-link--active': isActive })}
          >
            Điểm danh
          </NavLink>

          <NavLink
            to="/feedback"
            className={({ isActive }) => cx('header__action-link', { 'header__action-link--active': isActive })}
          >
            Phản hồi
          </NavLink>

          <Tippy
            delay={[0, 200]}
            interactive
            placement="bottom-end"
            trigger="click"
            hideOnClick
            onShow={refreshUnread}
            onClickOutside={(instance) => instance.hide()}
            content={<Notification onMarkAllRead={() => setUnreadCount(0)} />}
          >
            <button type="button" className={cx('header__notification')} aria-label="Thông báo">
              <Bell className={cx('header__notification-icon')} />
              {unreadCount > 0 && <span className={cx('header__notification-count')}>{unreadCount}</span>}
            </button>
          </Tippy>

          <Tippy
            delay={[0, 200]}
            interactive={true}
            placement="bottom-end"
            content={isLoggedIn ? renderLoggedInMenu() : renderLoggedOutMenu()}
            trigger="click"
            hideOnClick={true}
            onClickOutside={(instance) => instance.hide()}
          >
            <div className={cx('header__avatar')}>
              {isLoggedIn ? (
                <img className={cx('header__avatar-image')} src={user?.AnhDaiDien || avatar} alt="Avatar" />
              ) : (
                <User className={cx('header__avatar-placeholder')} />
              )}
            </div>
          </Tippy>
        </div>
      </div>
    </header>
  );
}

export default Header;
