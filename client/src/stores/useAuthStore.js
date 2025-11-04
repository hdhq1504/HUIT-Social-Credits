import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth.api';

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
          user: {
            ...user,
            role: user.role || 'SINHVIEN'
          }
        });
      },

      setAccessToken: (token) => set({ accessToken: token }),

      updateUser: (user) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : user
        })),

      logout: () => {
        set({ accessToken: null, isLoggedIn: false, user: null });
      },

      initialize: async () => {
        try {
          const user = await authApi.me();
          set((state) => ({
            isLoggedIn: !!state.accessToken,
            user: {
              ...user,
              role: user.role || 'SINHVIEN'
            }
          }));
        } catch {
          set({ isLoggedIn: false, user: null });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        isLoggedIn: state.isLoggedIn,
        user: state.user
      })
    }
  )
);

export default useAuthStore;