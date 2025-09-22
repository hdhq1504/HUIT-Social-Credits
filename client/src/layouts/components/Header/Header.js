import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import classNames from 'classnames/bind';
import styles from './Header.module.scss';
import logo from '../../../assets/images/logo.svg';
import avatar from '../../../assets/images/student-photo.png';
import { logout } from '../../../redux/slices/authSlice'; // Sửa authSlide thành authSlice
import { auth } from '../../../firebase/config';
import { signOut } from 'firebase/auth';

const cx = classNames.bind(styles);

function Header() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isLoggedIn, user } = useSelector((state) => state.auth);

    const handleLogout = async (event) => {
        event.preventDefault();
        const confirmLogout = window.confirm('Bạn có chắc chắn muốn đăng xuất?');
        if (confirmLogout) {
            try {
                // Đăng xuất khỏi Firebase Authentication (nếu có)
                await signOut(auth).catch((error) => {
                    console.warn('Không có phiên Firebase Auth để đăng xuất:', error);
                });

                // Cập nhật Redux store và xóa localStorage
                dispatch(logout());
                localStorage.removeItem('accessToken');
                navigate('/login');
            } catch (error) {
                console.error('Lỗi đăng xuất:', error);
                // Đảm bảo vẫn đăng xuất khỏi Redux và localStorage ngay cả khi Firebase Auth lỗi
                dispatch(logout());
                localStorage.removeItem('accessToken');
                navigate('/login');
            }
        }
    };

    const renderLoggedOutMenu = () => (
        <div className={cx('menu-content')}>
            <div className={cx('menu-item')}>
                <Link to="/login">
                    <img src="/images/login-icon.svg" alt="" />
                    <span>Đăng nhập</span>
                </Link>
            </div>
            <div className={cx('menu-item')}>
                <Link to="/register">
                    <img src="/images/user-add-icon.svg" alt="" />
                    <span>Tạo tài khoản</span>
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
                <Link to="/infomation">
                    <img src="/images/user-add-icon.svg" alt="" />
                    <span>Thông tin</span>
                </Link>
            </div>
            <div className={cx('menu-item')}>
                <Link to="/list-favourite">
                    <img src="/images/heart-icon.svg" alt="" />
                    <span>Yêu thích</span>
                </Link>
            </div>
            <div className={cx('menu-item')}>
                <Link to="/logout" onClick={handleLogout}>
                    <img src="/images/logout-icon.svg" alt="" />
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
                        <img src={logo} alt="HUIT E-Learn" className={cx('logo-image')} />
                        <div className={cx('logo-text')}>
                            <span className={cx('logo-huit')}>HUIT</span>
                            <span className={cx('logo-elearn')}>Social Credits</span>
                        </div>
                    </Link>
                </div>

                <div className={cx('actions')}>
                    <NavLink to="/upload" className={({ isActive }) => cx('action-item', { active: isActive })}>
                        Hoạt động
                    </NavLink>
                    <NavLink to="/createtest" className={({ isActive }) => cx('action-item', { active: isActive })}>
                        Điểm danh
                    </NavLink>
                    <NavLink
                        to="/multiple-choice"
                        className={({ isActive }) => cx('action-item', { active: isActive })}
                    >
                        Phản hồi
                    </NavLink>
                    <div className={cx('notification')}>
                        <img className={cx('notification-icon')} src="/images/Bell.svg" alt="" />
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
                                <img className={cx('false')} src="/images/user-icon.svg" alt="" />
                            )}
                        </div>
                    </Tippy>
                </div>
            </div>
        </header>
    );
}

export default Header;
