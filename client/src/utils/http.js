import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true // gửi/nhận cookie refresh_token
});

// interceptor: tự refresh access token khi 401
let isRefreshing = false;
let pending = [];

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // hàng đợi chờ token
        return new Promise((resolve, reject) => {
          pending.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return http.request(original);
          });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await http.post("/auth/refresh", {});
        const newToken = data?.accessToken;
        pending.forEach(p => p.resolve(newToken));
        pending = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return http.request(original);
      } catch (e) {
        pending.forEach(p => p.reject(e));
        pending = [];
        throw e;
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default http;
