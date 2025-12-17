import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { Modal, Alert, Progress, Spin, message } from 'antd';
import Webcam from 'react-webcam';
import { TextField } from '@mui/material';
import dayjs from 'dayjs';
import { ChangePasswordModal, Label, useToast } from '@components/index';
import Loading from '../Loading/Loading';
import useAuthStore from '@stores/useAuthStore';
import http from '@utils/http';
import { ROUTE_PATHS } from '@/config/routes.config';
import faceProfileApi from '@api/faceProfile.api';
import { computeDescriptorFromDataUrl, ensureModelsLoaded } from '@/services/faceApiService';
import styles from './ProfilePage.module.scss';

const cx = classNames.bind(styles);

const MIN_FACE_SAMPLES = 3;
const MAX_FACE_SAMPLES = 5;

function FaceEnrollmentModal({ open, onCancel, onSave, isSaving, isModelsLoading, modelsReady, modelError }) {
  const [samples, setSamples] = useState([]);
  const [captureError, setCaptureError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const webcamRef = useRef(null);
  const samplesRef = useRef([]);

  useEffect(() => {
    samplesRef.current = samples;
  }, [samples]);

  useEffect(() => {
    if (open) {
      setSamples([]);
      setCaptureError(null);
      setIsAnalyzing(false);
    }
  }, [open]);

  const handleCapture = async () => {
    if (isAnalyzing) return;
    if (samplesRef.current.length >= MAX_FACE_SAMPLES) {
      message.warning(`Bạn chỉ có thể lưu tối đa ${MAX_FACE_SAMPLES} ảnh mẫu.`);
      return;
    }
    if (!modelsReady) {
      setCaptureError('Mô hình nhận diện đang tải. Vui lòng thử lại sau giây lát.');
      return;
    }
    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) {
      message.error('Không thể chụp ảnh. Hãy kiểm tra lại camera hoặc thử lại.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const descriptor = await computeDescriptorFromDataUrl(screenshot);
      if (!descriptor?.length) {
        setCaptureError('Không phát hiện khuôn mặt rõ ràng. Hãy điều chỉnh ánh sáng và thử lại.');
        return;
      }
      setSamples((prev) => [
        ...prev,
        {
          id: Date.now(),
          dataUrl: screenshot,
          descriptor,
        },
      ]);
      setCaptureError(null);
    } catch (error) {
      console.error('Không thể phân tích khuôn mặt từ camera', error);
      setCaptureError('Không thể phân tích khuôn mặt. Vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveSample = (id) => {
    setSamples((prev) => prev.filter((sample) => sample.id !== id));
  };

  const handleSubmit = async () => {
    if (isAnalyzing) return;
    if (samples.length < MIN_FACE_SAMPLES) {
      setCaptureError(`Hãy cung cấp tối thiểu ${MIN_FACE_SAMPLES} ảnh khuôn mặt rõ nét.`);
      return;
    }
    try {
      await onSave({
        descriptors: samples.map((sample) => sample.descriptor),
        samples: samples.map((sample) => sample.dataUrl),
      });
    } catch (error) {
      const messageText = error?.message || 'Không thể lưu hồ sơ khuôn mặt. Vui lòng thử lại.';
      setCaptureError(messageText);
    }
  };

  const progressPercent = Math.min(100, Math.round((samples.length / MIN_FACE_SAMPLES) * 100));

  return (
    <Modal
      open={open}
      title="Đăng ký khuôn mặt"
      onCancel={() => {
        if (!isSaving && !isAnalyzing) {
          onCancel();
        }
      }}
      onOk={handleSubmit}
      okText="Lưu hồ sơ"
      cancelText="Hủy"
      okButtonProps={{
        loading: isSaving,
        disabled: isModelsLoading || !modelsReady || isAnalyzing || samples.length < MIN_FACE_SAMPLES,
      }}
      cancelButtonProps={{ disabled: isSaving || isAnalyzing }}
      maskClosable={!(isSaving || isAnalyzing)}
      destroyOnClose
      centered
      className={cx('profile-page__face-modal')}
    >
      <div className={cx('profile-page__face-modal-body')}>
        <Alert
          type="info"
          message={`Chụp hoặc tải lên tối thiểu ${MIN_FACE_SAMPLES} ảnh khuôn mặt ở các góc độ khác nhau để tăng độ chính xác.`}
          showIcon
        />

        {modelError && (
          <Alert type="error" message={modelError} showIcon className={cx('profile-page__face-modal-alert')} />
        )}

        <div className={cx('profile-page__face-modal-camera')}>
          <div className={cx('profile-page__face-modal-preview')}>
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored
              screenshotFormat="image/jpeg"
              imageSmoothing
              className={cx('profile-page__face-modal-webcam')}
              videoConstraints={{ facingMode: 'user' }}
            />
            {(isModelsLoading || isAnalyzing) && (
              <div className={cx('profile-page__face-modal-overlay')}>
                <Spin tip={isModelsLoading ? 'Đang tải mô hình...' : 'Đang xử lý ảnh...'} />
              </div>
            )}
          </div>

          <div className={cx('profile-page__face-modal-actions')}>
            <button
              type="button"
              className={cx('profile-page__face-modal-button')}
              onClick={handleCapture}
              disabled={!modelsReady || isModelsLoading || isAnalyzing}
            >
              Chụp ảnh
            </button>
          </div>
        </div>

        <div className={cx('profile-page__face-modal-progress')}>
          <Progress percent={progressPercent} showInfo={false} />
          <span>
            Đã có {samples.length}/{MIN_FACE_SAMPLES} ảnh tối thiểu (tối đa {MAX_FACE_SAMPLES} ảnh).
          </span>
        </div>

        {captureError && (
          <Alert type="warning" message={captureError} showIcon className={cx('profile-page__face-modal-alert')} />
        )}

        <div className={cx('profile-page__face-modal-samples')}>
          {samples.map((sample) => (
            <div key={sample.id} className={cx('profile-page__face-modal-sample')}>
              <img src={sample.dataUrl} alt="Ảnh mẫu khuôn mặt" />
              <button
                type="button"
                className={cx('profile-page__face-modal-remove')}
                onClick={() => handleRemoveSample(sample.id)}
                disabled={isAnalyzing || isSaving}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function ProfilePage() {
  const [openModal, setOpenModal] = useState(false);
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isFaceModelsLoading, setIsFaceModelsLoading] = useState(false);
  const [faceModelsReady, setFaceModelsReady] = useState(false);
  const [faceModelError, setFaceModelError] = useState(null);

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
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 30 * 1000, // 30 seconds
  });

  const {
    data: faceProfile,
    isLoading: loadingFaceProfile,
    refetch: refetchFaceProfile,
    isFetching: isFetchingFaceProfile,
  } = useQuery({
    queryKey: ['face-profile'],
    queryFn: faceProfileApi.get,
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const { data } = await http.post('/auth/change-password', { currentPassword, newPassword });
      return data;
    },
  });

  const faceProfileMutation = useMutation({
    mutationFn: (payload) => faceProfileApi.upsert(payload),
  });

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
    } catch (error) {
      const message = error?.response?.data?.error || 'Không thể đổi mật khẩu. Vui lòng thử lại.';
      throw new Error(message);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (isFaceModalOpen) {
      setFaceModelsReady(false);
      setFaceModelError(null);
      setIsFaceModelsLoading(true);
      ensureModelsLoaded()
        .then(() => {
          if (!cancelled) {
            setFaceModelsReady(true);
            setFaceModelError(null);
          }
        })
        .catch((error) => {
          console.error('Không thể tải mô hình nhận diện khuôn mặt', error);
          if (!cancelled) {
            setFaceModelsReady(false);
            setFaceModelError('Không thể tải mô hình nhận diện khuôn mặt. Kiểm tra kết nối mạng và thử lại.');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsFaceModelsLoading(false);
          }
        });
    } else {
      setFaceModelsReady(false);
      setFaceModelError(null);
    }

    return () => {
      cancelled = true;
    };
  }, [isFaceModalOpen]);

  const faceEnrollmentSummary = faceProfile ?? { enrolled: false, sampleCount: 0, updatedAt: null };
  const faceUpdatedAtLabel = faceEnrollmentSummary.updatedAt
    ? dayjs(faceEnrollmentSummary.updatedAt).format('HH:mm DD/MM/YYYY')
    : null;
  const isFaceProfileLoading = loadingFaceProfile || isFetchingFaceProfile;
  const isSavingFaceProfile = faceProfileMutation.isPending;

  const handleOpenFaceEnrollment = () => {
    setFaceModelError(null);
    setIsFaceModalOpen(true);
  };

  const handleCloseFaceEnrollment = () => {
    if (!isSavingFaceProfile) {
      setIsFaceModalOpen(false);
    }
  };

  const handleSaveFaceProfile = async ({ descriptors, samples }) => {
    try {
      await faceProfileMutation.mutateAsync({ descriptors, samples });
      await refetchFaceProfile();
      openToast({ message: 'Cập nhật hồ sơ khuôn mặt thành công!', variant: 'success' });
      setIsFaceModalOpen(false);
    } catch (error) {
      const messageText =
        error?.response?.data?.error || error?.message || 'Không thể cập nhật hồ sơ khuôn mặt. Vui lòng thử lại.';
      throw new Error(messageText);
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
      avatarUrl: meData.avatarUrl,
      GioiTinh: genderValue,
      Khoa: meData.departmentCode,
    });
  }, [meData, updateUserStore]);

  // Hàm mở/đóng modal
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

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
          <p className={cx('profile-page__media-hint')}>
            Liên hệ ban quản trị nếu bạn cần hỗ trợ cập nhật thông tin tài khoản hoặc ảnh điểm danh.
          </p>

          <div className={cx('profile-page__face-card')}>
            <div className={cx('profile-page__face-header')}>
              <h5 className={cx('profile-page__face-title')}>Hồ sơ khuôn mặt</h5>
              {isFaceProfileLoading ? (
                <Spin size="small" />
              ) : (
                <span
                  className={cx('profile-page__face-status', {
                    'profile-page__face-status--enrolled': faceEnrollmentSummary.enrolled,
                  })}
                >
                  {faceEnrollmentSummary.enrolled ? 'Đã đăng ký' : 'Chưa đăng ký'}
                </span>
              )}
            </div>
            <ul className={cx('profile-page__face-meta')}>
              <li>
                Ảnh đã lưu:{' '}
                <strong>
                  {faceEnrollmentSummary.sampleCount ?? 0}/{MAX_FACE_SAMPLES}
                </strong>
              </li>
              <li>Tối thiểu yêu cầu {MIN_FACE_SAMPLES} ảnh.</li>
              {faceUpdatedAtLabel && <li>Cập nhật lần cuối: {faceUpdatedAtLabel}</li>}
            </ul>
            <button
              type="button"
              className={cx('profile-page__face-button')}
              onClick={handleOpenFaceEnrollment}
              disabled={isSavingFaceProfile}
            >
              {faceEnrollmentSummary.enrolled ? 'Cập nhật ảnh khuôn mặt' : 'Đăng ký khuôn mặt'}
            </button>
          </div>
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

      <FaceEnrollmentModal
        open={isFaceModalOpen}
        onCancel={handleCloseFaceEnrollment}
        onSave={handleSaveFaceProfile}
        isSaving={isSavingFaceProfile}
        isModelsLoading={isFaceModelsLoading}
        modelsReady={faceModelsReady}
        modelError={faceModelError}
      />
    </main>
  );
}

export default ProfilePage;
