import React, { useState } from 'react';
import { Modal, Box, Button, Typography, TextField } from '@mui/material';
import classNames from 'classnames/bind';
import styles from './ChangePasswordModal.module.scss';

const cx = classNames.bind(styles);

function ChangePasswordModal({
  open,
  onClose,
  email,
  verifyCurrentPassword,
  requestOtp,
  verifyOtp,
  resetPassword,
  loginAfterReset,
  onSuccess,
  userId,
}) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!oldPassword) return setError('Vui lòng nhập mật khẩu cũ');
    if (!newPassword || !confirmPassword) return setError('Vui lòng nhập mật khẩu mới và xác nhận mật khẩu');
    if (newPassword !== confirmPassword) return setError('Mật khẩu mới và xác nhận mật khẩu không khớp');

    try {
      if (verifyCurrentPassword && userId) {
        const ok = await verifyCurrentPassword({ userId, password: oldPassword });
        if (!ok) return setError('Mật khẩu cũ không đúng');
      }
      if (!requestOtp) {
        setGeneratedOtp('123456');
        setOtpSent(true);
        setError('');
        return;
      }
      const { otp: newOtp } = await requestOtp(email);
      setGeneratedOtp(newOtp);
      setOtpSent(true);
      setError('');
    } catch (e) {
      setError(e?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    }
  };

  const handleSubmit = async () => {
    if (!otp) return setError('Vui lòng nhập mã OTP');
    try {
      if (verifyOtp) await verifyOtp({ email, otp });
      if (resetPassword) await resetPassword({ email, newPassword });
      let userInfo = null;
      if (loginAfterReset) {
        userInfo = await loginAfterReset({ email, password: newPassword });
      }
      onSuccess?.(userInfo || null);
      setError('');
      onClose?.();
    } catch (e) {
      setError(e?.message || 'Xác thực OTP thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} className={cx('change-password')}>
      <Box className={cx('change-password__box')}>
        {!otpSent ? (
          <>
            <Typography className={cx('change-password__title')}>Đổi mật khẩu</Typography>

            <div className={cx('change-password__fields')}>
              <TextField
                label="Mật khẩu cũ"
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

            {error && <Typography className={cx('change-password__error')}>{error}</Typography>}

            <Button className={cx('change-password__button')} onClick={handleSendOtp}>
              Tiếp tục
            </Button>
          </>
        ) : (
          <>
            <Typography className={cx('change-password__note')}>Mã OTP được gửi qua E-mail</Typography>
            <Typography className={cx('change-password__email')}>{email || 'Không có email'}</Typography>

            <TextField
              label="Nhập mã OTP"
              variant="outlined"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              fullWidth
              className={cx('change-password__otp-input')}
            />

            {generatedOtp && (
              <Typography className={cx('change-password__info')}>Mã OTP mô phỏng: {generatedOtp}</Typography>
            )}

            {error && <Typography className={cx('change-password__error')}>{error}</Typography>}

            <Button className={cx('change-password__button')} onClick={handleSubmit}>
              Xác nhận
            </Button>
          </>
        )}
      </Box>
    </Modal>
  );
}

export default ChangePasswordModal;
