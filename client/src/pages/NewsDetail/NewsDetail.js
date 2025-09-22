import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './NewsDetail.module.scss';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const cx = classNames.bind(styles);

function NewsDetail() {
    const { id } = useParams();
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                setLoading(true);
                const newsRef = doc(db, 'news', id);
                const newsSnap = await getDoc(newsRef);

                if (!newsSnap.exists()) {
                    setError('Bài viết không tồn tại');
                    setLoading(false);
                    return;
                }

                const data = newsSnap.data();
                setNews({
                    title: data.title,
                    description: data.description,
                    content: data.content,
                    imageUrl: data.imageUrl,
                    date: data.date
                        ? new Date(data.date.seconds * 1000).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                          })
                        : 'Không xác định',
                    views: data.views,
                });
                setLoading(false);
            } catch (err) {
                setError('Không thể tải bài viết. Vui lòng thử lại sau.');
                setLoading(false);
                console.error('Error fetching news:', err);
            }
        };

        fetchNews();
    }, [id]);

    if (loading) {
        return <div>Đang tải bài viết...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    if (!news) {
        return <div>Bài viết không tồn tại.</div>;
    }

    return (
        <div className={cx('wrapper')}>
            <div className={cx('breadcrumb')}>
                <Link to="/">Trang chủ</Link> / <Link to="/blog">Tin tức</Link> / <span>{news.title}</span>
            </div>

            <div className={cx('content')}>
                <h1 className={cx('title')}>{news.title}</h1>
                <div className={cx('meta')}>
                    <span>🕒 {news.date}</span> • <span>📈 {news.views}</span>
                </div>
                <img
                    src={news.imageUrl}
                    alt={news.title}
                    className={cx('image')}
                    onError={(e) => {
                        e.target.src = '/images/no-image.jpg';
                    }}
                />
                <p className={cx('description')}>{news.description}</p>
                <div className={cx('full-content')}>{news.content}</div>
            </div>
        </div>
    );
}

export default NewsDetail;
