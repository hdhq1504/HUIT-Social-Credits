import http from '../utils/http';
import useAuthStore from '../stores/useAuthStore';

export const authApi = {
  /**
   * Đăng nhập người dùng.
   * @param {string} email - Email đăng nhập.
   * @param {string} password - Mật khẩu.
   * @returns {Promise<Object>} Thông tin người dùng sau khi đăng nhập.
   */
  login: async (email, password) => {
    const { data } = await http.post('/auth/login', { email, password });
    // lưu access token vào store để gắn Authorization cho các request sau
    useAuthStore.getState().login(data);
    return data.user;
  },

  /**
   * Lấy thông tin người dùng hiện tại (Me).
   * @returns {Promise<Object>} Thông tin người dùng.
   */
  me: async () => {
    const { data } = await http.get('/auth/me');
    useAuthStore.getState().updateUser(data.user);
    return data.user;
  },

  /**
   * Đăng xuất người dùng.
   * @returns {Promise<void>}
   */
  logout: async () => {
    await http.post('/auth/logout', {});
    useAuthStore.getState().logout();
  },

  /**
   * Yêu cầu đặt lại mật khẩu (Gửi OTP qua email).
   * @param {string} email - Email tài khoản cần khôi phục.
   * @returns {Promise<Object>} Kết quả yêu cầu.
   */
  requestPasswordReset: async (email) => {
    const { data } = await http.post('/auth/forgot-password/request', { email });
    return data;
  },

  /**
   * Xác thực mã OTP đặt lại mật khẩu.
   * @param {string} email - Email tài khoản.
   * @param {string} otp - Mã OTP nhận được.
   * @returns {Promise<Object>} Kết quả xác thực.
   */
  verifyPasswordResetOtp: async (email, otp) => {
    const { data } = await http.post('/auth/forgot-password/verify', { email, otp });
    return data;
  },

  /**
   * Đặt lại mật khẩu mới bằng OTP.
   * @param {string} email - Email tài khoản.
   * @param {string} otp - Mã OTP đã xác thực.
   * @param {string} newPassword - Mật khẩu mới.
   * @returns {Promise<Object>} Kết quả đặt lại mật khẩu.
   */
  resetPasswordWithOtp: async (email, otp, newPassword) => {
    const { data } = await http.post('/auth/forgot-password/reset', { email, otp, newPassword });
    return data;
  },
};
