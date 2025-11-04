import { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Bell, BadgeCheck, BookAlert, ClipboardList, Lock, LogOut, User } from 'lucide-react';
import classNames from 'classnames/bind';
import logo from '@assets/images/logo.svg';
import avatar from '@assets/images/profile.png';
import Notification from '@components/Notification/Notification';
import styles from './Header.module.scss';
import notificationsApi, { NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY } from '@api/notifications.api';
import useAuthStore from '@stores/useAuthStore';

const cx = classNames.bind(styles);

function Header() {
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isMobile, setIsMobile] = useState(false);
  const { data: unreadData, refetch: refetchUnread } = useQuery({
    queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: isLoggedIn,
    initialData: { count: 0 },
    staleTime: 20_000,
  });

  const unreadCount = isLoggedIn ? (unreadData?.count ?? 0) : 0;

  const refreshUnread = useCallback(() => {
    if (!isLoggedIn) return;
    refetchUnread();
  }, [isLoggedIn, refetchUnread]);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth <= 640);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    },
    onSuccess: () => {
      logout();
      navigate('/login');
    },
  });

  const handleLogout = async (event) => {
    event.preventDefault();
    const confirmLogout = window.confirm('Bạn có chắc chắn muốn đăng xuất?');
    if (confirmLogout && !logoutMutation.isPending) {
      logoutMutation.mutate();
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
        Xin chào <span>{user?.TenNguoiDung}</span>
      </div>

      {/* Chỉ hiển thị menu sinh viên nếu không phải admin */}
      {user?.role !== 'ADMIN' && (
        <>
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
            <Link to="/my-points">
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
        </>
      )}

      {isMobile && user?.role !== 'ADMIN' && (
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
          <span>{logoutMutation.isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}</span>
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
          {(!isLoggedIn || user?.role !== 'ADMIN') && (
            <>
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
            </>
          )}

          <Tippy
            delay={[0, 200]}
            interactive
            placement="bottom-end"
            trigger="click"
            hideOnClick
            onShow={refreshUnread}
            onClickOutside={(instance) => instance.hide()}
            content={<Notification onMarkAllRead={() => refetchUnread()} />}
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
