import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Blog.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

// Dữ liệu tĩnh
const newsData = [
    {
        id: '1',
        category: 'Chia sẻ kiến thức',
        title: 'Lịch diễn tập bắn pháo trên bến Bạch Đằng chào mừng lễ 30/4',
        description:
            'Dưới đây là lịch diễn tập bắn pháo chào mừng lễ 30/4 trên bến Bạch Đằng: Trong suốt tháng 4, các buổi diễn tập bắn pháo trên Bến Bạch Đằng, Quận 1, Thành Phố ...',
        imageUrl: '/images/z6498194347666_0b91518bfafacee74d9bb2bd0d2a27d8.jpg',
        date: '12/04/2025',
        views: 13923,
        content:
            'Tài liệu đã được cập nhật với nội dung mới nhất, bổ sung thông tin quan trọng trong các lĩnh vực chuyên ngành và chính sách giáo dục. Phiên bản mới bao gồm các tài liệu về công nghệ, phương pháp học tập tiên tiến, và các bài viết chuyên sâu về lĩnh vực học thuật.',
    },

    {
        id: '2',
        category: 'Chia sẻ kiến thức',
        title: 'Tài liệu học tập  cho sinh viên mới kiến thức nền',
        description: 'Tài liệu học tập dành cho sinh viên mới kiến thức nền tảng về các môn học cơ bản.',
        imageUrl: '/images/taileiuhoctap.svg',
        date: '12/04/2025',
        views: 235,
        content:
            'Tài liệu học tập dành cho sinh viên mới kiến thức nền tảng về các môn học cơ bản. Nội dung bao gồm các bài giảng cơ bản về toán học, lập trình, và các kỹ năng mềm cần thiết cho sinh viên mới.',
    },
    {
        id: '3',
        category: 'Thông tin & Hỏi đáp',
        title: 'Tiêm kích bay tập luyện ở khu vực Dinh Độc Lập ',
        description: 'Chiêm ngưỡng màn trình diễn của dàn máy bay tiêm kích chuẩn bị cho lễ kỷ niệm 30-4',
        imageUrl: '/images/z6498201990858_6eec7524616d419184c9abc1d93c39b4.jpg',
        date: '12/04/2025',
        views: 90,
        content:
            "Việc phát triển tư duy logic giúp bạn giải quyết vấn đề tốt hơn. Một số sách hay nên đọc gồm 'Tư duy nhanh và chậm' (Daniel Kahneman), 'Lập trình viên thực dụng', 'Sức mạnh của tư duy phản biện'. Những cuốn sách này không chỉ giúp bạn cải thiện khả năng tư duy mà còn hỗ trợ trong việc học tập và làm việc hiệu quả hơn.",
    },
    {
        id: '4',
        category: 'Kinh nghiệm học tập',
        title: 'LLVT tham gia tổng hợp luyện gồm 13 khối đứng...',
        description: 'Hàng nghìn người lần đầu tiên tổng hợp luyện diễu binh 30/4 tại sân bay Biên Hòa.',
        imageUrl: '/images/dieu-binh-nguyen-hue-20-45005-58517.jpg',
        date: '12/04/2025',
        views: 13923,
        content:
            'Ban muốn tự học IELTS nhưng chưa biết bắt đầu từ đâu? Bài viết này hướng dẫn lộ trình học tập chi tiết, cách luyện Listening, Reading, Writing, Speaking, cùng những tài liệu và ứng dụng hỗ trợ tốt nhất. Lộ trình này được thiết kế để bạn đạt IELTS 6.0 trong 6 tháng.',
    },
    {
        id: '5',
        category: 'Chia sẻ kiến thức',
        title: 'Mẹo quản lý và sắp xếp tài liệu hiệu quả',
        description:
            'Mẹo quản lý và sắp xếp tài liệu hiệu quả giúp bạn tiết kiệm thời gian và nâng cao hiệu suất học tập.',
        imageUrl: '/images/meoquanlyvasapxep.svg',
        date: '12/04/2025',
        views: 123,
        content:
            'Mẹo quản lý và sắp xếp tài liệu hiệu quả giúp bạn tiết kiệm thời gian và nâng cao hiệu suất học tập. Bài viết cung cấp các phương pháp như sử dụng công cụ quản lý tài liệu, phân loại theo danh mục, và cách lưu trữ thông minh.',
    },
    {
        id: '6',
        category: 'Kinh nghiệm học tập',
        title: '5 phương pháp ghi nhớ lâu dành cho sinh viên',
        description: '5 phương pháp ghi nhớ lâu dành cho sinh viên giúp cải thiện hiệu quả học tập.',
        imageUrl: '/images/cacchudehot.svg',
        date: '12/04/2025',
        views: 6427,
        content:
            '5 phương pháp ghi nhớ lâu dành cho học sinh và sinh viên giúp cải thiện hiệu quả học tập. Các phương pháp bao gồm sử dụng sơ đồ tư duy, ôn tập định kỳ, và áp dụng kỹ thuật ghi nhớ hình ảnh.',
    },
    {
        id: '7',
        category: 'Kinh nghiệm học tập',
        title: 'Làm thế nào để lập trình hiệu quả',
        description: 'Làm thế nào để lập trình hiệu quả? Bài viết chia sẻ các mẹo và kỹ năng cần thiết.',
        imageUrl: '/images/cdasfksdfs.svg',
        date: '12/04/2025',
        views: 6427,
        content:
            'Làm thế nào để lập trình hiệu quả? Bài viết chia sẻ các mẹo và kỹ năng cần thiết, bao gồm cách tổ chức mã nguồn, sử dụng công cụ debug, và các phương pháp tư duy lập trình hiệu quả.',
    },
    {
        id: '8',
        category: 'Kinh nghiệm học tập',
        title: 'Cách quản lý lý thời gian hiệu quả cho sinh viên',
        description: 'Cách quản lý lý thời gian hiệu quả cho sinh viên giúp cân bằng giữa học tập và cuộc sống.',
        imageUrl: '/images/cachhieuquathoigian.svg',
        date: '12/04/2025',
        views: 90,
        content:
            'Cách quản lý lý thời gian hiệu quả cho sinh viên giúp cân bằng giữa học tập và cuộc sống. Bài viết hướng dẫn cách lập kế hoạch học tập, ưu tiên công việc, và sử dụng công cụ quản lý thời gian.',
    },
    {
        id: '9',
        category: 'Kinh nghiệm học tập',
        title: 'Kỹ năng mềm - Yếu tố quyết định thành công trong sự nghiệp',
        description: 'Cách quản lý lý thời gian hiệu quả cho sinh viên giúp cân bằng giữa học tập và cuộc sống.',
        imageUrl: '/images/kynanglamyeuto.svg',
        date: '12/04/2025',
        views: 90,
        content:
            'Cách quản lý lý thời gian hiệu quả cho sinh viên giúp cân bằng giữa học tập và cuộc sống. Bài viết hướng dẫn cách lập kế hoạch học tập, ưu tiên công việc, và sử dụng công cụ quản lý thời gian.',
    },
    {
        id: '10',
        category: 'Kinh nghiệm học tập',
        title: 'Xu hướng nghề nghiệp năm 2025: Những kỹ năng cần trang bị',
        description: 'Cách quản lý lý thời gian hiệu quả cho sinh viên giúp cân bằng giữa học tập và cuộc sống.',
        imageUrl: '/images/nhungkynangcantrangbi.svg',
        date: '12/04/2025',
        views: 90,
        content:
            'Cách quản lý lý thời gian hiệu quả cho sinh viên giúp cân bằng giữa học tập và cuộc sống. Bài viết hướng dẫn cách lập kế hoạch học tập, ưu tiên công việc, và sử dụng công cụ quản lý thời gian.',
    },
    {
        id: '11',
        category: 'Kinh nghiệm học tập',
        title: 'Cách chọn ngành nghề phù hợp với tính cách và sở thích',
        description: 'Cách quản lý lý thời gian hiệu quả cho sinh viên giúp cân bằng giữa học tập và cuộc sống.',
        imageUrl: '/images/chonnghephuhop.svg',
        date: '12/04/2025',
        views: 90,
        content:
            'Cách quản lý lý thời gian hiệu quả cho sinh viên giúp cân bằng giữa học tập và cuộc sống. Bài viết hướng dẫn cách lập kế hoạch học tập, ưu tiên công việc, và sử dụng công cụ quản lý thời gian.',
    },
    {
        id: '12',
        category: 'Kinh nghiệm học tập',
        title: 'Các công phụ hỗ trợ viết luận và nghiên cứu khoa học',
        description: 'Cách quản lý lý thời gian hiệu quả cho sinh viên giúp cân bằng giữa học tập và cuộc sống.',
        imageUrl: '/images/caccongcuhotro.svg',
        date: '12/04/2025',
        views: 90,
        content:
            'Cách quản lý lý thời gian hiệu quả cho sinh viên giúp cân bằng giữa học tập và cuộc sống. Bài viết hướng dẫn cách lập kế hoạch học tập, ưu tiên công việc, và sử dụng công cụ quản lý thời gian.',
    },
    {
        id: '13',
        category: 'Chia sẻ kiến thức',
        title: 'Cách quản lý thời gian hiệu quả cho sinh viên',
        description: 'Cách quản lý lý thời gian hiệu quả cho sinh viên giúp cân bằng giữa học tập và cuộc sống.',
        imageUrl: '/images/cachquanlythoigian.svg',
        date: '12/04/2025',
        views: 90,
        content:
            'Cách quản lý lý thời gian hiệu quả cho sinh viên giúp cân bằng giữa học tập và cuộc sống. Bài viết hướng dẫn cách lập kế hoạch học tập, ưu tiên công việc, và sử dụng công cụ quản lý thời gian.',
    },
];

function Blog() {
    const knowledgeSharingNews = newsData.filter((news) => news.category === 'Chia sẻ kiến thức');
    const studyExperienceNews = newsData.filter((news) => news.category === 'Kinh nghiệm học tập');
    const categories = [
        'Chia sẻ kiến thức',
        'Kinh nghiệm học tập',
        'Thông tin & Hỏi đáp',
        'Hướng nghiệp & Kỹ năng',
        'Công cụ học tập',
    ];
    const [selectedCategory, setSelectedCategory] = useState('Chia sẻ kiến thức');

    return (
        <div className={cx('wrapper')}>
            <div className={cx('link')}>
                <Link to="/">Trang chủ</Link> / <Link to="#">Tin tức</Link>
            </div>

            {/* Header */}
            <div className={cx('header')}>
                <div className={cx('title')}>
                    <p>
                        Tin tức <span>nổi bật</span>
                    </p>
                    <hr />
                </div>
            </div>

            {/* Phần Tin tức nổi bật */}
            <div className={cx('content')}>
                <div className={cx('breaking-news')}>
                    <div className={cx('main-news')}>
                        {knowledgeSharingNews.length > 0 && (
                            <div className={cx('main-news-item')}>
                                <img
                                    src={knowledgeSharingNews[0].imageUrl}
                                    alt={knowledgeSharingNews[0].title}
                                    className={cx('main-image')}
                                    onError={(e) => {
                                        e.target.src = '/images/no-image.jpg';
                                    }}
                                />
                                <div className={cx('main-info')}>
                                    <p className={cx('date')}>
                                        <span>🕒</span> {knowledgeSharingNews[0].date} • 📈{' '}
                                        {knowledgeSharingNews[0].views}
                                    </p>
                                    <h2 className={cx('main-title')}>
                                        <Link to={`/news/${knowledgeSharingNews[0].id}`}>
                                            {knowledgeSharingNews[0].title}
                                        </Link>
                                    </h2>
                                    <p className={cx('description')} style={{ marginBottom: '1px' }}>
                                        {knowledgeSharingNews[0].description}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={cx('sidebar')}>
                        <div className={cx('news-list')}>
                            {newsData.slice(1, 4).map((news) => (
                                <div key={news.id} className={cx('news-item')}>
                                    <img
                                        src={news.imageUrl}
                                        alt={news.title}
                                        className={cx('news-image')}
                                        onError={(e) => {
                                            e.target.src = '/images/no-image.jpg';
                                        }}
                                    />
                                    <div className={cx('news-info')}>
                                        <p className={cx('date')}>
                                            <span>🕒</span> {news.date} • 📈 {news.views}
                                        </p>
                                        <h4 className={cx('news-title')}>
                                            <Link to={`/news/${news.id}`}>{news.title}</Link>
                                        </h4>
                                        <p className={cx('description')}>{news.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className={cx('view-all-container')}>
                    <Link to="/blog" className={cx('view-all')}>
                        <span>Xem tất cả</span>
                        <img src="/images/Arrow_Right.svg" alt="" />
                    </Link>
                </div>
            </div>

            {/* Phần Danh mục */}
            <div className={cx('category')}>
                <div className={cx('category-header')}>
                    <h5>
                        <span>Danh mục</span>
                        <hr />
                    </h5>
                    <div className={cx('category-list')}>
                        {categories.map((category) => (
                            <button
                                key={category}
                                className={cx('category-item', { active: selectedCategory === category })}
                                onClick={() => setSelectedCategory(category)}
                            >
                                <FontAwesomeIcon icon={faSearch} />
                                <span>{category}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={cx('category-list')}>
                    <div className={cx('category-left')}>
                        {/* Phần Chia sẻ kiến thức */}
                        <div className={cx('share-knowledge')}>
                            <h3>
                                <span>Chia sẻ kiến thức</span>
                                <hr />
                            </h3>
                            {knowledgeSharingNews.length > 0 && (
                                <>
                                    <div className={cx('main-news-item')}>
                                        <img
                                            src={knowledgeSharingNews[1].imageUrl}
                                            alt={knowledgeSharingNews[1].title}
                                            className={cx('main-image')}
                                            onError={(e) => {
                                                e.target.src = '/images/no-image.jpg';
                                            }}
                                        />
                                        <div className={cx('main-info')}>
                                            <p className={cx('date')}>
                                                <span>🕒</span> {knowledgeSharingNews[1].date} • 📈{' '}
                                                {knowledgeSharingNews[1].views}
                                            </p>
                                            <h2 className={cx('main-title')}>
                                                <Link to={`/news/${knowledgeSharingNews[1].id}`}>
                                                    {knowledgeSharingNews[1].title}
                                                </Link>
                                            </h2>
                                            <p className={cx('description')}>{knowledgeSharingNews[1].description}</p>
                                        </div>
                                    </div>
                                    <div className={cx('news-grid')}>
                                        {knowledgeSharingNews.slice(1, 4).map((news) => (
                                            <div key={news.id} className={cx('news-card')}>
                                                <img
                                                    src={news.imageUrl}
                                                    alt={news.title}
                                                    className={cx('news-image')}
                                                    onError={(e) => {
                                                        e.target.src = '/images/no-image.jpg';
                                                    }}
                                                />
                                                <div className={cx('news-info')}>
                                                    <p className={cx('date')}>
                                                        <span>🕒</span> {news.date} • 📈 {news.views}
                                                    </p>
                                                    <h4 className={cx('news-title')}>
                                                        <Link to={`/news/${news.id}`}>{news.title}</Link>
                                                    </h4>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={cx('view-all-container')}>
                                        <Link to="/blog" className={cx('view-all')}>
                                            Xem tất cả
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Phần Kinh nghiệm học tập */}
                        <div className={cx('study-experience')}>
                            <h3>
                                <span>Kinh nghiệm học tập</span>
                                <hr />
                            </h3>
                            {studyExperienceNews.length > 0 && (
                                <>
                                    <div className={cx('main-news-item')}>
                                        <img
                                            src={studyExperienceNews[2].imageUrl}
                                            alt={studyExperienceNews[2].title}
                                            className={cx('main-image')}
                                            onError={(e) => {
                                                e.target.src = '/images/no-image.jpg';
                                            }}
                                        />
                                        <div className={cx('main-info')}>
                                            <p className={cx('date')}>
                                                <span>🕒</span> {studyExperienceNews[2].date} • 📈{' '}
                                                {studyExperienceNews[2].views}
                                            </p>
                                            <h2 className={cx('main-title')}>
                                                <Link to={`/news/${studyExperienceNews[2].id}`}>
                                                    {studyExperienceNews[2].title}
                                                </Link>
                                            </h2>
                                            <p className={cx('description')}>{studyExperienceNews[2].description}</p>
                                        </div>
                                    </div>
                                    <div className={cx('news-grid')}>
                                        {studyExperienceNews.slice(5, 8).map((news) => (
                                            <div key={news.id} className={cx('news-card')}>
                                                <img
                                                    src={news.imageUrl}
                                                    alt={news.title}
                                                    className={cx('news-image')}
                                                    onError={(e) => {
                                                        e.target.src = '/images/no-image.jpg';
                                                    }}
                                                />
                                                <div className={cx('news-info')}>
                                                    <p className={cx('date')}>
                                                        <span>🕒</span> {news.date} • 📈 {news.views}
                                                    </p>
                                                    <h4 className={cx('news-title')}>
                                                        <Link to={`/news/${news.id}`}>{news.title}</Link>
                                                    </h4>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={cx('view-all-container')}>
                                        <Link to="/blog" className={cx('view-all')}>
                                            Xem tất cả
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={cx('extend-btn')}>
                            <button>
                                <span>Mở rộng</span>
                                <img src="/images/Dropdown.svg" alt="" />
                            </button>
                        </div>
                    </div>

                    {/* Phần Tin tức mới nhất */}
                    <div className={cx('category-right')}>
                        <div className={cx('latest-news')}>
                            <h3>
                                <span>Kinh nghiệm học tập</span>
                                <hr />
                            </h3>
                            <div className={cx('news-grid')}>
                                {newsData.slice(4).map((news) => (
                                    <div key={news.id} className={cx('news-card')}>
                                        <img
                                            src={news.imageUrl}
                                            alt={news.title}
                                            className={cx('news-image')}
                                            onError={(e) => {
                                                e.target.src = '/images/no-image.jpg';
                                            }}
                                        />
                                        <div className={cx('news-info')}>
                                            <p className={cx('date')}>
                                                <span>🕒</span> {news.date} • 📈 {news.views}
                                            </p>
                                            <h4 className={cx('news-title')}>
                                                <Link to={`/news/${news.id}`}>{news.title}</Link>
                                            </h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Blog;
