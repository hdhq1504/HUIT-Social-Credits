import React, { useState } from 'react';
import { Modal, Box, Button, Typography, TextField } from '@mui/material';
import classNames from 'classnames/bind';
import styles from './ChangePasswordModal.module.scss';
import { useEffect } from 'react';

const cx = classNames.bind(styles);

function ChangePasswordModal({ open, onClose, changePassword, onSuccess, userId }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!changePassword) {
      setError('Chức năng đổi mật khẩu chưa được cấu hình');
      return;
    }
    if (!oldPassword) return setError('Vui lòng nhập mật khẩu hiện tại');
    if (!newPassword) return setError('Vui lòng nhập mật khẩu mới');
    if (newPassword.length < 8) return setError('Mật khẩu mới phải có ít nhất 8 ký tự');
    if (newPassword !== confirmPassword) return setError('Mật khẩu mới và xác nhận không khớp');

    try {
      setSubmitting(true);
      await changePassword({ currentPassword: oldPassword, newPassword });
      setError('');
      onSuccess?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className={cx('change-password')}>
      <Box className={cx('change-password__box')}>
        <Typography className={cx('change-password__title')}>Đổi mật khẩu</Typography>

        <div className={cx('change-password__fields')}>
          <TextField
            label="Mật khẩu hiện tại"
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

        <Button className={cx('change-password__button')} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Đang xử lý...' : 'Cập nhật'}
        </Button>
      </Box>
    </Modal>
  );
}

export default ChangePasswordModal;
