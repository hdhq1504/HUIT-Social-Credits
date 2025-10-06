import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import logo from '../../../assets/images/logo.svg';
import avatar from '../../../assets/images/profile.png';
import { Bell, BadgeCheck, BookAlert, ClipboardList, Lock, LogOut, User } from 'lucide-react';
import { logout } from '../../../redux/slices/authSlice';

const cx = classNames.bind(styles);

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoggedIn, user } = useSelector((state) => state.auth);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
    <div className={cx('menu-content')}>
      {isMobile && (
        <>
          <div className={cx('menu-item')}>
            <Link to="/list-activities">
              <span>Hoạt động</span>
            </Link>
          </div>
          <div className={cx('menu-item')}>
            <Link to="/">
              <span>Hoạt động của tôi</span>
            </Link>
          </div>
          <div className={cx('menu-item')}>
            <Link to="/">
              <span>Điểm danh</span>
            </Link>
          </div>
          <div className={cx('menu-item')}>
            <Link to="/">
              <span>Phản hồi</span>
            </Link>
          </div>
          <div className={cx('menu-divider')} />
        </>
      )}
      <div className={cx('menu-item')}>
        <Link to="/login">
          <LogOut size={16} />
          <span>Đăng nhập</span>
        </Link>
      </div>
      <div className={cx('menu-item')}>
        <Link to="/forgot-password">
          <Lock size={16} />
          <span>Quên mật khẩu</span>
        </Link>
      </div>
    </div>
  );

  const renderLoggedInMenu = () => (
    <div className={cx('menu-content')}>
      <div className={cx('menu-header')}>
        Xin chào <span>{user?.TenNguoiDung || user?.email || 'Người dùng'}</span>
      </div>
      <div className={cx('menu-item')}>
        <Link to="/profile">
          <User size={16} />
          <span>Thông tin</span>
        </Link>
      </div>
      <div className={cx('menu-item')}>
        <Link to="/">
          <ClipboardList size={16} />
          <span>Hoạt động của tôi</span>
        </Link>
      </div>
      <div className={cx('menu-item')}>
        <Link to="/">
          <BadgeCheck size={16} />
          <span>Kết quả</span>
        </Link>
      </div>
      <div className={cx('menu-item')}>
        <Link to="/">
          <BookAlert size={16} />
          <span>Phản hồi điểm</span>
        </Link>
      </div>
      {isMobile && (
        <>
          <div className={cx('menu-divider')} />
          <div className={cx('menu-item')}>
            <Link to="/list-activities">
              <span>Hoạt động</span>
            </Link>
          </div>
          <div className={cx('menu-item')}>
            <Link to="/">
              <span>Hoạt động của tôi</span>
            </Link>
          </div>
          <div className={cx('menu-item')}>
            <Link to="/">
              <span>Điểm danh</span>
            </Link>
          </div>
          <div className={cx('menu-item')}>
            <Link to="/">
              <span>Phản hồi</span>
            </Link>
          </div>
        </>
      )}
      <div className={cx('menu-item')}>
        <Link to="/logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </Link>
      </div>
    </div>
  );

  return (
    <header className={cx('wrapper')}>
      <div className={cx('inner')}>
        <div className={cx('logo')}>
          <Link to="/" className={cx('logo-link')}>
            <img src={logo} alt="HUIT Social Credits" className={cx('logo-image')} />
            <div className={cx('logo-text')}>
              <span className={cx('logo-huit')}>HUIT</span>
              <span className={cx('logo-sc')}>Social Credits</span>
            </div>
          </Link>
        </div>

        <div className={cx('actions')}>
          <NavLink to="/list-activities" className={({ isActive }) => cx('action-item', { active: isActive })}>
            Hoạt động
          </NavLink>

          <NavLink to="/history" className={({ isActive }) => cx('action-item', { active: isActive })}>
            Hoạt động của tôi
          </NavLink>

          <NavLink to="/attendance" className={({ isActive }) => cx('action-item', { active: isActive })}>
            Điểm danh
          </NavLink>

          <NavLink to="/feedback" className={({ isActive }) => cx('action-item', { active: isActive })}>
            Phản hồi
          </NavLink>

          <div className={cx('notification')}>
            <Bell className={cx('notification-icon')} />
            <span className={cx('notification-count')}>2</span>
          </div>

          <Tippy
            delay={[0, 200]}
            interactive={true}
            placement="bottom-end"
            content={isLoggedIn ? renderLoggedInMenu() : renderLoggedOutMenu()}
            trigger="click"
            hideOnClick={true}
            onClickOutside={(instance) => instance.hide()}
          >
            <div className={cx('user-avatar')}>
              {isLoggedIn ? (
                <img className={cx('true')} src={user?.AnhDaiDien || avatar} alt="Avatar" />
              ) : (
                <User className={cx('false')} />
              )}
            </div>
          </Tippy>
        </div>
      </div>
    </header>
  );
}

export default Header;
