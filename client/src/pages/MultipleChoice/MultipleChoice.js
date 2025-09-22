import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Card,
    CardContent,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import classNames from 'classnames/bind';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import SearchBar from '../../layouts/components/SearchBar';
import styles from './MultipleChoice.module.scss';

const cx = classNames.bind(styles);

// Reusable TopicBox Component
const TopicBox = ({ title, description }) => (
    <Box sx={{ minWidth: '460px', maxWidth: '460px' }}>
        <Typography variant="subtitle1" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>
            {title}
        </Typography>
        <Typography
            variant="body2"
            sx={{
                fontSize: '16px',
                pb: '0px',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}
        >
            {description}
        </Typography>
        <Button
            variant="text"
            sx={{
                color: 'var(--primary)',
                fontWeight: 600,
                textTransform: 'none',
                marginBottom: '20px',
                float: 'right',
            }}
        >
            &gt;&gt; XEM THÊM
        </Button>
    </Box>
);

// Reusable TestCard Component
const TestCard = ({ code, testId }) => (
    <Link to={`/assignment/${testId}`} style={{ textDecoration: 'none' }}>
        <Card className={cx('test-card')}>
            <CardContent style={{ display: 'flex', padding: '0', height: '100%' }}>
                <div style={{ padding: '10px', backgroundColor: '#EAEAEA' }}>
                    <img
                        src="/images/dektra.svg"
                        alt=""
                        style={{
                            width: '40px',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    />
                </div>
                <Typography style={{ padding: '16px', fontWeight: '600' }}>{code}</Typography>
            </CardContent>
        </Card>
    </Link>
);

function MultipleChoice() {
    const [tabValueTests, setTabValueTests] = useState(0);
    const [subjects, setSubjects] = useState([]); // All subjects
    const [userTests, setUserTests] = useState([]); // User-specific tests
    const [filteredSubjects, setFilteredSubjects] = useState([]); // Subjects with user tests
    const [faculties, setFaculties] = useState([]); // All faculties

    // Get the current user from Redux store
    const { user } = useSelector((state) => state.auth);

    // Fetch all subjects from Firestore
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
                const subjectsData = subjectsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setSubjects(subjectsData);
            } catch (error) {
                console.error('Lỗi khi lấy danh sách môn học:', error);
                setSubjects([]);
            }
        };

        fetchSubjects();
    }, []);

    // Fetch all faculties from Firestore
    useEffect(() => {
        const fetchFaculties = async () => {
            try {
                const facultiesSnapshot = await getDocs(collection(db, 'faculties'));
                const facultiesData = facultiesSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setFaculties(facultiesData);
            } catch (error) {
                console.error('Lỗi khi lấy danh sách khoa:', error);
                setFaculties([]);
            }
        };

        fetchFaculties();
    }, []);

    // Fetch tests created by the current user
    useEffect(() => {
        const fetchUserTests = async () => {
            if (!user || !user.MaNguoiDung) {
                setUserTests([]);
                setFilteredSubjects([]);
                return;
            }

            try {
                const userTestsQuery = query(collection(db, 'test'), where('MaNguoiDung', '==', user.MaNguoiDung));
                const userTestsSnapshot = await getDocs(userTestsQuery);
                const userTestsData = userTestsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setUserTests(userTestsData);

                const subjectsWithTests = subjects.filter((subject) =>
                    userTestsData.some((test) => test.MaMon === subject.MaMH),
                );
                setFilteredSubjects(subjectsWithTests);

                if (subjectsWithTests.length === 0) {
                    setTabValueTests(0);
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách đề kiểm tra của người dùng:', error);
                setUserTests([]);
                setFilteredSubjects([]);
            }
        };

        if (subjects.length > 0) {
            fetchUserTests();
        }
    }, [user, subjects]);

    const handleTabChangeTests = (event, newValue) => {
        setTabValueTests(newValue);
    };

    const tabStyles = (index) => ({
        marginRight: '10px',
        padding: '4px 12px',
        minHeight: '32px',
        backgroundColor: tabValueTests === index ? 'var(--primary)' : 'transparent',
        color: tabValueTests === index ? '#fff !important' : '#000',
        '&:hover': {
            backgroundColor: tabValueTests === index ? '#1565c0' : '#f5f5f5',
        },
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '14px',
    });

    const filteredTests = userTests
        .filter((test) => {
            if (filteredSubjects.length === 0) return false;
            const selectedSubject = filteredSubjects[tabValueTests];
            return test.MaMon === selectedSubject.MaMH;
        })
        .slice(0, 6);

    return (
        <div className={cx('wrapper')}>
            {/* Banner Section */}
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
                    <SearchBar />
                </div>
            </div>

            <div className={cx('content')}>
                {/* Breadcrumb */}
                <div className={cx('link')}>
                    <Link to="/">Trang chủ</Link> / <Link to="#">Trắc nghiệm</Link>
                </div>

                {/* Questions Section */}
                <div className={cx('questions-section')}>
                    <div className={cx('questions-column')}>
                        <Typography variant="h6" className={cx('section-title')}>
                            CÂU HỎI MỚI NHẤT
                        </Typography>
                        <ul className={cx('questions-list')}>
                            <li>Cấu trúc dữ liệu nào có nguy cơ tắc hoạt động LIFO (Last In, First Out)?</li>
                            <li>Trong hệ điều hành, có chế nào giúp chia sẻ CPU giữa nhiều tiến trình?</li>
                            <li>Giao thức nào được sử dụng để gửi email?</li>
                            <li>Loại tấn công nào nhắm vào việc nghe trộm dữ liệu giữa hai bên giao tiếp?</li>
                            <li>Lệnh SQL nào được dùng để lấy dữ liệu từ bảng?</li>
                            <li>Trong mô hình máy tính Von Neumann, thành phần nào thực hiện lệnh?</li>
                        </ul>
                    </div>
                    <div className={cx('questions-column')}>
                        <Typography variant="h6" className={cx('section-title')}>
                            CÂU HỎI NỔI BẬT
                        </Typography>
                        <ul className={cx('questions-list')}>
                            <li>Trong lý thuyết độ thị, một độ thị có thể được biểu diễn bằng cách nào?</li>
                            <li>Trong mô hình có số dữ liệu quan hệ, mỗi hàng trong bảng được gọi là gì?</li>
                            <li>
                                Thuật toán tìm kiếm nhị phân (Binary Search) có độ phức tạp thời gian trung bình là bao
                                nhiêu?
                            </li>
                            <li>Hệ điều hành nào được xây là mã nguồn mở?</li>
                            <li>Giao thức nào được dùng để vận chuyển (Transport Layer) trong mô hình OSI?</li>
                            <li>Loại mã độc nào có thể tự sao chép và lây nhiễm mà không cần sự can thiệp của người</li>
                        </ul>
                    </div>
                </div>

                {/* Tests Section */}
                <div className={cx('tests-section')}>
                    <Typography variant="h6" className={cx('section-title')}>
                        ĐỀ <span>KIỂM TRA</span>
                    </Typography>

                    {!user ? (
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            Vui lòng <Link to="/login">đăng nhập</Link> để xem các đề kiểm tra bạn đã tạo.
                        </Typography>
                    ) : filteredSubjects.length === 0 ? (
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            Bạn chưa tạo đề kiểm tra nào. <Link to="/create-test">Tạo ngay</Link>!
                        </Typography>
                    ) : (
                        <>
                            <Tabs
                                value={tabValueTests}
                                onChange={handleTabChangeTests}
                                className={cx('tabs')}
                                sx={{
                                    '& .MuiTabs-indicator': { display: 'none' },
                                    minHeight: '32px',
                                }}
                            >
                                {filteredSubjects.map((subject, index) => (
                                    <Tab key={index} label={subject.TenMH} sx={tabStyles(index)} />
                                ))}
                            </Tabs>

                            <Box className={cx('tests-list')}>
                                {filteredTests.length === 0 ? (
                                    <Typography variant="body1" sx={{ mt: 2 }}>
                                        Không có đề kiểm tra nào cho môn {filteredSubjects[tabValueTests]?.TenMH}.
                                    </Typography>
                                ) : (
                                    <div className={cx('tests-row')}>
                                        {filteredTests.map((test, index) => (
                                            <TestCard
                                                key={index}
                                                code={test.TenDe || `Mã đề #${test.id}`}
                                                testId={test.id}
                                            />
                                        ))}
                                    </div>
                                )}
                            </Box>
                        </>
                    )}

                    <div className={cx('view-all')}>
                        <button className={cx('view-all-btn')}>
                            Xem tất cả
                            <img src="/images/Arrow_Right.svg" alt="Arrow Right" />
                        </button>
                    </div>
                </div>

                {/* Majors Section */}
                <div className={cx('majors-section')}>
                    <Typography variant="h6" className={cx('section-title')}>
                        CÁC MÔN <span>CHUYÊN NGÀNH</span>
                    </Typography>

                    {faculties.map((faculty, index) => {
                        // Lọc các môn học thuộc khoa này
                        const relatedSubjects = subjects.filter((subject) => subject.MaKhoa === faculty.MaKhoa);

                        return (
                            <Accordion
                                key={index}
                                sx={{
                                    backgroundColor: '#f5f5f5',
                                    border: 'none',
                                    boxShadow: 'none',
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        minHeight: '48px',
                                        '& .MuiAccordionSummary-content': { margin: '0' },
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontWeight: 500,
                                            fontSize: '18px',
                                            fontFamily: 'Roboto, sans-serif',
                                            textTransform: 'uppercase',
                                            color: '#333',
                                            minWidth: '48px',
                                            padding: '0',
                                        }}
                                    >
                                        {faculty.TenKhoa}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails
                                    sx={{
                                        padding: '20px',
                                        backgroundColor: '#EAEAEA',
                                        // borderTop: '1px solid #ddd',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '20px',
                                    }}
                                >
                                    {relatedSubjects.length > 0 ? (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                justifyContent: 'space-between',
                                                gap: '10px',
                                            }}
                                        >
                                            {relatedSubjects.map((subject, idx) => (
                                                <TopicBox
                                                    key={idx}
                                                    title={subject.TenMH}
                                                    description={subject.GioiThieu || 'Không có mô tả'}
                                                />
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography>Không có môn học nào thuộc khoa này.</Typography>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default MultipleChoice;

// import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import {
//     Accordion,
//     AccordionDetails,
//     AccordionSummary,
//     Box,
//     Button,
//     Card,
//     CardContent,
//     Tab,
//     Tabs,
//     Typography,
// } from '@mui/material';
// import classNames from 'classnames/bind';
// import { collection, getDocs, query, where } from 'firebase/firestore';
// import React, { useEffect, useState } from 'react';
// import { useSelector } from 'react-redux';
// import { Link, useLocation } from 'react-router-dom';
// import { db } from '../../firebase/config';
// import SearchBar from '../../layouts/components/SearchBar';
// import styles from './MultipleChoice.module.scss';

// const cx = classNames.bind(styles);

// // Reusable TopicBox Component
// const TopicBox = ({ title, description }) => (
//     <Box sx={{ minWidth: '460px', maxWidth: '460px' }}>
//         <Typography variant="subtitle1" sx={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }}>
//             {title}
//         </Typography>
//         <Typography
//             variant="body2"
//             sx={{
//                 fontSize: '16px',
//                 pb: '0px',
//                 display: '-webkit-box',
//                 WebkitBoxOrient: 'vertical',
//                 WebkitLineClamp: 4,
//                 overflow: 'hidden',
//                 textOverflow: 'ellipsis',
//             }}
//         >
//             {description}
//         </Typography>
//         <Button
//             variant="text"
//             sx={{
//                 color: 'var(--primary)',
//                 fontWeight: 600,
//                 textTransform: 'none',
//                 marginBottom: '20px',
//                 float: 'right',
//             }}
//         >
//             >> XEM THÊM
//         </Button>
//     </Box>
// );

// // Reusable TestCard Component
// const TestCard = ({ code, testId }) => (
//     <Link to={`/assignment/${testId}`} style={{ textDecoration: 'none' }}>
//         <Card className={cx('test-card')}>
//             <CardContent style={{ display: 'flex', padding: '0', height: '100%' }}>
//                 <div style={{ padding: '10px', backgroundColor: '#EAEAEA' }}>
//                     <img
//                         src="/images/dektra.svg"
//                         alt=""
//                         style={{
//                             width: '40px',
//                             height: '100%',
//                             display: 'flex',
//                             alignItems: 'center',
//                             justifyContent: 'center',
//                         }}
//                     />
//                 </div>
//                 <Typography style={{ padding: '16px', fontWeight: '600' }}>{code}</Typography>
//             </CardContent>
//         </Card>
//     </Link>
// );

// function MultipleChoice() {
//     const [tabValueTests, setTabValueTests] = useState(0);
//     const [subjects, setSubjects] = useState([]); // All subjects
//     const [userTests, setUserTests] = useState([]); // User-specific tests
//     const [filteredSubjects, setFilteredSubjects] = useState([]); // Subjects with user tests
//     const [faculties, setFaculties] = useState([]); // All faculties
//     const [refreshTrigger, setRefreshTrigger] = useState(0); // State để trigger làm mới dữ liệu

//     // Get the current user from Redux store
//     const { user } = useSelector((state) => state.auth);
//     const location = useLocation();

//     // Log user information to debug
//     console.log('Current User:', user);

//     // Fetch all subjects from Firestore
//     useEffect(() => {
//         const fetchSubjects = async () => {
//             try {
//                 const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
//                 const subjectsData = subjectsSnapshot.docs.map((doc) => ({
//                     id: doc.id,
//                     ...doc.data(),
//                 }));
//                 setSubjects(subjectsData);
//                 console.log('Subjects:', subjectsData);
//             } catch (error) {
//                 console.error('Lỗi khi lấy danh sách môn học:', error);
//                 setSubjects([]);
//             }
//         };

//         fetchSubjects();
//     }, []);

//     // Fetch all faculties from Firestore
//     useEffect(() => {
//         const fetchFaculties = async () => {
//             try {
//                 const facultiesSnapshot = await getDocs(collection(db, 'faculties'));
//                 const facultiesData = facultiesSnapshot.docs.map((doc) => ({
//                     id: doc.id,
//                     ...doc.data(),
//                 }));
//                 setFaculties(facultiesData);
//                 console.log('Faculties:', facultiesData);
//             } catch (error) {
//                 console.error('Lỗi khi lấy danh sách khoa:', error);
//                 setFaculties([]);
//             }
//         };

//         fetchFaculties();
//     }, []);

//     // Fetch tests created by the current user
//     useEffect(() => {
//         const fetchUserTests = async () => {
//             if (!user || !user.MaNguoiDung) {
//                 setUserTests([]);
//                 setFilteredSubjects([]);
//                 console.log('No user or MaNguoiDung, resetting userTests and filteredSubjects');
//                 return;
//             }

//             try {
//                 const userTestsQuery = query(collection(db, 'test'), where('MaNguoiDung', '==', user.MaNguoiDung));
//                 const userTestsSnapshot = await getDocs(userTestsQuery);
//                 const userTestsData = userTestsSnapshot.docs.map((doc) => ({
//                     id: doc.id,
//                     ...doc.data(),
//                 }));

//                 // Sắp xếp theo thời gian tạo (mới nhất trước)
//                 const sortedTests = userTestsData.sort((a, b) => {
//                     const dateA = a.NgayTao ? a.NgayTao.toDate() : new Date(0);
//                     const dateB = b.NgayTao ? b.NgayTao.toDate() : new Date(0);
//                     return dateB - dateA;
//                 });

//                 setUserTests(sortedTests);
//                 console.log('User Tests:', sortedTests);

//                 const subjectsWithTests = subjects.filter((subject) =>
//                     sortedTests.some((test) => test.MaMon === subject.MaMH),
//                 );
//                 setFilteredSubjects(subjectsWithTests);
//                 console.log('Filtered Subjects:', subjectsWithTests);

//                 if (subjectsWithTests.length === 0) {
//                     setTabValueTests(0);
//                 }
//             } catch (error) {
//                 console.error('Lỗi khi lấy danh sách đề kiểm tra của người dùng:', error);
//                 setUserTests([]);
//                 setFilteredSubjects([]);
//             }
//         };

//         if (subjects.length > 0) {
//             fetchUserTests();
//         }
//     }, [user, subjects, refreshTrigger]); // Thêm refreshTrigger vào dependency array

//     const handleTabChangeTests = (event, newValue) => {
//         setTabValueTests(newValue);
//     };

//     const handleRefresh = () => {
//         setRefreshTrigger((prev) => prev + 1); // Trigger làm mới dữ liệu
//     };

//     const tabStyles = (index) => ({
//         marginRight: '10px',
//         padding: '4px 12px',
//         minHeight: '32px',
//         backgroundColor: tabValueTests === index ? 'var(--primary)' : 'transparent',
//         color: tabValueTests === index ? '#fff !important' : '#000',
//         '&:hover': {
//             backgroundColor: tabValueTests === index ? '#1565c0' : '#f5f5f5',
//         },
//         textTransform: 'none',
//         fontWeight: 500,
//         fontSize: '14px',
//     });

//     const filteredTests = userTests
//         .filter((test) => {
//             if (filteredSubjects.length === 0) return false;
//             const selectedSubject = filteredSubjects[tabValueTests];
//             return test.MaMon === selectedSubject.MaMH;
//         })
//         .slice(0, 6);

//     console.log('Filtered Tests:', filteredTests);

//     // Kiểm tra trùng lặp trong filteredTests
//     const uniqueFilteredTests = Array.from(new Set(filteredTests.map((test) => test.id))).map((id) =>
//         filteredTests.find((test) => test.id === id),
//     );
//     console.log('Unique Filtered Tests:', uniqueFilteredTests);

//     return (
//         <div className={cx('wrapper')}>
//             {/* Banner Section */}
//             <div className={cx('banner')}>
//                 <div className={cx('banner-content')}>
//                     <h1 className={cx('banner-title')}>
//                         TÌM KIẾM TÀI LIỆU VÀ TẠO BÀI KIỂM TRA
//                         <br />
//                         TẠI <span className={cx('highlight')}>HUIT E-LEARN</span>
//                     </h1>
//                     <p className={cx('banner-subtitle')}>
//                         Trang web chính thức của trường Đại học Công thương TP. Hồ Chí Minh
//                     </p>
//                 </div>
//                 <div className={cx('banner-search')}>
//                     <SearchBar />
//                 </div>
//                 {/* Nút xóa cache và làm mới */}
//                 <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
//                     <button
//                         onClick={() => {
//                             localStorage.clear();
//                             sessionStorage.clear();
//                             window.location.reload();
//                         }}
//                         style={{ padding: '5px 10px', backgroundColor: '#f44336', color: '#fff', border: 'none' }}
//                     >
//                         Xóa Cache và Tải Lại
//                     </button>
//                     <button
//                         onClick={handleRefresh}
//                         style={{ padding: '5px 10px', backgroundColor: '#1976d2', color: '#fff', border: 'none' }}
//                     >
//                         Làm mới dữ liệu
//                     </button>
//                 </div>
//             </div>

//             <div className={cx('content')}>
//                 {/* Breadcrumb */}
//                 <div className={cx('link')}>
//                     <Link to="/">Trang chủ</Link> / <Link to="#">Trắc nghiệm</Link>
//                 </div>

//                 {/* Questions Section */}
//                 <div className={cx('questions-section')}>
//                     <div className={cx('questions-column')}>
//                         <Typography variant="h6" className={cx('section-title')}>
//                             CÂU HỎI MỚI NHẤT
//                         </Typography>
//                         <ul className={cx('questions-list')}>
//                             <li>Cấu trúc dữ liệu nào có nguy cơ tắc hoạt động LIFO (Last In, First Out)?</li>
//                             <li>Trong hệ điều hành, có chế nào giúp chia sẻ CPU giữa nhiều tiến trình?</li>
//                             <li>Giao thức nào được sử dụng để gửi email?</li>
//                             <li>Loại tấn công nào nhắm vào việc nghe trộm dữ liệu giữa hai bên giao tiếp?</li>
//                             <li>Lệnh SQL nào được dùng để lấy dữ liệu từ bảng?</li>
//                             <li>Trong mô hình máy tính Von Neumann, thành phần nào thực hiện lệnh?</li>
//                         </ul>
//                     </div>
//                     <div className={cx('questions-column')}>
//                         <Typography variant="h6" className={cx('section-title')}>
//                             CÂU HỎI NỔI BẬT
//                         </Typography>
//                         <ul className={cx('questions-list')}>
//                             <li>Trong lý thuyết độ thị, một độ thị có thể được biểu diễn bằng cách nào?</li>
//                             <li>Trong mô hình có số dữ liệu quan hệ, mỗi hàng trong bảng được gọi là gì?</li>
//                             <li>
//                                 Thuật toán tìm kiếm nhị phân (Binary Search) có độ phức tạp thời gian trung bình là bao
//                                 nhiêu?
//                             </li>
//                             <li>Hệ điều hành nào được xây là mã nguồn mở?</li>
//                             <li>Giao thức nào được dùng để vận chuyển (Transport Layer) trong mô hình OSI?</li>
//                             <li>Loại mã độc nào có thể tự sao chép và lây nhiễm mà không cần sự can thiệp của người</li>
//                         </ul>
//                     </div>
//                 </div>

//                 {/* Tests Section */}
//                 <div className={cx('tests-section')}>
//                     <Typography variant="h6" className={cx('section-title')}>
//                         ĐỀ <span>KIỂM TRA</span>
//                     </Typography>

//                     {!user ? (
//                         <Typography variant="body1" sx={{ mt: 2 }}>
//                             Vui lòng <Link to="/login">đăng nhập</Link> để xem các đề kiểm tra bạn đã tạo.
//                         </Typography>
//                     ) : filteredSubjects.length === 0 ? (
//                         <Typography variant="body1" sx={{ mt: 2 }}>
//                             Bạn chưa tạo đề kiểm tra nào. <Link to="/create-test">Tạo ngay</Link>!
//                         </Typography>
//                     ) : (
//                         <>
//                             <Tabs
//                                 value={tabValueTests}
//                                 onChange={handleTabChangeTests}
//                                 className={cx('tabs')}
//                                 sx={{
//                                     '& .MuiTabs-indicator': { display: 'none' },
//                                     minHeight: '32px',
//                                 }}
//                             >
//                                 {filteredSubjects.map((subject, index) => (
//                                     <Tab key={index} label={subject.TenMH} sx={tabStyles(index)} />
//                                 ))}
//                             </Tabs>

//                             <Box className={cx('tests-list')}>
//                                 {uniqueFilteredTests.length === 0 ? (
//                                     <Typography variant="body1" sx={{ mt: 2 }}>
//                                         Không có đề kiểm tra nào cho môn {filteredSubjects[tabValueTests]?.TenMH}.
//                                     </Typography>
//                                 ) : (
//                                     <div className={cx('tests-row')}>
//                                         {uniqueFilteredTests.map((test) => {
//                                             console.log('Rendering Test:', test); // Log mỗi test được render
//                                             return (
//                                                 <TestCard
//                                                     key={test.id}
//                                                     code={test.TenDe || `Mã đề #${test.id}`}
//                                                     testId={test.id}
//                                                 />
//                                             );
//                                         })}
//                                     </div>
//                                 )}
//                             </Box>
//                         </>
//                     )}

//                     <div className={cx('view-all')}>
//                         <button className={cx('view-all-btn')}>
//                             Xem tất cả
//                             <img src="/images/Arrow_Right.svg" alt="Arrow Right" />
//                         </button>
//                     </div>
//                 </div>

//                 {/* Majors Section */}
//                 <div className={cx('majors-section')}>
//                     <Typography variant="h6" className={cx('section-title')}>
//                         CÁC MÔN <span>CHUYÊN NGÀNH</span>
//                     </Typography>

//                     {faculties.map((faculty, index) => {
//                         // Lọc các môn học thuộc khoa này
//                         const relatedSubjects = subjects.filter((subject) => subject.MaKhoa === faculty.MaKhoa);

//                         return (
//                             <Accordion
//                                 key={index}
//                                 sx={{
//                                     backgroundColor: '#f5f5f5',
//                                     border: 'none',
//                                     boxShadow: 'none',
//                                 }}
//                             >
//                                 <AccordionSummary
//                                     expandIcon={<ExpandMoreIcon />}
//                                     sx={{
//                                         minHeight: '48px',
//                                         '& .MuiAccordionSummary-content': { margin: '0' },
//                                     }}
//                                 >
//                                     <Typography
//                                         sx={{
//                                             fontWeight: 500,
//                                             fontSize: '18px',
//                                             fontFamily: 'Roboto, sans-serif',
//                                             textTransform: 'uppercase',
//                                             color: '#333',
//                                             minWidth: '48px',
//                                             padding: '0',
//                                         }}
//                                     >
//                                         {faculty.TenKhoa}
//                                     </Typography>
//                                 </AccordionSummary>
//                                 <AccordionDetails
//                                     sx={{
//                                         padding: '20px',
//                                         backgroundColor: '#EAEAEA',
//                                         display: 'flex',
//                                         flexDirection: 'column',
//                                         gap: '20px',
//                                     }}
//                                 >
//                                     {relatedSubjects.length > 0 ? (
//                                         <Box
//                                             sx={{
//                                                 display: 'flex',
//                                                 flexWrap: 'wrap',
//                                                 justifyContent: 'space-between',
//                                                 gap: '10px',
//                                             }}
//                                         >
//                                             {relatedSubjects.map((subject, idx) => (
//                                                 <TopicBox
//                                                     key={idx}
//                                                     title={subject.TenMH}
//                                                     description={subject.GioiThieu || 'Không có mô tả'}
//                                                 />
//                                             ))}
//                                         </Box>
//                                     ) : (
//                                         <Typography>Không có môn học nào thuộc khoa này.</Typography>
//                                     )}
//                                 </AccordionDetails>
//                             </Accordion>
//                         );
//                     })}
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default MultipleChoice;
