import React from 'react';
import classNames from 'classnames/bind';
import styles from './MaterialsList.module.scss';
import { Link, useNavigate } from 'react-router-dom';
import MaterialCard from '../MaterialCard';

const cx = classNames.bind(styles);

function MaterialsList({ materials = [], loading = false, error = null, navigateTo, type = 'document' }) {
    const navigate = useNavigate(); // Sử dụng hook useNavigate để điều hướng

    // Hiển thị khi đang tải
    if (loading) {
        return (
            <div className={cx('wrapper')}>
                <p>Đang tải...</p>
            </div>
        );
    }

    // Hiển thị khi có lỗi
    if (error) {
        return (
            <div className={cx('wrapper')}>
                <p>{error}</p>
            </div>
        );
    }

    // Hàm xử lý khi nhấn "Xem tất cả"
    const handleViewAll = () => {
        navigate(navigateTo);
    };

    // Hiển thị danh sách
    return (
        <div className={cx('wrapper')}>
            <div className={cx('materials-grid')}>
                {materials.length > 0 ? (
                    materials.map((item) => (
                        <div key={item.id} className={cx('grid-item')}>
                            <MaterialCard data={item} type={type} />
                        </div>
                    ))
                ) : (
                    <p>Không có dữ liệu để hiển thị.</p>
                )}
            </div>

            <div className={cx('view-all')}>
                <button className={cx('view-all-btn')} onClick={handleViewAll}>
                    Xem tất cả
                    <img src="/images/Arrow_Right.svg" alt="Arrow Right" />
                </button>
            </div>
        </div>
    );
}

export default MaterialsList;
