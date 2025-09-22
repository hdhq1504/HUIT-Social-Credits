import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, TextField, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';
import classNames from 'classnames/bind';
import styles from './CreateTest.module.scss';
import { Link } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const cx = classNames.bind(styles);

const CreateTest = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        specialty: '',
        specialtyName: '',
        subject: '',
        subjectName: '',
        difficulty: '',
        questionCount: '',
        testTime: '',
        creationMethod: '',
    });
    const [faculties, setFaculties] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [isConfirmMode, setIsConfirmMode] = useState(false);

    // Lấy danh sách khoa từ Firestore
    useEffect(() => {
        const fetchFaculties = async () => {
            try {
                const facultiesSnapshot = await getDocs(collection(db, 'faculties'));
                const facultiesList = facultiesSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setFaculties(facultiesList);
            } catch (error) {
                console.error('Lỗi khi lấy danh sách khoa:', error);
            }
        };
        fetchFaculties();
    }, []);

    // Lấy danh sách môn học dựa trên khoa đã chọn
    useEffect(() => {
        const fetchSubjects = async () => {
            if (formData.specialty) {
                try {
                    const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
                    const subjectsList = subjectsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    const filteredSubjects = subjectsList.filter((subject) => subject.MaKhoa === formData.specialty);
                    setSubjects(filteredSubjects);
                } catch (error) {
                    console.error('Lỗi khi lấy danh sách môn học:', error);
                }
            } else {
                setSubjects([]);
            }
        };
        fetchSubjects();
    }, [formData.specialty]);

    // Tự động cập nhật số lượng câu hỏi và thời gian dựa trên độ khó
    useEffect(() => {
        if (formData.difficulty) {
            let questionCount, testTime;
            switch (formData.difficulty) {
                case 'easy':
                    questionCount = 30;
                    testTime = 20;
                    break;
                case 'medium':
                    questionCount = 40;
                    testTime = 35;
                    break;
                case 'hard':
                    questionCount = 50;
                    testTime = 60;
                    break;
                default:
                    questionCount = '';
                    testTime = '';
            }
            setFormData((prevState) => ({
                ...prevState,
                questionCount,
                testTime,
            }));
        }
    }, [formData.difficulty]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'specialty') {
            const selectedFaculty = faculties.find((faculty) => faculty.MaKhoa === value);
            setFormData((prevState) => ({
                ...prevState,
                specialty: value,
                specialtyName: selectedFaculty ? selectedFaculty.TenKhoa : '',
                subject: '',
                subjectName: '',
            }));
        } else if (name === 'subject') {
            const selectedSubject = subjects.find((subject) => subject.MaMH === value);
            setFormData((prevState) => ({
                ...prevState,
                subject: value,
                subjectName: selectedSubject ? selectedSubject.TenMH : '',
            }));
        } else {
            setFormData((prevState) => ({
                ...prevState,
                [name]: value,
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsConfirmMode(true);
    };

    const handleStartTest = () => {
        // Truyền dữ liệu formData qua state
        navigate('/assignment', { state: formData });
    };

    const handleBackToCreate = () => {
        setIsConfirmMode(false);
    };

    const menuProps = {
        PaperProps: {
            style: {
                width: 'auto',
            },
        },
        disableScrollLock: true,
        anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'left',
        },
        transformOrigin: {
            vertical: 'top',
            horizontal: 'left',
        },
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('link')}>
                <Link to="/">Trang chủ</Link> / <Link to="#">Tạo bài kiểm tra ngẫu nhiên</Link>
            </div>
            <Container
                className={cx('form-test')}
                sx={{
                    '& .MuiBox-root': {
                        boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.12)',
                    },
                }}
            >
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                        paddingBottom: 4,
                        paddingTop: 4,
                        paddingLeft: 6,
                        paddingRight: 6,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        boxShadow: 1,
                        backgroundColor: '#EEEEFE',
                    }}
                >
                    <h3 className={cx('title')}>
                        {isConfirmMode ? 'Xác nhận bài kiểm tra' : 'Tạo bài kiểm tra ngẫu nhiên'}
                    </h3>

                    <FormControl fullWidth>
                        <InputLabel>Khoa chuyên ngành</InputLabel>
                        <Select
                            name="specialty"
                            value={formData.specialty}
                            label="Khoa chuyên ngành"
                            onChange={handleChange}
                            MenuProps={menuProps}
                            disabled={isConfirmMode}
                            sx={{
                                backgroundColor: '#fff',
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#00008b',
                                    borderWidth: '2px',
                                },
                            }}
                        >
                            {isConfirmMode ? (
                                <MenuItem value={formData.specialty}>{formData.specialtyName}</MenuItem>
                            ) : (
                                faculties.map((faculty) => (
                                    <MenuItem key={faculty.id} value={faculty.MaKhoa}>
                                        {faculty.TenKhoa}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Môn học</InputLabel>
                        <Select
                            name="subject"
                            value={formData.subject}
                            label="Môn học"
                            onChange={handleChange}
                            MenuProps={menuProps}
                            disabled={isConfirmMode || !formData.specialty}
                            sx={{
                                backgroundColor: '#fff',
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#00008b',
                                    borderWidth: '2px',
                                },
                            }}
                        >
                            {isConfirmMode ? (
                                <MenuItem value={formData.subject}>{formData.subjectName}</MenuItem>
                            ) : (
                                subjects.map((subject) => (
                                    <MenuItem key={subject.id} value={subject.MaMH}>
                                        {subject.TenMH}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Độ khó</InputLabel>
                        <Select
                            name="difficulty"
                            value={formData.difficulty}
                            label="Độ khó"
                            onChange={handleChange}
                            MenuProps={menuProps}
                            disabled={isConfirmMode}
                            sx={{
                                backgroundColor: '#fff',
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#00008b',
                                    borderWidth: '2px',
                                },
                            }}
                        >
                            <MenuItem value="easy">Dễ</MenuItem>
                            <MenuItem value="medium">Trung bình</MenuItem>
                            <MenuItem value="hard">Khó</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        name="questionCount"
                        label="Số lượng câu hỏi"
                        type="number"
                        value={formData.questionCount}
                        variant="outlined"
                        InputProps={{
                            readOnly: true,
                        }}
                        sx={{
                            backgroundColor: '#fff',
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: 'rgba(0, 0, 0, 0.23)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(0, 0, 0, 0.87)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#00008b',
                                    borderWidth: '2px',
                                },
                            },
                        }}
                    />

                    <TextField
                        fullWidth
                        name="testTime"
                        label="Thiết lập thời gian (phút)"
                        type="number"
                        value={formData.testTime}
                        variant="outlined"
                        InputProps={{
                            readOnly: true,
                        }}
                        sx={{
                            backgroundColor: '#fff',
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: 'rgba(0, 0, 0, 0.23)',
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(0, 0, 0, 0.87)',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#00008b',
                                    borderWidth: '2px',
                                },
                            },
                        }}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Chọn cách tạo</InputLabel>
                        <Select
                            name="creationMethod"
                            value={formData.creationMethod}
                            label="Chọn cách tạo"
                            onChange={handleChange}
                            MenuProps={menuProps}
                            disabled={isConfirmMode}
                            sx={{
                                backgroundColor: '#fff',
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#00008b',
                                    borderWidth: '2px',
                                },
                            }}
                        >
                            <MenuItem value="ai">Tạo câu từ AI</MenuItem>
                            <MenuItem value="bank">Tạo câu từ ngân hàng câu hỏi</MenuItem>
                        </Select>
                    </FormControl>

                    {isConfirmMode ? (
                        <div className={cx('actions')}>
                            <div>
                                <button className={cx('btn-back')} onClick={handleBackToCreate} sx={{ marginRight: 2 }}>
                                    Quay lại
                                </button>
                                <button className={cx('btn-next')} onClick={handleStartTest}>
                                    Làm bài
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button className={cx('btn-submit')} type="submit">
                            Tiếp tục
                        </button>
                    )}
                </Box>
            </Container>
        </div>
    );
};

export default CreateTest;
