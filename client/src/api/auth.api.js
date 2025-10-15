import http from '../utils/http';
import useAuthStore from '../stores/useAuthStore';

export const authApi = {
  login: async (email, password) => {
    const { data } = await http.post('/auth/login', { email, password });
    // lưu access token vào store để gắn Authorization cho các request sau
    useAuthStore.getState().login(data);
    return data.user;
  },
  me: async () => {
    const { data } = await http.get('/auth/me');
    useAuthStore.getState().updateUser(data.user);
    return data.user;
  },
  logout: async () => {
    await http.post('/auth/logout', {});
    useAuthStore.getState().logout();
  },
};
