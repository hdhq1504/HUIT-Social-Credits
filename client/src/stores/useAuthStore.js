import { create } from 'zustand';

const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') return null;
  const { token, ...rest } = user;
  return {
    ...rest,
    TenNguoiDung: rest.TenNguoiDung ?? rest.fullName ?? rest.name ?? rest.email ?? '',
  };
};

const persistAuthState = (user, accessToken, isLoggedIn) => {
  if (isLoggedIn) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(user ?? null));
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
  } else {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  }
};

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isLoggedIn: false,
  loading: true,
  initialize: () => {
    set({ loading: true });
    const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUser = localStorage.getItem('user');
    const storedAccessToken = localStorage.getItem('accessToken');

    if (storedIsLoggedIn && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        set({ user: parsedUser, accessToken: storedAccessToken || null, isLoggedIn: true, loading: false });
        return;
      } catch (error) {
        console.warn('Không thể khôi phục người dùng từ localStorage:', error);
      }
    }

    persistAuthState(null, null, false);
    set({ user: null, accessToken: null, isLoggedIn: false, loading: false });
  },
  setAccessToken: (token) => {
    set((state) => {
      persistAuthState(state.user, token, state.isLoggedIn);
      return { accessToken: token };
    });
  },
  login: (payload) => {
    const hasUserObject = payload && typeof payload === 'object' && 'user' in payload;
    const rawUser = hasUserObject ? payload.user : payload;
    const { token: rawToken, ...restUser } = rawUser || {};
    const user = hasUserObject ? rawUser : rawUser ? restUser : null;
    const accessToken = hasUserObject ? (payload.accessToken ?? null) : (rawToken ?? null);
    const normalizedUser = normalizeUser(user);
    persistAuthState(normalizedUser, accessToken, true);
    set({ user: normalizedUser, accessToken, isLoggedIn: true, loading: false });
  },
  updateUser: (updates) =>
    set((state) => {
      const nextUser = normalizeUser(state.user ? { ...state.user, ...updates } : { ...updates });
      persistAuthState(nextUser, state.accessToken, true);
      return { user: nextUser };
    }),
  logout: () => {
    persistAuthState(null, null, false);
    set({ user: null, accessToken: null, isLoggedIn: false, loading: false });
  },
}));

export default useAuthStore;
