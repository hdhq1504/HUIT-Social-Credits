import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { TextField, Modal, Box, Button, Typography } from '@mui/material';
import useToast from '@components/Toast/Toast';
import Label from '@components/Label/Label';
import styles from './ProfilePage.module.scss';
import useAuthStore from '@stores/useAuthStore';
import { mockApi } from '@utils/mockAPI';
import { message } from 'antd';

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

  // Lấy thông tin người dùng từ Zustand
  const user = useAuthStore((state) => state.user);
  const loginUser = useAuthStore((state) => state.login);
  const updateUserStore = useAuthStore((state) => state.updateUser);

  // State để quản lý thông tin người dùng (cho phép chỉnh sửa)
  const [mssv, setMssv] = useState('');
  const [fullName, setFullName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('/images/no-image.jpg');
  const { contextHolder, open: openToast } = useToast();

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
      setMssv(user.MSSV || '');
      setFullName(user.TenNguoiDung || '');
      setClassCode(user.Lop || '');
      setBirthDate(user.NgaySinh || '');
      setPhone(user.Sdt || '');
      setEmail(user.email || '');
      setAvatarPreview(user.AnhDaiDien || '/images/no-image.jpg');
    } else {
      setMssv('');
      setFullName('');
      setClassCode('');
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
      openToast({ message: 'Đổi mật khẩu thành công', variant: 'success' });
      setError('');
      setOpenModal(false);
    } catch (err) {
      const message = err?.message || 'Xác thực OTP thất bại. Vui lòng thử lại.';
      setError(message);
    }
  };

  // Hàm xử lý chọn file ảnh
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  // Hàm cập nhật thông tin người dùng
  const handleUpdate = async () => {
    try {
      // Kiểm tra các trường bắt buộc
      if (!mssv || !fullName || !classCode || !birthDate || !phone || !email) {
        openToast({ message: 'Vui lòng điền đầy đủ thông tin', variant: 'danger' });
        return;
      }

      // Kiểm tra định dạng email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        openToast({ message: 'Email không hợp lệ', variant: 'danger' });
        return;
      }

      // Kiểm tra định dạng số điện thoại
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        openToast({ message: 'Số điện thoại không hợp lệ (phải có 10 chữ số)', variant: 'danger' });
        return;
      }

      // Tải ảnh đại diện lên Firebase Storage nếu có
      let avatarUrl = user?.AnhDaiDien || '';
      if (avatarFile) {
        avatarUrl = await fileToBase64(avatarFile);
      }

      if (!user?.uid) {
        openToast({ message: 'Không tìm thấy thông tin người dùng để cập nhật.', variant: 'danger' });
        return;
      }

      const updatedProfile = await updateProfileMutation.mutateAsync({
        userId: user.uid,
        payload: {
          MSSV: mssv,
          TenNguoiDung: fullName,
          Lop: classCode,
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
        MSSV: mssv,
        TenNguoiDung: fullName,
        Lop: classCode,
        NgaySinh: birthDate,
        Sdt: phone,
        email,
        AnhDaiDien: avatarUrl,
        token: user?.token || `mock-token-${updatedProfile.uid || user.uid}`,
      };

      updateUserStore(mergedUser);

      // Hiển thị thông báo thành công
      openToast({ message: 'Cập nhật thông tin thành công', variant: 'success' });
      setAvatarFile(null);
    } catch (err) {
      console.error('Lỗi khi cập nhật thông tin:', err);
      openToast({ message: 'Cập nhật thông tin thất bại', variant: 'danger' });
    }
  };

  return (
    <main className={cx('profile-page')}>
      {contextHolder}
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
          <label htmlFor="avatar-upload" className={cx('profile-page__media-upload')}>
            <span>Choose file</span>
            <span className={cx('profile-page__media-upload-text')}>
              {avatarFile ? avatarFile.name : 'Chưa file nào được chọn'}
            </span>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className={cx('profile-page__media-input')}
          />
          <button type="button" className={cx('profile-page__media-button')} onClick={handleOpenModal}>
            Đổi mật khẩu
          </button>
        </div>

        <section className={cx('profile-page__form')}>
          <h4 className={cx('profile-page__form-title')}>Thông tin</h4>
          <div className={cx('profile-page__form-fields')}>
            <TextField
              label="MSSV"
              placeholder="Nhập MSSV"
              variant="outlined"
              value={mssv}
              onChange={(e) => setMssv(e.target.value)}
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
              label="Lớp"
              placeholder="Nhập lớp"
              variant="outlined"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
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
            maxWidth: 700,
            bgcolor: '#d8d8f0',
            borderRadius: '16px',
            boxShadow: 24,
            p: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            overflow: 'auto',
            maxHeight: '90vh',
          }}
        >
          {!otpSent ? (
            <>
              <Typography className={cx('profile-page__modal-title')} sx={{ textAlign: 'center', mb: 1 }}>
                Đổi mật khẩu
              </Typography>

              <div className={cx('profile-page__form-fields')}>
                <TextField
                  label="Mật khẩu cũ"
                  placeholder="Mật khẩu cũ"
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
                  placeholder="Mật khẩu mới"
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

              {error && (
                <Typography variant="body2" color="error" sx={{ textAlign: 'center', mt: 1 }}>
                  {error}
                </Typography>
              )}

              <Button
                variant="contained"
                sx={{
                  bgcolor: '#00008b',
                  color: 'white',
                  mt: 2,
                  width: '140px',
                  height: '40px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'block',
                  margin: '16px auto 0 auto',
                  textTransform: 'none',
                  fontFamily: 'Montserrat, sans-serif',
                  '&:hover': {
                    bgcolor: '#000070',
                  },
                }}
                onClick={handleSendOtp}
                disabled={verifyCurrentPasswordMutation.isPending || requestOtpMutation.isPending}
              >
                {verifyCurrentPasswordMutation.isPending || requestOtpMutation.isPending ? 'Đang xử lý...' : 'Tiếp tục'}
              </Button>
            </>
          ) : (
            <>
              <Typography
                variant="body1"
                className={cx('profile-page__modal-note')}
                sx={{ textAlign: 'center', mb: 0.5 }}
              >
                Mã OTP được gửi qua E-mail
              </Typography>

              <Typography
                variant="body1"
                className={cx('profile-page__modal-email')}
                sx={{ textAlign: 'center', mb: 2 }}
              >
                {email || 'Không có email'}
              </Typography>

              <TextField
                label="Nhập mã OTP"
                placeholder="Nhập mã OTP"
                variant="outlined"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#d1d1d1',
                    },
                    '&:hover fieldset': {
                      borderColor: '#00008b',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00008b',
                      borderWidth: '2px',
                    },
                  },
                }}
              />

              {generatedOtp && (
                <Typography variant="body2" sx={{ textAlign: 'center', color: '#2e7d32', fontSize: '14px' }}>
                  Mã OTP mô phỏng: {generatedOtp}
                </Typography>
              )}

              {error && (
                <Typography variant="body2" color="error" sx={{ textAlign: 'center', mt: 1 }}>
                  {error}
                </Typography>
              )}

              <Button
                variant="contained"
                sx={{
                  bgcolor: '#00008b',
                  color: 'white',
                  mt: 2,
                  width: '140px',
                  height: '40px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'block',
                  margin: '16px auto 0 auto',
                  textTransform: 'none',
                  fontFamily: 'Montserrat, sans-serif',
                  '&:hover': {
                    bgcolor: '#000070',
                  },
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
