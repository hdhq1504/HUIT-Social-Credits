import React from 'react';
import classNames from 'classnames/bind';
import styles from './TrendingNews.module.scss';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

function TrendingNews() {
    // Mock data
    const news = Array(5)
        .fill()
        .map((_, index) => ({
            id: `news-${index}`,
            image:
                index === 0
                    ? '/images/taileiuhoctap.svg'
                    : index === 1
                    ? '/images/fadsfasdfasdf.png'
                    : index === 2
                    ? '/images/z6498201990858_6eec7524616d419184c9abc1d93c39b4.jpg'
                    : index === 3
                    ? '/images/dieu-binh-nguyen-hue-20-45005-58517.jpg'
                    : '/images/z6498194347666_0b91518bfafacee74d9bb2bd0d2a27d8.jpg',
            date: '12/03/2024',
            views: 1892 + index * 35,
            title:
                index === 0
                    ? 'Tài liệu học tập được sinh viên tìm kiếm nhiều nhất fdasfsdfsd'
                    : index === 1
                    ? 'Mẹo quản lý và sắp xếp tài liệu hiệu quả'
                    : index === 2
                    ? 'Chiêm ngưỡng màn trình diễn của dàn máy bay tiêm kích chuẩn bị cho lễ kỷ niệm 30-4'
                    : index === 3
                    ? 'Hàng nghìn người lần đầu tiên tổng hợp luyện diễu binh 30/4 tại sân bay Biên Hòa'
                    : 'Lịch diễn tập bắn pháo trên bến Bạch Đằng chào mừng lễ 30 4? Số phát đại bác trong nghi thức chính thức?',
        }));

    return (
        <div className={cx('wrapper')}>
            <div className={cx('news-container')}>
                {news.map((item) => (
                    <div key={item.id} className={cx('news-item')}>
                        <div className={cx('news-image')}>
                            <img src={item.image} alt={item.title} />
                        </div>
                        <div className={cx('news-meta')}>
                            <div className={cx('meta-item')}>
                                <img src="/images/Clock.svg" alt="" /> {item.date}
                            </div>
                            <div className={cx('meta-item')}>
                                <img src="/images/Eye.svg" alt="" /> {item.views}
                            </div>
                        </div>
                        <Link to={`/news/${item.id}`} className={cx('news-title')}>
                            <span>{item.title}</span>
                        </Link>
                    </div>
                ))}
            </div>

            <div className={cx('view-all')}>
                <Link to="/blog" className={cx('view-all-btn')}>
                    Xem tất cả <img src="/images/Arrow_Right.svg" alt=" " />
                </Link>
            </div>
        </div>
    );
}

export default TrendingNews;
