import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faPhone } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import InputField from '../InputField/InputField';
import styles from './ForgotPasswordForm.module.scss';
import { mockApi } from '@utils/mockAPI';
import useAuthStore from '../../stores/useAuthStore';

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
  const authLogin = useAuthStore((state) => state.login);

  const requestOtpMutation = useMutation({
    mutationFn: (emailValue) => mockApi.requestPasswordOtp(emailValue),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ email: emailValue, otp: otpValue }) => mockApi.verifyPasswordOtp(emailValue, otpValue),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ email: emailValue, password: passwordValue }) => mockApi.resetPassword(emailValue, passwordValue),
  });

  const loginAfterResetMutation = useMutation({
    mutationFn: ({ email: emailValue, password: passwordValue }) => mockApi.loginWithEmail(emailValue, passwordValue),
  });

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
      const { otp: newOtp } = await requestOtpMutation.mutateAsync(email);
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
      await verifyOtpMutation.mutateAsync({ email, otp });
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

    if (!confirmPassword) {
      setErrorMessage('Vui lòng xác nhận mật khẩu');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu và xác nhận mật khẩu không khớp.');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ email, password });
      const userInfo = await loginAfterResetMutation.mutateAsync({ email, password });
      authLogin(userInfo);
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
        navigate('/');
      }, 1500);
      return () => clearTimeout(redirectTimer);
    }
  }, [step, navigate]);

  // Gửi lại OTP
  const handleResendOtp = async () => {
    try {
      const { otp: newOtp } = await requestOtpMutation.mutateAsync(email);
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
              <button
                type="submit"
                className={cx('forgot-password__submit')}
                onClick={handleEmailSubmit}
                disabled={requestOtpMutation.isPending}
              >
                {requestOtpMutation.isPending ? 'Đang gửi...' : 'Tiếp tục'}
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
                <button
                  className={cx('forgot-password__resend')}
                  onClick={handleResendOtp}
                  type="button"
                  disabled={requestOtpMutation.isPending}
                >
                  <FontAwesomeIcon icon={faPhone} />
                  <span>{requestOtpMutation.isPending ? 'Đang gửi...' : 'Gửi lại mã mới'}</span>
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
              <button
                type="submit"
                className={cx('forgot-password__submit')}
                onClick={handleOtpSubmit}
                disabled={verifyOtpMutation.isPending}
              >
                {verifyOtpMutation.isPending ? 'Đang xác thực...' : 'Tiếp tục'}
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
              <button
                type="submit"
                className={cx('forgot-password__submit')}
                onClick={handlePasswordSubmit}
                disabled={resetPasswordMutation.isPending || loginAfterResetMutation.isPending}
              >
                {resetPasswordMutation.isPending || loginAfterResetMutation.isPending
                  ? 'Đang cập nhật...'
                  : 'Đổi mật khẩu'}
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
