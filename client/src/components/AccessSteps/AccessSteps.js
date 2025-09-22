import React from 'react';
import classNames from 'classnames/bind';
import styles from './AccessSteps.module.scss';

const cx = classNames.bind(styles);

function AccessSteps() {
    const steps = [
        {
            id: 1,
            title: 'Đăng ký tài khoản',
            icon: '/images/Vector.svg',
        },
        {
            id: 2,
            title: 'Duyệt danh mục tài liệu',
            icon: '/images/Vector.svg',
        },
        {
            id: 3,
            title: 'Đọc hoặc tải về',
            icon: '/images/Contract.svg',
        },
        {
            id: 4,
            title: 'Lưu và quản lý tài liệu',
            icon: '/images/Success.svg',
        },
    ];

    return (
        <section className={cx('wrapper')}>
            <div className={cx('title')}>
                <p>Truy cập dễ dàng</p>
                <p className={cx('subtitle')}>(4 bước)</p>
            </div>

            <div className={cx('steps-container')}>
                {steps.map((step) => (
                    <button key={step.id} className={cx('step')}>
                        <im className={cx('step-number')}>{step.id}.</im>
                        <div className={cx('step-title')}>{step.title}</div>
                    </button>
                ))}
            </div>
        </section>
    );
}

export default AccessSteps;
