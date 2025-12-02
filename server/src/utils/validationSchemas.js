import * as yup from 'yup';

const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
const studentCodeRegex = /^[a-zA-Z0-9]{8,20}$/;

export const loginSchema = yup.object({
  email: yup.string().required('Email là bắt buộc').test('email-format', 'Email không hợp lệ', function (value) {
    if (!value) return true;
    if (value === 'Admin') return true;
    return yup.string().email().isValidSync(value);
  }),
  password: yup.string().required('Mật khẩu là bắt buộc'),
});

export const requestPasswordResetSchema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
});

export const verifyPasswordResetOtpSchema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  otp: yup.string().required('Mã OTP là bắt buộc'),
});

export const resetPasswordWithOtpSchema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  otp: yup.string().required('Mã OTP là bắt buộc'),
  newPassword: yup.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').required('Mật khẩu mới là bắt buộc'),
});

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Mật khẩu hiện tại là bắt buộc'),
  newPassword: yup.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').required('Mật khẩu mới là bắt buộc'),
});

export const createStudentSchema = yup.object({
  maSV: yup.string().matches(studentCodeRegex, 'Mã sinh viên không hợp lệ').required('Mã sinh viên là bắt buộc'),
  hoTen: yup.string().required('Họ tên là bắt buộc'),
  email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
  password: yup.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').required('Mật khẩu là bắt buộc'),
  lopHocId: yup.string().nullable(),
  ngaySinh: yup.date().nullable(),
  gioiTinh: yup.string().oneOf(['Nam', 'Nữ', 'Khác'], 'Giới tính không hợp lệ').required('Giới tính là bắt buộc'),
  soDT: yup.string().matches(phoneRegex, 'Số điện thoại không hợp lệ').nullable(),
});

export const updateStudentSchema = yup.object({
  maSV: yup.string().matches(studentCodeRegex, 'Mã sinh viên không hợp lệ'),
  hoTen: yup.string(),
  email: yup.string().email('Email không hợp lệ'),
  lopHocId: yup.string().nullable(),
  ngaySinh: yup.date().nullable(),
  gioiTinh: yup.string().oneOf(['Nam', 'Nữ', 'Khác'], 'Giới tính không hợp lệ'),
  soDT: yup.string().matches(phoneRegex, 'Số điện thoại không hợp lệ').nullable(),
  isActive: yup.boolean(),
});
