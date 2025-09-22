import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './NotFound.module.scss';

const cx = classNames.bind(styles);

const NotFound = () => {
    return (
        <div className={cx('not-found-container')}>
            {/* Breadcrumb */}
            <div className={cx('breadcrumb')}>
                <Link to="/">Trang chủ</Link> / <span>Trang không tìm thấy</span>
            </div>

            {/* Nội dung 404 */}
            <div className={cx('content')}>
                <img src="/images/404.svg" alt="404 Not Found" className={cx('image-404')} />

                <Link to="/" className={cx('home-button')}>
                    Trang chủ
                    <img src="/images/Arrow_Right.svg" alt="Arrow Right" />
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
