import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames/bind';
import { TextField, Modal, Box, Button, Typography } from '@mui/material';
import { Alert } from 'antd';
import { login } from '../../redux/slices/authSlice';
import styles from './ProfilePage.module.scss';
import { mockApi } from '../../utils/mockAPI';

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

  // Lấy thông tin người dùng từ Redux
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // State để quản lý thông tin người dùng (cho phép chỉnh sửa)
  const [fullName, setFullName] = useState(user?.TenNguoiDung || '');
  const [birthDate, setBirthDate] = useState(user?.NgaySinh || '');
  const [phone, setPhone] = useState(user?.Sdt || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarFile, setAvatarFile] = useState(null);

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
      const isValidPassword = await mockApi.verifyCurrentPassword(user?.uid, oldPassword);
      if (!isValidPassword) {
        setError('Mật khẩu cũ không đúng');
        return;
      }

      const { otp: newOtp } = await mockApi.requestPasswordOtp(email);
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
      await mockApi.verifyPasswordOtp(email, otp);
      await mockApi.resetPassword(email, newPassword);
      const userInfo = await mockApi.loginWithEmail(email, newPassword);
      dispatch(login(userInfo));
      localStorage.setItem('accessToken', userInfo.token);
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

  // Hàm xử lý khi chọn file ảnh
  const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
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

      const updatedProfile = await mockApi.updateUserProfile(user?.uid, {
        TenNguoiDung: fullName,
        NgaySinh: birthDate,
        Sdt: phone,
        email,
        AnhDaiDien: avatarUrl,
      });

      // Cập nhật thông tin vào Redux
      const mergedUser = {
        ...user,
        ...updatedProfile,
        TenNguoiDung: fullName,
        NgaySinh: birthDate,
        Sdt: phone,
        email,
        AnhDaiDien: avatarUrl,
        token: user?.token || `mock-token-${updatedProfile.uid}`,
      };

      dispatch(login(mergedUser));

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
    <div className={cx('profile-page')}>
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

      <div className={cx('profile-page__info')}>
        <div className={cx('profile-page__info-left')}>
          <h4 className={cx('profile-page__info-left__title')}>Ảnh đại diện</h4>
          <img
            className={cx('profile-page__info-left__img')}
            src={avatarFile ? URL.createObjectURL(avatarFile) : user?.AnhDaiDien || '/images/no-image.jpg'}
            alt="Ảnh đại diện"
            onError={(e) => (e.target.src = '/images/no-image.jpg')}
          />
          <div className={cx('profile-page__info-left__input')}>
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </div>
          <button className={cx('profile-page__info-left__btn')} onClick={handleOpenModal}>
            Đổi mật khẩu
          </button>
        </div>

        <div className={cx('profile-page__info-right')}>
          <h4 className={cx('profile-page__info-right__title')}>Thông tin</h4>
          <div className={cx('profile-page__info-right__inputs')}>
            <TextField
              label="Họ và tên"
              placeholder="Nhập họ và tên"
              variant="outlined"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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
              placeholder="Nhập Ngày sinh"
              variant="outlined"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
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
              placeholder="Nhập Số điện thoại"
              variant="outlined"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
          <button className={cx('profile-page__info-right__btn')} onClick={handleUpdate}>
            Cập nhật
          </button>
        </div>
      </div>

      {/* Modal đổi mật khẩu */}
      <Modal open={openModal} onClose={handleCloseModal} className={cx('modal')}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 625,
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
              <Typography variant="h6" color="#00008b" sx={{ textAlign: 'center' }}>
                Đổi mật khẩu
              </Typography>

              <TextField
                label="Mật khẩu cũ"
                placeholder="Nhập mật khẩu cũ"
                type="password"
                variant="outlined"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
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
              >
                Tiếp tục
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body2" className={cx('otp')} sx={{ textAlign: 'center' }}>
                Mã OTP được gửi qua E-mail
              </Typography>

              <Typography variant="body2" className={cx('user-email')} sx={{ textAlign: 'center', color: 'red' }}>
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
              >
                Xác nhận
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
}

export default ProfilePage;
