import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { TextField } from '@mui/material';
import ChangePasswordModal from '@components/ChangePasswordModal/ChangePasswordModal';
import Label from '@components/Label/Label';
import useToast from '@components/Toast/Toast';
import styles from './ProfilePage.module.scss';
import useAuthStore from '@stores/useAuthStore';
import http from '@utils/http';

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

  // Lấy thông tin người dùng từ Zustand
  const user = useAuthStore((state) => state.user);
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

  // Lấy profile từ API /auth/me
  const {
    data: meData,
    isLoading: isMeLoading,
    isError: isMeError,
  } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await http.get('/auth/me');
      return data?.user ?? null;
    },
  });

  // Khi nhận dữ liệu từ API -> đổ vào form và đồng bộ Zustand
  useEffect(() => {
    if (!meData) return;
    setMssv(meData.studentCode || '');
    setFullName(meData.fullName || '');
    setClassCode(meData.classCode || '');
    const dob = meData.dateOfBirth ? String(meData.dateOfBirth).slice(0, 10) : '';
    setBirthDate(dob);
    setPhone(meData.phoneNumber || '');
    setEmail(meData.email || '');
    setAvatarPreview(meData.avatarUrl || '/images/no-image.jpg');

    updateUserStore({
      id: meData.id,
      email: meData.email,
      TenNguoiDung: meData.fullName,
      MSSV: meData.studentCode,
      Lop: meData.classCode,
      NgaySinh: meData.dateOfBirth,
      Sdt: meData.phoneNumber,
      AnhDaiDien: meData.avatarUrl,
    });
  }, [meData, updateUserStore]);

  // Hàm mở/đóng modal
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  // Callback sau khi đổi mật khẩu thành công
  const handleChangePasswordSuccess = (userInfo) => {
    openToast({ message: 'Đổi mật khẩu thành công', variant: 'success' });
    // nếu cần đăng nhập lại bằng thông tin mới:
    // if (userInfo) loginUser(userInfo);
  };

  // Hàm đổi avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setAvatarFile(file);
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
              InputProps={{ readOnly: true }}
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
              InputProps={{ readOnly: true }}
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
              InputProps={{ readOnly: true }}
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
              InputProps={{ readOnly: true }}
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
              InputProps={{ readOnly: true }}
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
              InputProps={{ readOnly: true }}
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
          <button type="button" className={cx('profile-page__form-submit')} onClick={handleUpdate}>
            Cập nhật
          </button>
        </section>
      </section>

      <ChangePasswordModal
        open={openModal}
        onClose={handleCloseModal}
        email={email}
        userId={user?.uid}
        //  verifyCurrentPassword={({ userId, password }) => verifyCurrentPasswordMutation.mutateAsync({ userId, password })}
        //  requestOtp={(email) => requestOtpMutation.mutateAsync(email)}
        //  verifyOtp={({ email, otp }) => verifyOtpMutation.mutateAsync({ email, otp })}
        //  resetPassword={({ email, newPassword }) => resetPasswordMutation.mutateAsync({ email, newPassword })}
        //  loginAfterReset={({ email, password }) => loginAfterResetMutation.mutateAsync({ email, password })}
        onSuccess={handleChangePasswordSuccess}
      />
    </main>
  );
}

export default ProfilePage;
