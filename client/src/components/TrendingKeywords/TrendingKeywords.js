import React from 'react';
import classNames from 'classnames/bind';
import styles from './TrendingKeywords.module.scss';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

function TrendingKeywords() {
    const keywords = [
        { id: 'python', title: 'Sách lập trình Python' },
        { id: 'stats', title: 'Giáo trình Phân tích thống kê hệ thống' },
        { id: 'ml', title: 'Ebook học Machine Learning' },
        { id: 'sql', title: 'Tài liệu hướng dẫn SQL Server' },
        { id: 'algo', title: 'Quản lý động tính' },
        { id: 'ai', title: 'Luận văn về Trí tuệ Nhân tạo' },
        { id: 'se', title: 'Tài liệu Công nghệ phần mềm' },
    ];

    return (
        <section className={cx('wrapper')}>
            <h2 className={cx('title')}>
                <span className={cx('highlight')}>Từ khóa </span> tìm kiếm nổi bật hôm nay
            </h2>

            <div className={cx('keywords-container')}>
                {keywords.map((keyword) => (
                    <Link
                        key={keyword.id}
                        to={`/search?keyword=${encodeURIComponent(keyword.title)}`}
                        className={cx('keyword-item')}
                    >
                        <img className={cx('keyword-icon')} src="/images/Search.svg" alt="" /> {keyword.title}
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default TrendingKeywords;
