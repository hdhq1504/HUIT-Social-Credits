import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth.api';

const normalizeUser = (user) => {
  if (!user) return null;
  const role = user.role || user.vaiTro || 'SINHVIEN';
  const fullName = user.fullName || user.hoTen || user.TenNguoiDung || user.name || user.email || '';
  return {
    ...user,
    role,
    fullName,
    TenNguoiDung: user.TenNguoiDung || fullName,
    hoTen: user.hoTen || fullName,
  };
};

const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      isLoggedIn: false,
      user: null,

      login: ({ accessToken, user }) => {
        set({
          accessToken,
          isLoggedIn: true,
          user: normalizeUser(user),
        });
      },

      setAccessToken: (token) => set({ accessToken: token }),

      updateUser: (user) =>
        set((state) => ({
          user: normalizeUser({ ...(state.user || {}), ...user }),
        })),

      logout: () => {
        set({ accessToken: null, isLoggedIn: false, user: null });
      },

      initialize: async () => {
        try {
          const user = await authApi.me();
          set((state) => ({
            isLoggedIn: !!state.accessToken,
            user: normalizeUser(user),
          }));
        } catch {
          set({ isLoggedIn: false, user: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        isLoggedIn: state.isLoggedIn,
        user: state.user,
      }),
    },
  ),
);

export default useAuthStore;
