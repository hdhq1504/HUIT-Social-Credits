import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { TextField } from '@mui/material';
import dayjs from 'dayjs';
import { ChangePasswordModal, FaceRegistrationModal, Label, useToast } from '@components/index';
import Loading from '../Loading/Loading';
import useAuthStore from '@stores/useAuthStore';
import http from '@utils/http';
import { ROUTE_PATHS } from '@/config/routes.config';
import faceApi from '@api/face.api';
import styles from './ProfilePage.module.scss';

const cx = classNames.bind(styles);

function ProfilePage() {
  const [openModal, setOpenModal] = useState(false);
  const [openFaceModal, setOpenFaceModal] = useState(false);

  // Lấy thông tin người dùng từ Zustand
  const updateUserStore = useAuthStore((state) => state.updateUser);

  // State để quản lý thông tin người dùng (cho phép chỉnh sửa)
  const [mssv, setMssv] = useState('');
  const [fullName, setFullName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [faculty, setFaculty] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('/images/no-image.jpg');
  const { contextHolder, open: openToast } = useToast();

  // Lấy profile từ API /auth/me
  const { data: meData, isLoading: loadingProfile } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await http.get('/auth/me');
      return data?.user ?? null;
    },
  });

  const {
    data: faceProfile,
    isFetching: faceProfileLoading,
    refetch: refetchFaceProfile,
  } = useQuery({
    queryKey: ['face-profile'],
    queryFn: async () => {
      const data = await faceApi.status();
      return data;
    },
    staleTime: 60 * 1000,
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const { data } = await http.post('/auth/change-password', { currentPassword, newPassword });
      return data;
    },
  });

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
    } catch (error) {
      const message = error?.response?.data?.error || 'Không thể đổi mật khẩu. Vui lòng thử lại.';
      throw new Error(message);
    }
  };

  // Khi nhận dữ liệu từ API -> đổ vào form và đồng bộ Zustand
  useEffect(() => {
    if (!meData) return;
    setMssv(meData.studentCode || '');
    setFullName(meData.fullName || '');
    setClassCode(meData.classCode || '');
    const dob = meData.dateOfBirth ? dayjs(meData.dateOfBirth).format('DD/MM/YYYY') : '';
    setBirthDate(dob);
    setPhone(meData.phoneNumber || '');
    setEmail(meData.email || '');
    const genderValue = (() => {
      const raw = meData.gender;
      if (!raw) return '';
      const normalized = String(raw).trim().toLowerCase();
      if (['male', 'nam', 'm'].includes(normalized)) return 'Nam';
      if (['female', 'nữ', 'nu', 'f'].includes(normalized)) return 'Nữ';
      return String(raw);
    })();
    setGender(genderValue);
    setFaculty(meData.departmentCode || '');
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
      GioiTinh: genderValue,
      Khoa: meData.departmentCode,
    });
  }, [meData, updateUserStore]);

  // Hàm mở/đóng modal
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  const handleCloseFaceModal = () => setOpenFaceModal(false);

  // Callback sau khi đổi mật khẩu thành công
  const handleChangePasswordSuccess = () => {
    openToast({ message: 'Đổi mật khẩu thành công', variant: 'success' });
    setOpenModal(false);
    // nếu cần đăng nhập lại bằng thông tin mới:
    // if (userInfo) loginUser(userInfo);
  };

  if (loadingProfile) {
    return (
      <main className={cx('profile-page')}>
        {contextHolder}
        <Loading message="Đang tải thông tin sinh viên" />
      </main>
    );
  }

  return (
    <main className={cx('profile-page')}>
      {contextHolder}
      <header className={cx('profile-page__header')}>
        <nav className={cx('profile-page__breadcrumb')} aria-label="Breadcrumb">
          <Link to={ROUTE_PATHS.PUBLIC.HOME}>Trang chủ</Link> / <span>Thông tin</span>
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
          <button
            type="button"
            className={cx('profile-page__media-button', 'profile-page__media-button--secondary')}
            onClick={() => setOpenFaceModal(true)}
          >
            {faceProfile?.registered ? 'Cập nhật khuôn mặt' : 'Đăng ký khuôn mặt'}
          </button>
          <p className={cx('profile-page__face-status')}>
            {faceProfileLoading
              ? 'Đang kiểm tra trạng thái khuôn mặt...'
              : faceProfile?.registered
                ? `Đã đăng ký ${faceProfile.descriptorsCount || 0} mẫu vào ${
                    faceProfile.updatedAt ? dayjs(faceProfile.updatedAt).format('DD/MM/YYYY HH:mm') : '---'
                  }`
                : 'Bạn chưa đăng ký khuôn mặt.'}
          </p>
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
              label="Giới tính"
              placeholder="Nhập giới tính"
              variant="outlined"
              value={gender || 'Đang cập nhật'}
              InputProps={{ readOnly: true }}
              onChange={(e) => setGender(e.target.value)}
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
              label="Khoa"
              placeholder="Nhập khoa"
              variant="outlined"
              value={faculty || 'Đang cập nhật'}
              InputProps={{ readOnly: true }}
              onChange={(e) => setFaculty(e.target.value)}
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
        </section>
      </section>

      <ChangePasswordModal
        open={openModal}
        onClose={handleCloseModal}
        changePassword={handleChangePassword}
        onSuccess={handleChangePasswordSuccess}
      />

      <FaceRegistrationModal
        open={openFaceModal}
        onClose={handleCloseFaceModal}
        onSuccess={() => {
          refetchFaceProfile();
          setOpenFaceModal(false);
        }}
      />
    </main>
  );
}

export default ProfilePage;
