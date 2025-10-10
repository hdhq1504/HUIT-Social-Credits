import React, { useState, useEffect } from 'react';
import styles from './ForgotPasswordForm.module.scss';
import classNames from 'classnames/bind';
import InputField from '../InputField/InputField';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { Phone } from 'lucide-react';
zz
import { login } from '../../redux/slices/authSlice';
import { mockApi } from '../../utils/mockAPI';

const cx = classNames.bind(styles);

function ForgotPasswordForm() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Kiểm tra email hợp lệ
  const validateEmail = (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  };

  // Xử lý gửi email và OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!email) {
      setErrorMessage('Vui lòng nhập email của bạn');
      return;
    }
    if (!validateEmail(email)) {
      setErrorMessage('Email không hợp lệ. Vui lòng nhập lại.');
      return;
    }

    try {
      const { otp: newOtp } = await mockApi.requestPasswordOtp(email);
      setGeneratedOtp(newOtp);
      setStep(2);
      setInfoMessage(`Mã OTP đã được gửi tới email. (Mã mô phỏng: ${newOtp})`);
    } catch (error) {
      const message = error?.message || 'Không thể gửi OTP. Vui lòng thử lại.';
      setErrorMessage(message);
    }
  };

  // Xử lý xác thực OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!otp) {
      setErrorMessage('Vui lòng nhập mã OTP');
      return;
    }

    try {
      await mockApi.verifyPasswordOtp(email, otp);
      setStep(3);
      setInfoMessage('Mã OTP hợp lệ. Vui lòng tạo mật khẩu mới.');
    } catch (error) {
      const message = error?.message || 'Mã OTP không đúng. Vui lòng thử lại.';
      setErrorMessage(message);
    }
  };

  // Xử lý đặt lại mật khẩu
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      await mockApi.resetPassword(email, password);
      const userInfo = await mockApi.loginWithEmail(email, password);
      dispatch(login(userInfo));
      localStorage.setItem('accessToken', userInfo.token);
      setStep(4);
      setInfoMessage('Đặt lại mật khẩu thành công! Bạn sẽ được chuyển đến trang đăng nhập.');
    } catch (error) {
      const message = error?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
      setErrorMessage(message);
    }
  };

  // Chuyển hướng sau khi đặt lại thành công
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
      const { otp: newOtp } = await mockApi.requestPasswordOtp(email);
      setGeneratedOtp(newOtp);
      setErrorMessage('');
      setInfoMessage(`Đã gửi lại mã OTP. (Mã mô phỏng: ${newOtp})`);
    } catch (error) {
      const message = error?.message || 'Không thể gửi OTP. Vui lòng thử lại.';
      setErrorMessage(message);
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
            <p className={cx('forgot-password__greeting')}>Tiếc quá nhỉ!</p>
            <h4>Quên mật khẩu</h4>
            <div className={cx('forgot-password__fields')}>
              <div className={cx('forgot-password__field')}>
                <InputField
                  label="Email"
                  placeholder="Vui lòng nhập email của bạn"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errorMessage && <p className={cx('forgot-password__error')}>{errorMessage}</p>}
              {infoMessage && (
                <p className={cx('forgot-password__error')} style={{ color: '#2e7d32' }}>
                  {infoMessage}
                </p>
              )}
            </div>
            <div className={cx('forgot-password__actions')}>
              <button type="submit" className={cx('forgot-password__submit')} onClick={handleEmailSubmit}>
                Tiếp tục
              </button>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <p className={cx('forgot-password__greeting')}>Tiếc quá nhỉ!</p>
            <h4>Quên mật khẩu</h4>
            <p className={cx('forgot-password__otp-message')}>
              Mã xác thực được gửi qua Email <span style={{ color: 'var(--primary-color)' }}>{email}</span> của bạn. Vui
              lòng kiểm tra hộp thư.
            </p>
            <div className={cx('forgot-password__fields')}>
              <div className={cx('forgot-password__field', 'forgot-password__field--otp')}>
                <InputField
                  label="Mã OTP"
                  placeholder="Nhập mã xác thực bạn nhận được"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button className={cx('forgot-password__resend')} onClick={handleResendOtp} type="button">
                  <Phone size={14} />
                  <span>Gửi lại mã mới</span>
                </button>
              </div>
              {generatedOtp && (
                <p className={cx('forgot-password__error')} style={{ color: '#2e7d32' }}>
                  Mã OTP mô phỏng: {generatedOtp}
                </p>
              )}
              {errorMessage && <p className={cx('forgot-password__error')}>{errorMessage}</p>}
              {infoMessage && (
                <p className={cx('forgot-password__error')} style={{ color: '#2e7d32' }}>
                  {infoMessage}
                </p>
              )}
            </div>
            <div className={cx('forgot-password__actions')}>
              <button type="submit" className={cx('forgot-password__submit')} onClick={handleOtpSubmit}>
                Tiếp tục
              </button>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <p className={cx('forgot-password__greeting')}>Tiếc quá nhỉ!</p>
            <h4>Quên mật khẩu</h4>
            <p className={cx('forgot-password__password-rules')}>
              Mật khẩu bao gồm:
              <ul>
                <li>1 kí tự chữ viết hoa trở lên</li>
                <li>1 kí tự đặc biệt trở lên</li>
                <li>Độ dài từ 6 ký tự trở lên</li>
              </ul>
            </p>
            <div className={cx('forgot-password__fields')}>
              <div className={cx('forgot-password__field', 'forgot-password__field--password')}>
                <InputField
                  label="Đặt mật khẩu mới"
                  placeholder="Nhập mật khẩu của bạn muốn đặt"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={
                    <FontAwesomeIcon
                      icon={showPassword ? faEyeSlash : faEye}
                      onClick={togglePasswordVisibility}
                      className={cx('forgot-password__password-toggle')}
                    />
                  }
                />
              </div>
              <div className={cx('forgot-password__field')}>
                <InputField
                  label="Nhập lại mật khẩu"
                  placeholder="Nhập lại mật khẩu của bạn vừa nhập"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={
                    <FontAwesomeIcon
                      icon={showPassword ? faEyeSlash : faEye}
                      onClick={togglePasswordVisibility}
                      className={cx('forgot-password__password-toggle')}
                    />
                  }
                />
              </div>
              {errorMessage && <p className={cx('forgot-password__error')}>{errorMessage}</p>}
              {infoMessage && (
                <p className={cx('forgot-password__error')} style={{ color: '#2e7d32' }}>
                  {infoMessage}
                </p>
              )}
            </div>
            <div className={cx('forgot-password__actions')}>
              <button type="submit" className={cx('forgot-password__submit')} onClick={handlePasswordSubmit}>
                Đổi mật khẩu
              </button>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <div className={cx('forgot-password__success')}>
              <img src="/images/success-icon.svg" alt="" />
              <p>Cấp lại mật khẩu thành công, vui lòng đợi vài giây !</p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cx('forgot-password')}>
      <div className={cx('forgot-password__breadcrumb')}>
        <Link to="/">Trang chủ</Link> / <Link to="/account">Tài khoản</Link> / <span>Quên mật khẩu</span>
      </div>
      <form className={cx('forgot-password__card')} onSubmit={(e) => e.preventDefault()}>
        <div className={cx('forgot-password__banner')} style={{ backgroundImage: "url('/images/bialogin.jpg')" }}>
          <p className={cx('forgot-password__banner-title')}>
            Tra cứu điểm công tác xã hội dễ dàng tại <br />
            <span>HUIT SOCIAL CREDITS</span>
          </p>
        </div>
        <div className={cx('forgot-password__content')}>{renderFormContent()}</div>
      </form>
    </div>
  );
}

export default ForgotPasswordForm;
