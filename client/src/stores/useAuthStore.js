import { create } from 'zustand';

const persistAuthState = (user, isLoggedIn) => {
  if (isLoggedIn) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(user));
    if (user?.token) {
      localStorage.setItem('accessToken', user.token);
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
  isLoggedIn: false,
  loading: true,
  initialize: () => {
    set({ loading: true });
    const storedIsLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUser = localStorage.getItem('user');

    if (storedIsLoggedIn && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        set({ user: parsedUser, isLoggedIn: true, loading: false });
        return;
      } catch (error) {
        console.warn('Không thể khôi phục người dùng từ localStorage:', error);
      }
    }

    persistAuthState(null, false);
    set({ user: null, isLoggedIn: false, loading: false });
  },
  login: (user) => {
    persistAuthState(user, true);
    set({ user, isLoggedIn: true, loading: false });
  },
  updateUser: (updates) =>
    set((state) => {
      const nextUser = state.user ? { ...state.user, ...updates } : { ...updates };
      persistAuthState(nextUser, true);
      return { user: nextUser };
    }),
  logout: () => {
    persistAuthState(null, false);
    set({ user: null, isLoggedIn: false, loading: false });
  },
}));

export default useAuthStore;
