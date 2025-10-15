import axios from 'axios';
import useAuthStore from '../stores/useAuthStore';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  withCredentials: true, // gửi/nhận cookie refresh_token
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pending = [];

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pending.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return http.request(original);
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await http.post('/auth/refresh', {});
        const newToken = data?.accessToken;
        if (newToken) {
          useAuthStore.getState().setAccessToken(newToken);
        }
        pending.forEach((p) => p.resolve(newToken));
        pending = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return http.request(original);
      } catch (e) {
        pending.forEach((p) => p.reject(e));
        pending = [];
        throw e;
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default http;
