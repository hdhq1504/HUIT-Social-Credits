import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { TextField, Modal, Box, Button, Typography } from '@mui/material';
import { Alert } from 'antd';
import Label from '@components/Label/Label';
import styles from './ProfilePage.module.scss';
import useAuthStore from '@stores/useAuthStore';
import { mockApi } from '@utils/mockAPI';

const cx = classNames.bind(styles);

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function ProfilePage() {
  const [openModal, setOpenModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

  // Lấy thông tin người dùng từ Zustand
  const user = useAuthStore((state) => state.user);
  const loginUser = useAuthStore((state) => state.login);
  const updateUserStore = useAuthStore((state) => state.updateUser);

  // State để quản lý thông tin người dùng (cho phép chỉnh sửa)
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('/images/no-image.jpg');

  const verifyCurrentPasswordMutation = useMutation({
    mutationFn: ({ userId, password: passwordValue }) => mockApi.verifyCurrentPassword(userId, passwordValue),
  });

  const requestOtpMutation = useMutation({
    mutationFn: (emailValue) => mockApi.requestPasswordOtp(emailValue),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ email: emailValue, otp: otpValue }) => mockApi.verifyPasswordOtp(emailValue, otpValue),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ email: emailValue, newPassword }) => mockApi.resetPassword(emailValue, newPassword),
  });

  const loginAfterResetMutation = useMutation({
    mutationFn: ({ email: emailValue, password: passwordValue }) => mockApi.loginWithEmail(emailValue, passwordValue),
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ userId, payload }) => mockApi.updateUserProfile(userId, payload),
  });

  useEffect(() => {
    if (user) {
      setFullName(user.TenNguoiDung || '');
      setBirthDate(user.NgaySinh || '');
      setPhone(user.Sdt || '');
      setEmail(user.email || '');
      setAvatarPreview(user.AnhDaiDien || '/images/no-image.jpg');
    } else {
      setFullName('');
      setBirthDate('');
      setPhone('');
      setEmail('');
      setAvatarPreview('/images/no-image.jpg');
    }
  }, [user]);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(user?.AnhDaiDien || '/images/no-image.jpg');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [avatarFile, user]);

  // Hàm mở modal
  const handleOpenModal = () => {
    setOpenModal(true);
    setOtpSent(false);
    setError('');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setGeneratedOtp('');
  };

  // Hàm đóng modal
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Hàm kiểm tra và gửi mã OTP
  const handleSendOtp = async () => {
    if (!oldPassword) {
      setError('Vui lòng nhập mật khẩu cũ');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError('Vui lòng nhập mật khẩu mới và xác nhận mật khẩu');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    try {
      if (!user?.uid) {
        setError('Không tìm thấy thông tin người dùng.');
        return;
      }

      const isValidPassword = await verifyCurrentPasswordMutation.mutateAsync({
        userId: user.uid,
        password: oldPassword,
      });

      if (!isValidPassword) {
        setError('Mật khẩu cũ không đúng');
        return;
      }

      const { otp: newOtp } = await requestOtpMutation.mutateAsync(email);
      setGeneratedOtp(newOtp);
      setOtpSent(true);
      setError('');
    } catch (err) {
      const message = err?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.';
      setError(message);
    }
  };

  // Hàm xử lý xác nhận đổi mật khẩu
  const handleSubmit = async () => {
    if (!otp) {
      setError('Vui lòng nhập mã OTP');
      return;
    }

    try {
      await verifyOtpMutation.mutateAsync({ email, otp });
      await resetPasswordMutation.mutateAsync({ email, newPassword });
      const userInfo = await loginAfterResetMutation.mutateAsync({ email, password: newPassword });
      loginUser(userInfo);
      setShowAlert(true);
      setAlertMessage('Đổi mật khẩu thành công');
      setAlertType('success');
      setError('');
      setOpenModal(false);
    } catch (err) {
      const message = err?.message || 'Xác thực OTP thất bại. Vui lòng thử lại.';
      setError(message);
    }
  };

  // Hàm cập nhật thông tin người dùng
  const handleUpdate = async () => {
    try {
      // Kiểm tra các trường bắt buộc
      if (!fullName || !birthDate || !phone || !email) {
        setShowAlert(true);
        setAlertMessage('Vui lòng điền đầy đủ thông tin');
        setAlertType('error');
        return;
      }

      // Kiểm tra định dạng email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setShowAlert(true);
        setAlertMessage('Email không hợp lệ');
        setAlertType('error');
        return;
      }

      // Kiểm tra định dạng số điện thoại
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        setShowAlert(true);
        setAlertMessage('Số điện thoại không hợp lệ (phải có 10 chữ số)');
        setAlertType('error');
        return;
      }

      // Tải ảnh đại diện lên Firebase Storage nếu có
      let avatarUrl = user?.AnhDaiDien || '';
      if (avatarFile) {
        avatarUrl = await fileToBase64(avatarFile);
      }

      if (!user?.uid) {
        setShowAlert(true);
        setAlertMessage('Không tìm thấy thông tin người dùng để cập nhật.');
        setAlertType('error');
        return;
      }

      const updatedProfile = await updateProfileMutation.mutateAsync({
        userId: user.uid,
        payload: {
          TenNguoiDung: fullName,
          NgaySinh: birthDate,
          Sdt: phone,
          email,
          AnhDaiDien: avatarUrl,
        },
      });

      // Cập nhật thông tin vào Zustand
      const mergedUser = {
        ...user,
        ...updatedProfile,
        TenNguoiDung: fullName,
        NgaySinh: birthDate,
        Sdt: phone,
        email,
        AnhDaiDien: avatarUrl,
        token: user?.token || `mock-token-${updatedProfile.uid || user.uid}`,
      };

      updateUserStore(mergedUser);

      // Hiển thị thông báo thành công
      setShowAlert(true);
      setAlertMessage('Cập nhật thông tin thành công');
      setAlertType('success');
      setAvatarFile(null);
    } catch (err) {
      console.error('Lỗi khi cập nhật thông tin:', err);
      setShowAlert(true);
      setAlertMessage('Cập nhật thông tin thất bại');
      setAlertType('error');
    }
  };

  return (
    <main className={cx('profile-page')}>
      {/* Hiển thị Alert */}
      {showAlert && (
        <Alert
          message={alertMessage}
          type={alertType}
          showIcon
          onClose={() => setShowAlert(false)}
          closable
          className={cx('profile-page__alert')}
        />
      )}

      <header className={cx('profile-page__header')}>
        <nav className={cx('profile-page__breadcrumb')} aria-label="Breadcrumb">
          <Link to="/">Trang chủ</Link> / <span>Thông tin</span>
        </nav>

        <Label title="Thông tin" highlight="sinh viên" leftDivider={false} rightDivider showSubtitle={false} />
      </header>

      <section className={cx('profile-page__content')}>
        <div className={cx('profile-page__media')}>
          <h4 className={cx('profile-page__media-title')}>Ảnh đại diện</h4>
          <div className={cx('profile-page__media-preview')}>
            <img
              className={cx('profile-page__media-image')}
              src={avatarPreview}
              alt="Ảnh đại diện"
              onError={(e) => (e.target.src = '/images/no-image.jpg')}
            />
          </div>
          <button type="button" className={cx('profile-page__media-button')} onClick={handleOpenModal}>
            Đổi mật khẩu
          </button>
        </div>

        <section className={cx('profile-page__form')}>
          <h4 className={cx('profile-page__form-title')}>Thông tin</h4>
          <div className={cx('profile-page__form-fields')}>
            <TextField
              label="Họ và tên"
              placeholder="Nhập họ và tên"
              variant="outlined"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00008b',
                    borderWidth: '2px',
                  },
                },
              }}
            />
            <TextField
              label="Ngày sinh"
              placeholder="Nhập ngày sinh"
              variant="outlined"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00008b',
                    borderWidth: '2px',
                  },
                },
              }}
            />
            <TextField
              label="Số điện thoại"
              placeholder="Nhập số điện thoại"
              variant="outlined"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00008b',
                    borderWidth: '2px',
                  },
                },
              }}
            />
            <TextField
              label="Email"
              placeholder="Nhập email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00008b',
                    borderWidth: '2px',
                  },
                },
              }}
            />
          </div>
          <button
            type="button"
            className={cx('profile-page__form-submit')}
            onClick={handleUpdate}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? 'Đang lưu...' : 'Cập nhật'}
          </button>
        </section>
      </section>

      {/* Modal đổi mật khẩu */}
      <Modal open={openModal} onClose={handleCloseModal} className={cx('profile-page__modal')}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: 625,
            bgcolor: '#eeeefe',
            borderRadius: '8px',
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflow: 'auto',
          }}
        >
          {!otpSent ? (
            <>
              <Typography variant="h6" className={cx('profile-page__modal-title')} sx={{ textAlign: 'center' }}>
                Đổi mật khẩu
              </Typography>

              <TextField
                label="Mật khẩu cũ"
                placeholder="Nhập mật khẩu cũ"
                type="password"
                variant="outlined"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00008b',
                      borderWidth: '2px',
                    },
                  },
                }}
              />

              <TextField
                label="Mật khẩu mới"
                placeholder="Nhập mật khẩu mới"
                type="password"
                variant="outlined"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00008b',
                      borderWidth: '2px',
                    },
                  },
                }}
              />

              <TextField
                label="Xác nhận mật khẩu mới"
                placeholder="Xác nhận mật khẩu mới"
                type="password"
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00008b',
                      borderWidth: '2px',
                    },
                  },
                }}
              />

              {error && (
                <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
                  {error}
                </Typography>
              )}

              <Button
                variant="contained"
                sx={{
                  bgcolor: '#00008b',
                  color: 'white',
                  mt: 2,
                  width: '120px',
                  height: '32px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  display: 'block',
                  margin: '0 auto',
                }}
                onClick={handleSendOtp}
                disabled={verifyCurrentPasswordMutation.isPending || requestOtpMutation.isPending}
              >
                {verifyCurrentPasswordMutation.isPending || requestOtpMutation.isPending ? 'Đang xử lý...' : 'Tiếp tục'}
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body2" className={cx('profile-page__modal-note')} sx={{ textAlign: 'center' }}>
                Mã OTP được gửi qua E-mail
              </Typography>

              <Typography variant="body2" className={cx('profile-page__modal-email')} sx={{ textAlign: 'center' }}>
                {email || 'Không có email'}
              </Typography>

              <TextField
                label="Nhập mã OTP"
                placeholder="Nhập mã OTP"
                variant="outlined"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00008b',
                      borderWidth: '2px',
                    },
                  },
                }}
              />

              {generatedOtp && (
                <Typography variant="body2" sx={{ textAlign: 'center', color: '#2e7d32' }}>
                  Mã OTP mô phỏng: {generatedOtp}
                </Typography>
              )}

              {error && (
                <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
                  {error}
                </Typography>
              )}

              <Button
                variant="contained"
                sx={{
                  bgcolor: '#00008b',
                  color: 'white',
                  mt: 2,
                  width: '120px',
                  height: '32px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  display: 'block',
                  margin: '10px auto 0 auto',
                }}
                onClick={handleSubmit}
                disabled={
                  verifyOtpMutation.isPending || resetPasswordMutation.isPending || loginAfterResetMutation.isPending
                }
              >
                {verifyOtpMutation.isPending || resetPasswordMutation.isPending || loginAfterResetMutation.isPending
                  ? 'Đang xử lý...'
                  : 'Xác nhận'}
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </main>
  );
}

export default ProfilePage;
