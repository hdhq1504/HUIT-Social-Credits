import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin } from 'lucide-react';
import classNames from 'classnames/bind';
import styles from './Footer.module.scss';

const cx = classNames.bind(styles);

function Footer() {
  return (
    <footer className={cx('footer')}>
      <div className={cx('footer__container')}>
        <div className={cx('footer__content')}>
          <div className={cx('footer__column', 'footer__column--info')}>
            <h3 className={cx('footer__column-title')}>Thông tin</h3>
            <div className={cx('footer__column-content')}>
              <div className={cx('footer__brand')}>HUIT SOCIAL CREDITS</div>

              <div className={cx('footer__contact-item')}>
                <Phone color="#FF5C00" />
                <span>Điện thoại: (028) 3816 3320</span>
              </div>

              <div className={cx('footer__contact-item')}>
                <img src="/images/Gmail.svg" alt="" />
                <span>Email: dungnv@huit.edu.vn</span>
              </div>

              <div className={cx('footer__contact-item')}>
                <MapPin color="#FF5C00" />
                <span>Địa chỉ: 140 Lê Trọng Tấn, P. Tây Thạnh, TP.HCM</span>
              </div>
            </div>
          </div>

          <div className={cx('footer__column')}>
            <h3 className={cx('footer__column-title')}>Liên kết nhanh</h3>
            <div className={cx('footer__column-content', 'footer__links', 'footer__links--grid')}>
              <div>
                <Link to="/" className={cx('footer__link')}>
                  Trang chủ
                </Link>

                <Link to="/activities" className={cx('footer__link')}>
                  Hoạt động
                </Link>

                <Link to="/my-activities" className={cx('footer__link')}>
                  Hoạt động của tôi
                </Link>

                <Link to="/credits" className={cx('footer__link')}>
                  Điểm &amp; Chứng chỉ
                </Link>
              </div>
              <div>
                <Link to="/account" className={cx('footer__link')}>
                  Tài khoản
                </Link>

                <Link to="/feedback" className={cx('footer__link')}>
                  Phản hồi điểm
                </Link>
              </div>
            </div>
          </div>

          <div className={cx('footer__column')}>
            <h3 className={cx('footer__column-title')}>Về chúng tôi</h3>
            <div className={cx('footer__column-content', 'footer__links')}>
              <Link to="/contact-ctsv" className={cx('footer__link')}>
                Liên hệ CTSV
              </Link>

              <Link to="/quy-che-ctxh" className={cx('footer__link')}>
                Quy chế CTXH
              </Link>

              <Link to="/huong-dan-minh-chung" className={cx('footer__link')}>
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
