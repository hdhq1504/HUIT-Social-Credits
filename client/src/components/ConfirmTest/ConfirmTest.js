import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Box, TextField, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';
import classNames from 'classnames/bind';
import styles from './ConfirmTest.module.scss';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

const ConfirmTest = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    const handleStartTest = () => {
        // Chuyển hướng sang trang làm bài, truyền dữ liệu form
        navigate('/assignment', { state });
    };

    // Custom MenuProps để giữ giao diện nhất quán với CreateTest
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
                <Link to="/">Trang chủ</Link> / <Link to="#">Xác nhận bài kiểm tra</Link>
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
                    <h3 className={cx('title')}>Xác nhận bài kiểm tra</h3>

                    <FormControl fullWidth>
                        <InputLabel>Khoa chuyên ngành</InputLabel>
                        <Select
                            value={state?.specialty || ''}
                            label="Khoa chuyên ngành"
                            disabled
                            MenuProps={menuProps}
                            sx={{
                                backgroundColor: '#fff',
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#00008b',
                                    borderWidth: '2px',
                                },
                            }}
                        >
                            <MenuItem value={state?.specialty}>{state?.specialty}</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Môn học</InputLabel>
                        <Select
                            value={state?.subject || ''}
                            label="Môn học"
                            disabled
                            MenuProps={menuProps}
                            sx={{
                                backgroundColor: '#fff',
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#00008b',
                                    borderWidth: '2px',
                                },
                            }}
                        >
                            <MenuItem value={state?.subject}>{state?.subject}</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Độ khó</InputLabel>
                        <Select
                            value={state?.difficulty || ''}
                            label="Độ khó"
                            disabled
                            MenuProps={menuProps}
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
                        label="Số lượng câu hỏi"
                        type="number"
                        value={state?.questionCount || ''}
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
                        label="Thiết lập thời gian (phút)"
                        type="number"
                        value={state?.testTime || ''}
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
                            value={state?.creationMethod || ''}
                            label="Chọn cách tạo"
                            disabled
                            MenuProps={menuProps}
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
                    <button className={cx('btn-submit')} onClick={handleStartTest}>
                        Làm bài
                    </button>
                </Box>
            </Container>
        </div>
    );
};

export default ConfirmTest;
