import React, { useState } from 'react';
import classNames from 'classnames/bind';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { Checkbox } from 'antd';
import InputField from '../InputField/InputField';
import useToast from '../Toast/Toast';
import { authApi } from '@api/auth.api';
import styles from './LoginForm.module.scss';

const cx = classNames.bind(styles);

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { contextHolder, open: openToast } = useToast();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      try {
        const user = await authApi.login(email, password);
        return user;
      } catch (error) {
        const message = error?.response?.data?.error || 'Đăng nhập thất bại. Vui lòng thử lại.';
        throw new Error(message);
      }
    },
    onSuccess: (user) => {
      openToast({ message: 'Đăng nhập thành công!', variant: 'success' });
      setTimeout(() => {
        if (user?.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      }, 500);
    },
    onError: (error) => {
      openToast({ message: error.message, variant: 'danger' });
    },
  });

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    if (email !== 'Admin' && email !== 'admin@gmail.com') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrorMessage('Email không hợp lệ. Vui lòng nhập email đầy đủ (ví dụ: example@gmail.com).');
        return;
      }
    }

    loginMutation.mutate({ email, password });
  };

  return (
    <div className={cx('login-form')}>
      {contextHolder}

      <div className={cx('login-form__breadcrumb')}>
        <Link to="/">Trang chủ</Link> / <Link to="/account">Tài khoản</Link> / <span>Đăng nhập</span>
      </div>

      <form className={cx('login-form__card')} onSubmit={handleEmailLogin}>
        <div className={cx('login-form__banner')} style={{ backgroundImage: "url('/images/bialogin.jpg')" }}>
          <p className={cx('login-form__banner-title')}>
            Tra cứu điểm công tác xã hội dễ dàng tại <br />
            <span>HUIT SOCIAL CREDITS</span>
          </p>
        </div>

        <div className={cx('login-form__content')}>
          <p className={cx('login-form__greeting')}>Xin chào bạn !</p>
          <h4 className={cx('login-form__heading')}>Đăng nhập tài khoản</h4>

          <div className={cx('login-form__fields')}>
            <div className={cx('login-form__field')}>
              <InputField
                label="Email"
                placeholder="Nhập Email của bạn"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={cx('login-form__field')}>
              <InputField
                label="Mật khẩu"
                placeholder="Nhập mật khẩu của bạn"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errorMessage && <p className={cx('login-form__error')}>{errorMessage}</p>}
          </div>

          <div className={cx('login-form__meta')}>
            <label className={cx('login-form__remember')}>
              <Checkbox className={cx('login-form__checkbox')}>Lưu đăng nhập</Checkbox>
            </label>
            <label className={cx('login-form__forgot')}>
              <FontAwesomeIcon icon={faCircleQuestion} color={'#00008B'} size={'lg'} />
              <Link to="/forgot-password">Quên mật khẩu</Link>
            </label>
          </div>

          <div className={cx('login-form__actions')}>
            <button type="submit" className={cx('login-form__submit')} disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
