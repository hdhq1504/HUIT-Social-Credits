import React, { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from './Home.module.scss';
import SearchBar from '../../layouts/components/SearchBar';
import FacultySection from '../../components/FacultySection/FacultySection';
import MaterialsList from '../../components/MaterialsList/MaterialsList';
import AccessSteps from '../../components/AccessSteps/AccessSteps';
import TrendingKeywords from '../../components/TrendingKeywords/TrendingKeywords';
import TrendingNews from '../../components/TrendingNews/TrendingNews';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const cx = classNames.bind(styles);

// Thời gian cache (1 giờ = 60 phút * 60 giây * 1000 milliseconds)
const CACHE_DURATION = 60 * 60 * 1000;

// Biến kiểm soát log (bật/tắt log trong môi trường production)
const ENABLE_LOGS = process.env.NODE_ENV === 'development'; // Chỉ bật log trong môi trường development

// Lấy dữ liệu từ localStorage (nếu có)
const getCachedData = () => {
    const cached = localStorage.getItem('cachedData');
    const cachedTimestamp = localStorage.getItem('cachedDataTimestamp');
    const cachedImagesData = localStorage.getItem('cachedImagesHome');

    if (cached && cachedTimestamp) {
        const currentTime = new Date().getTime();
        const timeDifference = currentTime - parseInt(cachedTimestamp, 10);

        if (timeDifference < CACHE_DURATION) {
            const data = JSON.parse(cached);
            const imagesData = cachedImagesData ? JSON.parse(cachedImagesData) : {};
            return { data, images: imagesData };
        }
    }
    return { data: { materials: null, subjects: null, subjectCount: null, faculties: null }, images: {} };
};

// Lưu dữ liệu vào localStorage
const setCachedData = (data, images) => {
    localStorage.setItem('cachedData', JSON.stringify(data));
    localStorage.setItem('cachedDataTimestamp', new Date().getTime().toString());
    localStorage.setItem('cachedImagesHome', JSON.stringify(images));
};

// Khởi tạo cachedData từ localStorage
let { data: cachedData, images: cachedImagesData } = getCachedData();

function Home() {
    const [materials, setMaterials] = useState(cachedData.materials || []); // Tài liệu nổi bật
    const [subjects, setSubjects] = useState(cachedData.subjects || []); // Danh sách môn học
    const [subjectCount, setSubjectCount] = useState(cachedData.subjectCount || 0);
    const [faculties, setFaculties] = useState(cachedData.faculties || []); // Danh sách khoa
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cachedImages, setCachedImages] = useState(cachedImagesData); // State để lưu trữ hình ảnh đã tải
    const navigate = useNavigate();

    // Hàm tải và cache hình ảnh (chỉ gọi khi cần)
    const cacheImage = async (imageUrl, itemId) => {
        if (cachedImages[itemId]) {
            return cachedImages[itemId]; // Trả về hình ảnh đã cache
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
            if (ENABLE_LOGS) {
                console.error(`Lỗi khi tải hình ảnh ${imageUrl}:`, err);
            }
            return imageUrl; // Trả về URL gốc nếu không tải được
        }
    };

    // Lấy dữ liệu từ Firestore
    useEffect(() => {
        if (cachedData.materials && cachedData.subjects && cachedData.faculties) {
            setMaterials(cachedData.materials);
            setSubjects(cachedData.subjects);
            setSubjectCount(cachedData.subjectCount);
            setFaculties(cachedData.faculties);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);

                // Bước 1: Lấy toàn bộ faculties trước và lưu vào facultiesMap
                const facultiesCollection = collection(db, 'faculties');
                const facultiesSnapshot = await getDocs(facultiesCollection);
                const facultiesMap = {};
                const facultiesList = [];

                for (const doc of facultiesSnapshot.docs) {
                    const data = doc.data();
                    facultiesMap[data.MaKhoa] = data;

                    const imageUrl = data.AnhKhoa || '/images/no-image.jpg';
                    const cachedImage = cachedImages[doc.id] || imageUrl; // Sử dụng URL gốc nếu chưa cache

                    facultiesList.push({
                        id: doc.id,
                        MaKhoa: data.MaKhoa,
                        TenKhoa: data.TenKhoa || 'Khoa không xác định',
                        image: cachedImage,
                        GioiThieu: data.GioiThieu || '',
                    });
                }
                setFaculties(facultiesList);

                // Bước 2: Lấy toàn bộ subjects và lưu vào subjectsMap
                const subjectsCollection = collection(db, 'subjects');
                const subjectsSnapshot = await getDocs(subjectsCollection);
                const subjectsMap = {};
                for (const doc of subjectsSnapshot.docs) {
                    const data = doc.data();
                    subjectsMap[data.MaMH] = data;
                }

                // Bước 3: Lấy danh sách tài liệu từ collection 'documents'
                const materialsCollection = collection(db, 'documents');
                const materialsSnapshot = await getDocs(materialsCollection);

                const materialsList = [];
                for (const docSnapshot of materialsSnapshot.docs) {
                    const data = docSnapshot.data();

                    // Lấy thông tin môn học từ subjectsMap
                    const subjectData = subjectsMap[data.maMH] || {};
                    if (!subjectsMap[data.maMH]) {
                        if (ENABLE_LOGS) {
                            console.warn(`Không tìm thấy môn học với MaMH: ${data.maMH}`);
                        }
                        continue; // Bỏ qua tài liệu nếu không tìm thấy môn học
                    }
                    const subjectName = subjectData.TenMH || 'Môn học không xác định';
                    const subjectId = data.maMH || 'unknown';
                    const facultyId = subjectData.MaKhoa || 'unknown';

                    // Lấy TenKhoa từ facultiesMap thông qua MaKhoa
                    const facultyData = facultiesMap[facultyId] || {};
                    if (!facultiesMap[facultyId]) {
                        if (ENABLE_LOGS) {
                            console.warn(`Không tìm thấy khoa với MaKhoa: ${facultyId}`);
                        }
                    }
                    const facultyName = facultyData.TenKhoa || 'Khoa không xác định';

                    const imageUrl = data.previewImages || '/images/no-image.jpg';
                    const cachedImage = cachedImages[docSnapshot.id] || imageUrl; // Sử dụng URL gốc nếu chưa cache

                    materialsList.push({
                        id: docSnapshot.id,
                        image: cachedImage,
                        title: data.tenTaiLieu || 'Không có tiêu đề',
                        subject: {
                            id: subjectId,
                            name: subjectName,
                        },
                        facultyName: facultyName,
                        type: data.loai || 'PDF',
                        luotTaiVe: data.luotTaiVe || 0,
                        luotThich: data.luotThich || 0,
                    });
                }

                // Sắp xếp tài liệu nổi bật
                const sortedMaterials = [...materialsList].sort(
                    (a, b) => b.luotTaiVe + b.luotThich - (a.luotTaiVe + a.luotThich),
                );
                const finalMaterials = sortedMaterials.slice(0, 8);
                setMaterials(finalMaterials);

                // Bước 4: Lấy danh sách môn học từ collection 'subjects'
                const subjectsList = [];
                for (const docSnapshot of subjectsSnapshot.docs) {
                    const data = docSnapshot.data();

                    // Lấy TenKhoa từ facultiesMap thông qua MaKhoa
                    const facultyId = data.MaKhoa || 'unknown';
                    const facultyData = facultiesMap[facultyId] || {};
                    if (!facultiesMap[facultyId]) {
                        if (ENABLE_LOGS) {
                            console.warn(`Không tìm thấy khoa với MaKhoa: ${facultyId}`);
                        }
                    }
                    const facultyName = facultyData.TenKhoa || 'Khoa không xác định';

                    const imageUrl = data.AnhMon || '/images/no-image.jpg';
                    const cachedImage = cachedImages[docSnapshot.id] || imageUrl; // Sử dụng URL gốc nếu chưa cache

                    subjectsList.push({
                        id: docSnapshot.id,
                        image: cachedImage,
                        title: data.TenMH || 'Không có tiêu đề',
                        facultyName: facultyName,
                        subject: { id: docSnapshot.id, name: data.TenMH },
                        type: 'Môn học',
                    });
                }

                const finalSubjects = subjectsList.slice(0, 8);
                setSubjects(finalSubjects);
                setSubjectCount(subjectsSnapshot.size);

                // Lưu vào cache và localStorage
                cachedData = {
                    materials: finalMaterials,
                    subjects: finalSubjects,
                    subjectCount: subjectsSnapshot.size,
                    faculties: facultiesList,
                };
                setCachedData(cachedData, cachedImages);

                setLoading(false);
            } catch (err) {
                setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
                setLoading(false);
                if (ENABLE_LOGS) {
                    console.error('Lỗi khi lấy dữ liệu:', err);
                }
            }
        };

        fetchData();
    }, []);

    // Tải hình ảnh sau khi dữ liệu đã được render
    useEffect(() => {
        const loadImages = async () => {
            const allItems = [...materials, ...subjects, ...faculties];
            const newCachedImages = { ...cachedImages };

            for (const item of allItems) {
                if (!newCachedImages[item.id]) {
                    const imageUrl = item.image;
                    try {
                        const cachedImage = await cacheImage(imageUrl, item.id);
                        newCachedImages[item.id] = cachedImage;
                    } catch (err) {
                        if (ENABLE_LOGS) {
                            console.error(`Lỗi khi tải hình ảnh cho item ${item.id}:`, err);
                        }
                    }
                }
            }

            setCachedImages(newCachedImages);
            setCachedData(cachedData, newCachedImages);
        };

        if (materials.length > 0 || subjects.length > 0 || faculties.length > 0) {
            loadImages();
        }
    }, [materials, subjects, faculties]);

    return (
        <div className={cx('wrapper')}>
            <div className={cx('banner')}>
                <div className={cx('banner-content')}>
                    <h1 className={cx('banner-title')}>
                        TÌM KIẾM TÀI LIỆU VÀ TẠO BÀI KIỂM TRA
                        <br />
                        TẠI <span className={cx('highlight')}>HUIT E-LEARN</span>
                    </h1>
                    <p className={cx('banner-subtitle')}>
                        Trang web chính thức của trường Đại học Công thương TP. Hồ Chí Minh
                    </p>
                </div>
                <div className={cx('banner-search')}>
                    <div>
                        <SearchBar />
                    </div>
                </div>
            </div>

            <div className={cx('content')}>
                <FacultySection faculties={faculties} />

                <section className={cx('section')}>
                    <h2 className={cx('section-title')}>
                        Tài liệu <span className={cx('highlight')}>nổi bật</span>
                    </h2>
                    <MaterialsList
                        materials={materials}
                        loading={loading}
                        error={error}
                        navigateTo="/filterDepartment"
                        type="document"
                    />
                </section>

                <AccessSteps />

                <section className={cx('section')}>
                    <h2 className={cx('section-title')}>
                        Có <span className={cx('highlight')}>{subjectCount}</span> môn học có tài liệu
                    </h2>
                    <MaterialsList
                        materials={subjects}
                        loading={loading}
                        error={error}
                        navigateTo="/filterSubject"
                        type="subject"
                    />
                </section>

                <TrendingKeywords />

                <section className={cx('section')}>
                    <h2 className={cx('section-title')} style={{ textAlign: 'center' }}>
                        TIN TỨC <span className={cx('highlight')}>NỔI BẬT</span>
                    </h2>
                    <TrendingNews />
                </section>
            </div>
        </div>
    );
}

export default Home;
