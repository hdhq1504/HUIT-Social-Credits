import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faPhone } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames/bind';
import InputField from '../InputField/InputField';
import styles from './ForgotPasswordForm.module.scss';
import { authApi } from '@api/auth.api';

const cx = classNames.bind(styles);

const getErrorMessage = (error, fallback) => error?.response?.data?.error || error?.message || fallback;

function ForgotPasswordForm() {
  const [step, setStep] = useState(1); // 1: enter email, 2: enter OTP, 3: set new password, 4: success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const requestOtpMutation = useMutation({
    mutationFn: (emailValue) => authApi.requestPasswordReset(emailValue),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ email: emailValue, otp: otpValue }) => authApi.verifyPasswordResetOtp(emailValue, otpValue),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ email: emailValue, otp: otpValue, newPassword }) =>
      authApi.resetPasswordWithOtp(emailValue, otpValue, newPassword),
  });

  const loginAfterResetMutation = useMutation({
    mutationFn: ({ email: emailValue, password: passwordValue }) => authApi.login(emailValue, passwordValue),
  });

  // Kiểm tra email hợp lệ (simple regex)
  const validateEmail = (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  };

  // Xử lý gửi email để nhận OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage('Vui lòng nhập email của bạn');
      return;
    }
    if (!validateEmail(normalizedEmail)) {
      setErrorMessage('Email không hợp lệ. Vui lòng nhập lại.');
      return;
    }

    try {
      const { message } = await requestOtpMutation.mutateAsync(normalizedEmail);
      setEmail(normalizedEmail);
      setOtp('');
      setPassword('');
      setConfirmPassword('');
      setStep(2);
      setInfoMessage(message || 'Mã xác nhận đã được gửi, vui lòng kiểm tra email của bạn.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Không thể gửi OTP. Vui lòng thử lại.'));
    }
  };

  // Xử lý xác thực OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!otp.trim()) {
      setErrorMessage('Vui lòng nhập mã OTP');
      return;
    }

    try {
      const { message } = await verifyOtpMutation.mutateAsync({ email, otp: otp.trim() });
      setStep(3);
      setInfoMessage(message || 'Mã OTP hợp lệ. Vui lòng tạo mật khẩu mới.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Mã OTP không đúng. Vui lòng thử lại.'));
    }
  };

  // Xử lý đổi mật khẩu
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

    if (password.length < 8) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ email, otp: otp.trim(), newPassword: password });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.'));
      return;
    }

    setInfoMessage('Đổi mật khẩu thành công. Đang đăng nhập...');

    try {
      await loginAfterResetMutation.mutateAsync({ email, password });
      setStep(4);
      setInfoMessage('Đăng nhập thành công! Bạn sẽ được chuyển hướng trong giây lát.');
    } catch (error) {
      setInfoMessage('');
      setErrorMessage(
        getErrorMessage(error, 'Đặt lại mật khẩu thành công nhưng đăng nhập thất bại. Vui lòng đăng nhập lại.'),
      );
    }
  };

  // Redirect khi success (step === 4)
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
    setErrorMessage('');
    setInfoMessage('');
    if (!email) {
      setErrorMessage('Vui lòng nhập email trước khi yêu cầu mã OTP.');
      return;
    }

    try {
      const { message } = await requestOtpMutation.mutateAsync(email);
      setInfoMessage(message || 'Đã gửi lại mã OTP tới email của bạn.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Không thể gửi lại OTP. Vui lòng thử lại.'));
    }
  };

  // Toggle show/hide password
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Render theo từng step
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
