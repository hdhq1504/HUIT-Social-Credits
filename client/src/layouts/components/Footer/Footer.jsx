import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './Footer.module.scss';

const cx = classNames.bind(styles);

function Footer() {
  return (
    <footer className={cx('wrapper')}>
      <div className={cx('container')}>
        <div className={cx('footer-content')}>
          <div className={cx('footer-column', 'footer-info')}>
            <h3 className={cx('column-title')}>Thông tin</h3>
            <div className={cx('column-content')}>
              <div className={cx('footer-brand')}>HUIT SOCIAL CREDITS</div>

              <div className={cx('contact-item')}>
                <Phone color="#FF5C00" />
                <span>Điện thoại: (028) 3816 3320</span>
              </div>

              <div className={cx('contact-item')}>
                <img src="/images/Gmail.svg" alt="" />
                <span>Email: dungnv@huit.edu.vn</span>
              </div>

              <div className={cx('contact-item')}>
                <MapPin color="#FF5C00" />
                <span>Địa chỉ: 140 Lê Trọng Tấn, P. Tây Thạnh, TP.HCM</span>
              </div>
            </div>
          </div>

          <div className={cx('footer-column')}>
            <h3 className={cx('column-title')}>Liên kết nhanh</h3>
            <div className={cx('column-content', 'column-links', 'column-lienket')}>
              <div>
                <Link to="/" className={cx('footer-link')}>
                  Trang chủ
                </Link>

                <Link to="/activities" className={cx('footer-link')}>
                  Hoạt động
                </Link>

                <Link to="/my-activities" className={cx('footer-link')}>
                  Hoạt động của tôi
                </Link>

                <Link to="/credits" className={cx('footer-link')}>
                  Điểm &amp; Chứng chỉ
                </Link>
              </div>
              <div>
                <Link to="/account" className={cx('footer-link')}>
                  Tài khoản
                </Link>

                <Link to="/feedback" className={cx('footer-link')}>
                  Phản hồi điểm
                </Link>
              </div>
            </div>
          </div>

          <div className={cx('footer-column')}>
            <h3 className={cx('column-title')}>Về chúng tôi</h3>
            <div className={cx('column-content', 'column-links')}>
              <Link to="/contact-ctsv" className={cx('footer-link')}>
                Liên hệ CTSV
              </Link>

              <Link to="/quy-che-ctxh" className={cx('footer-link')}>
                Quy chế CTXH
              </Link>

              <Link to="/huong-dan-minh-chung" className={cx('footer-link')}>
                Hướng dẫn minh chứng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
