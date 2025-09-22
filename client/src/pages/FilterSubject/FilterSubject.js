import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import queryString from 'query-string';
import classNames from 'classnames/bind';
import styles from './FilterSubject.module.scss';
import SearchBar from '../../layouts/components/SearchBar';
import CheckboxGroup from '../../components/CheckboxGroup/CheckboxGroup';
import Dropdown from '../../components/Dropdown';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const cx = classNames.bind(styles);

// Thời gian cache (1 giờ = 60 phút * 60 giây * 1000 milliseconds)
const CACHE_DURATION = 60 * 60 * 1000;

const FilterSubject = () => {
    const location = useLocation();
    const { keyword, course } = queryString.parse(location.search); // Lấy cả keyword và course
    const [selectedItems, setSelectedItems] = useState([]);
    const [subjectsList, setSubjectsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cachedImages, setCachedImages] = useState({});

    const options = [
        { value: 'option1', label: 'Tất cả' },
        { value: 'option2', label: 'PDF' },
        { value: 'option3', label: 'Word' },
        { value: 'option4', label: 'Excel' },
        { value: 'option5', label: 'PPT' },
    ];

    const [sortOrder, setSortOrder] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Hàm kiểm tra và lấy dữ liệu từ localStorage
    const getCachedData = () => {
        const cached = localStorage.getItem('subjectsList');
        const cachedTimestamp = localStorage.getItem('subjectsListTimestamp');
        const cachedImagesData = localStorage.getItem('cachedImages');

        if (cached && cachedTimestamp) {
            const currentTime = new Date().getTime();
            const timeDifference = currentTime - parseInt(cachedTimestamp, 10);

            if (timeDifference < CACHE_DURATION) {
                const subjectsData = JSON.parse(cached);
                const imagesData = cachedImagesData ? JSON.parse(cachedImagesData) : {};
                setCachedImages(imagesData);
                return subjectsData;
            }
        }
        return null;
    };

    // Hàm lưu dữ liệu vào localStorage
    const setCachedData = (data) => {
        localStorage.setItem('subjectsList', JSON.stringify(data));
        localStorage.setItem('subjectsListTimestamp', new Date().getTime().toString());
        localStorage.setItem('cachedImages', JSON.stringify(cachedImages));
    };

    // Hàm tải và cache hình ảnh
    const cacheImage = async (imageUrl, itemId) => {
        if (cachedImages[itemId]) {
            return cachedImages[itemId];
        }

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const reader = new FileReader();

            return new Promise((resolve) => {
                reader.onloadend = () => {
                    const base64data = reader.result;
                    setCachedImages((prev) => ({
                        ...prev,
                        [itemId]: base64data,
                    }));
                    resolve(base64data);
                };
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            console.error(`Lỗi khi tải hình ảnh ${imageUrl}:`, err);
            return imageUrl;
        }
    };

    // Lấy dữ liệu từ Firestore
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Lấy danh sách faculties
                const facultiesCollection = collection(db, 'faculties');
                const facultiesSnapshot = await getDocs(facultiesCollection);
                const facultiesMap = {};

                facultiesSnapshot.docs.forEach((doc) => {
                    const data = doc.data();
                    facultiesMap[data.MaKhoa] = data.TenKhoa;
                });

                // Lấy danh sách subjects
                const subjectsCollection = collection(db, 'subjects');
                const subjectsSnapshot = await getDocs(subjectsCollection);
                const subjectsData = [];

                subjectsSnapshot.docs.forEach((doc) => {
                    const data = doc.data();
                    const facultyName = facultiesMap[data.MaKhoa] || 'Khoa không xác định';
                    const imageUrl = data.AnhMon || '/images/no-image.jpg';

                    subjectsData.push({
                        id: doc.id,
                        title: data.TenMH || 'Môn học không xác định',
                        department: facultyName,
                        imageUrl: imageUrl,
                    });
                });

                setCachedData(subjectsData);
                setSubjectsList(subjectsData);
                setLoading(false);
            } catch (err) {
                setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
                setLoading(false);
                console.error('Lỗi khi lấy dữ liệu:', err);
            }
        };

        const cachedData = getCachedData();
        if (cachedData) {
            setSubjectsList(cachedData);
            setLoading(false);
        } else {
            fetchData();
        }
    }, []);

    // Hàm xử lý thay đổi sắp xếp
    const handleSortChange = (e) => {
        setSortOrder(e.target.value);
    };

    // Hàm xử lý chuyển trang
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Lọc dữ liệu dựa trên keyword hoặc course
    const filteredResults = subjectsList.filter((item) => {
        if (keyword) {
            // Khi có keyword (từ card-title), lọc chính xác theo tiêu đề
            return item.title.toLowerCase() === keyword.toLowerCase();
        } else if (course) {
            // Khi có course (từ card-faculty), lọc theo khoa
            return item.department.toLowerCase().includes(course.toLowerCase());
        }
        return true; // Nếu không có keyword hoặc course, hiển thị tất cả
    });

    // Sắp xếp dữ liệu (dựa trên sortOrder)
    const sortedResults = [...filteredResults].sort((a, b) => {
        if (sortOrder === 'newest') {
            return b.id.localeCompare(a.id);
        }
        return a.id.localeCompare(b.id);
    });

    // Tính toán index của item đầu và cuối trên trang hiện tại
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedResults.slice(indexOfFirstItem, indexOfLastItem);

    if (loading) {
        return <div>Đang tải dữ liệu...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <>
            <div className={cx('filter-book-container')}>
                <div className={cx('search-bar')}>
                    <SearchBar />
                </div>

                <div className={cx('results-link')}>
                    <Link to="/">Trang chủ</Link> / <Link>Môn học</Link> / <Link>Sắp xếp theo ngày gần nhất</Link>
                </div>

                <div className={cx('results-content')}>
                    <div className={cx('results-body')}>
                        <div className={cx('results-list')}>
                            <div className={cx('results-header')}>
                                <p className={cx('results-title')} style={{ width: '510px' }}>
                                    Có <span>{filteredResults.length}</span> môn học{' '}
                                    {course ? `thuộc khoa "${course}"` : keyword ? `liên quan đến "${keyword}"` : ''}
                                </p>
                                <div className={cx('results-dropdow')}>
                                    <span>Sắp xếp theo</span>
                                    <Dropdown
                                        options={['Ngày đăng gần nhất', 'Filter 2', 'Filter 3']}
                                        onChange={handleSortChange}
                                    />
                                </div>
                            </div>

                            {currentItems.map((item) => (
                                <div key={item.id} className={cx('book-item')}>
                                    <div className={cx('book-img')}>
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className={cx('book-thumbnail')}
                                            onError={(e) => {
                                                e.target.src = '/images/no-image.jpg';
                                            }}
                                        />
                                    </div>
                                    <div className={cx('book-info')}>
                                        <p className={cx('book-department')}>{item.department}</p>
                                        <h3 className={cx('book-title')}>{item.title}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={cx('pagination')}>
                            {Array.from(
                                { length: Math.ceil(filteredResults.length / itemsPerPage) },
                                (_, i) => i + 1,
                            ).map((page) => (
                                <button
                                    key={page}
                                    className={cx('page-button', { active: currentPage === page })}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={cx('filter-section')}>
                        <p>
                            <img src="/images/Filter.svg" alt="Filter Icon" />
                            <span>Lọc kết quả nhanh</span>
                        </p>
                        <div
                            style={{
                                marginTop: '20px',
                                marginBottom: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <span>Loại</span>
                            <img src="/images/Down_fill.svg" alt="Dropdown Icon" />
                        </div>
                        <div className={cx('filter-checkbox')}>
                            <CheckboxGroup
                                options={options}
                                selectedValues={selectedItems}
                                onChange={setSelectedItems}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default FilterSubject;
