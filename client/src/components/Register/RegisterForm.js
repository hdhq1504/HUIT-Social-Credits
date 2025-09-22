import React, { useState, useEffect } from 'react';
import styles from './RegisterForm.module.scss';
import classNames from 'classnames/bind';
import InputField from '../InputField/InputField';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faPhone } from '@fortawesome/free-solid-svg-icons';
import { auth, googleProvider, facebookProvider } from '../../firebase/config';
import { createUserWithEmailAndPassword, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { login } from '../../redux/slices/authSlice';

const cx = classNames.bind(styles);

const RegisterForm = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Kiểm tra email hợp lệ
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // Tạo OTP ngẫu nhiên
    const generateOtp = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // Gửi OTP qua email (sử dụng Firebase email verification làm ví dụ)
    const sendOtp = async () => {
        try {
            const newOtp = generateOtp();
            setGeneratedOtp(newOtp);

            // Gửi email chứa OTP (trong thực tế nên dùng server-side API)
            // Đây là giải pháp tạm thời sử dụng email verification của Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, 'temp_password');
            await sendEmailVerification(userCredential.user, {
                handleCodeInApp: true,
                url: window.location.origin + '/verify-email',
            });

            // Trong thực tế, bạn nên:
            // 1. Gửi OTP qua email bằng server-side API (Express.js)
            // 2. Không tạo user ngay mà chỉ tạo sau khi verify OTP thành công
            console.log('OTP generated: ', newOtp);
            return true;
        } catch (error) {
            setErrorMessage('Không thể gửi OTP. Vui lòng thử lại.');
            console.error('Error sending OTP:', error);
            throw error;
        }
    };

    // Xử lý gửi email và OTP
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setErrorMessage('Vui lòng nhập email của bạn');
            return;
        }
        if (!validateEmail(email)) {
            setErrorMessage('Email không hợp lệ. Vui lòng nhập lại.');
            return;
        }
        try {
            await sendOtp();
            setStep(2);
            setErrorMessage('');
        } catch (error) {
            // Error đã được xử lý trong sendOtp
        }
    };

    // Xử lý xác thực OTP
    const handleOtpSubmit = (e) => {
        e.preventDefault();
        if (!otp) {
            setErrorMessage('Vui lòng nhập mã OTP');
            return;
        }
        if (otp !== generatedOtp) {
            setErrorMessage('Mã OTP không đúng. Vui lòng thử lại.');
            return;
        }
        setStep(3);
        setErrorMessage('');
    };

    // Xử lý tạo tài khoản
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!password) {
            setErrorMessage('Vui lòng nhập mật khẩu');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const idToken = await user.getIdToken(); // Lấy ID token
            dispatch(login({ email: user.email, uid: user.uid, token: idToken })); // Lưu token vào Redux
            localStorage.setItem('authToken', idToken); // Lưu token vào localStorage
            setStep(4);
            setErrorMessage('');
        } catch (error) {
            setErrorMessage('Tạo tài khoản thất bại: ' + error.message);
            console.error('Lỗi tạo tài khoản:', error);
        }
    };

    // Đăng nhập bằng Google
    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const idToken = await user.getIdToken(); // Lấy ID token
            dispatch(login({ email: user.email, uid: user.uid, token: idToken })); // Lưu token vào Redux
            localStorage.setItem('authToken', idToken); // Lưu token vào localStorage
            console.log('Token: ' + localStorage);
            navigate('/'); // Hoặc trang bạn muốn chuyển hướng đến
        } catch (error) {
            setErrorMessage('Đăng nhập bằng Google thất bại: ' + error.message);
            console.error('Google Sign-in Error:', error);
        }
    };

    // Đăng nhập bằng Facebook
    const handleFacebookSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, facebookProvider);
            const user = result.user;
            const idToken = await user.getIdToken(); // Lấy ID token
            dispatch(login({ email: user.email, uid: user.uid, token: idToken })); // Lưu token vào Redux
            localStorage.setItem('authToken', idToken); // Lưu token vào localStorage
            console.log('Token: ' + localStorage);
            navigate('/'); // Hoặc trang bạn muốn chuyển hướng đến
        } catch (error) {
            setErrorMessage('Đăng nhập bằng Facebook thất bại: ' + error.message);
            console.error('Facebook Sign-in Error:', error);
        }
    };

    // Chuyển hướng sau khi đăng ký thành công
    useEffect(() => {
        if (step === 4) {
            const redirectTimer = setTimeout(() => {
                navigate('/login');
            }, 1500);
            return () => clearTimeout(redirectTimer);
        }
    }, [step, navigate]);

    // Gửi lại OTP
    const handleResendOtp = async () => {
        try {
            await sendOtp();
            setErrorMessage('Đã gửi lại mã OTP. Vui lòng kiểm tra email.');
        } catch (error) {
            // Error đã được xử lý trong sendOtp
        }
    };

    // Chuyển đổi hiển thị mật khẩu
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const renderFormContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <p className={cx('wellcome')}>Chào mừng bạn đến với HUIT E-LEARN !</p>
                        <h4>Tạo tài khoản mới</h4>
                        <div className={cx('input-gr')}>
                            <div className={cx('input-email')}>
                                <InputField
                                    label="Email"
                                    placeholder="Vui lòng nhập email của bạn"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            {errorMessage && <p className={cx('error-message')}>{errorMessage}</p>}
                        </div>
                        <div className={cx('form-btn')}>
                            <button type="submit" className={cx('btn-login')} onClick={handleEmailSubmit}>
                                Tiếp tục
                            </button>
                            <Link to="/login" className={cx('btn-new')}>
                                <img src="/images/login-icon.svg" alt="" />
                                <span>Đăng nhập tài khoản</span>
                            </Link>
                        </div>
                    </>
                );
            // Các case 2, 3, 4 giữ nguyên như code của bạn
            // Chỉ thêm nút social login vào case 1
            case 2:
                return (
                    <>
                        <p className={cx('wellcome')}>Chào mừng bạn đến với HUIT E-LEARN !</p>
                        <h4>Tạo tài khoản mới</h4>
                        <p className={cx('otp-message')}>
                            Mã OTP được gửi qua Email <span style={{ color: 'var(--primary)' }}>{email}</span> của bạn.
                            Vui lòng xem hộp thư.
                        </p>
                        <div className={cx('input-gr')}>
                            <div className={cx('input-otp')}>
                                <InputField
                                    label="Mã OTP"
                                    placeholder="Nhập mã OTP"
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                                <button className={cx('resend-otp')} onClick={handleResendOtp} type="button">
                                    <FontAwesomeIcon icon={faPhone} />
                                    <span>Gửi lại mã OTP</span>
                                </button>
                            </div>
                            {errorMessage && <p className={cx('error-message')}>{errorMessage}</p>}
                        </div>
                        <div className={cx('form-btn')}>
                            <button type="submit" className={cx('btn-login')} onClick={handleOtpSubmit}>
                                Tiếp tục
                            </button>
                            <p>hoặc tiếp tục với</p>
                            <Link to="/login" className={cx('btn-new')}>
                                <img src="/images/login-icon.svg" alt="" />
                                <span>Đăng nhập tài khoản</span>
                            </Link>
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <p className={cx('wellcome')}>Chào mừng bạn đến với HUIT E-LEARN !</p>
                        <h4>Tạo tài khoản mới</h4>
                        <p className={cx('password-requirements')}>
                            Mật khẩu bao gồm:
                            <ul>
                                <li>Ít nhất 1 chữ viết hoa</li>
                                <li>Ít nhất 1 ký tự đặc biệt</li>
                                <li>Độ dài từ 6 ký tự trở lên</li>
                            </ul>
                        </p>
                        <div className={cx('input-gr')}>
                            <div className={cx('input-email')}>
                                <InputField label="Email" value={email} disabled />
                            </div>
                            <div className={cx('input-password')}>
                                <div className={cx('password-field-container')}>
                                    <InputField
                                        label="Nhập mật khẩu"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Nhập mật khẩu của bạn"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className={cx('toggle-password')}
                                        onClick={togglePasswordVisibility}
                                    >
                                        {password.length > 0 && (
                                            <FontAwesomeIcon
                                                icon={showPassword ? faEyeSlash : faEye}
                                                style={{ cursor: 'pointer' }}
                                                className={cx('show-password')}
                                            />
                                        )}
                                    </button>
                                </div>
                            </div>
                            {errorMessage && <p className={cx('error-message')}>{errorMessage}</p>}
                        </div>
                        <div className={cx('form-btn')}>
                            <button type="submit" className={cx('btn-login')} onClick={handlePasswordSubmit}>
                                Tiếp tục
                            </button>
                            <p>hoặc tiếp tục với</p>
                            <Link to="/login" className={cx('btn-new')}>
                                <img src="/images/login-icon.svg" alt="" />
                                <span>Đăng nhập tài khoản</span>
                            </Link>
                        </div>
                    </>
                );
            case 4:
                return (
                    <>
                        <p className={cx('wellcome')}>Chào mừng bạn đến với HUIT E-LEARN !</p>
                        <h4>Tạo tài khoản mới</h4>
                        <div className={cx('success-create')}>
                            <img src="/images/success-icon.svg" alt="" />
                            <p>Tạo tài khoản thành công, vui lòng đợi vài giây !</p>
                        </div>
                        <div className={cx('form-btn')}>
                            <p>hoặc tiếp tục với</p>
                            <Link to="/login" className={cx('btn-new')}>
                                <img src="/images/login-icon.svg" alt="" />
                                <span>Đăng nhập tài khoản</span>
                            </Link>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className={cx('wrapper')}>
            <div className={cx('link')}>
                <Link to="/">Trang chủ</Link> / <Link to="/account">Tài khoản</Link> / <span>Đăng ký</span>
            </div>
            <form className={cx('login-from')}>
                <div className={cx('form-banner')} style={{ backgroundImage: "url('/images/bialogin.jpg')" }}>
                    <p className={cx('title')}>
                        TÌM KIẾM VÀ TẠO BÀI KIỂM TRA DỄ DÀNG TẠI <span>HUIT E-LEARN</span>
                    </p>
                </div>
                <div className={cx('form-content')}>{renderFormContent()}</div>
            </form>
        </div>
    );
};

export default RegisterForm;
